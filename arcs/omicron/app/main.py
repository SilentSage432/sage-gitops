import os, json, uuid, asyncio, datetime as dt
from typing import Optional
from fastapi import FastAPI, Body, Query, HTTPException
from pydantic import BaseModel, Field
import psycopg
from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

APP_VERSION = os.getenv("SERVICE_VERSION", "dev")

def pg_dsn_from_env():
    dsn = os.getenv("OMICRON_DSN")
    if dsn:
        return dsn
    host = os.getenv("OMICRON_PGHOST", "kappa-postgres.arc-kappa.svc.cluster.local")
    port = int(os.getenv("OMICRON_PGPORT", "5432"))
    db   = os.getenv("OMICRON_PGDATABASE", "sage_os")
    user = os.getenv("OMICRON_PGUSER", "sage_user")
    pwd  = os.getenv("OMICRON_PGPASSWORD", "")
    return f"host={host} port={port} dbname={db} user={user} password={pwd}"

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS omicron_events (
  id UUID PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  arc TEXT NOT NULL,
  source TEXT NOT NULL,
  payload JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS omicron_events_ts_idx ON omicron_events (ts DESC);
CREATE INDEX IF NOT EXISTS omicron_events_arc_idx ON omicron_events (arc);
CREATE INDEX IF NOT EXISTS omicron_events_source_idx ON omicron_events (source);
"""

app = FastAPI(title="Arc Omicron API", version=APP_VERSION)

_pool: Optional[AsyncConnectionPool] = None
_db_ready: bool = False

async def _init_schema_with_retries():
    global _db_ready
    dsn = pg_dsn_from_env()
    for attempt in range(30):  # ~30 * 2s = 60s
        try:
            async with _pool.connection() as conn:
                async with conn.cursor() as cur:
                    await cur.execute(CREATE_TABLE_SQL)
                await conn.commit()
            _db_ready = True
            print("[omicron] DB schema ready")
            return
        except Exception as e:
            print(f"[omicron] DB init retry {attempt+1}/30: {e}")
            await asyncio.sleep(2)
    print("[omicron] DB still not ready after retries")

@app.on_event("startup")
async def on_startup():
    # Create pool WITHOUT opening connections; don't block server startup
    global _pool
    _pool = AsyncConnectionPool(pg_dsn_from_env(), min_size=0, max_size=5, open=False)
    # Kick off schema init in background
    asyncio.create_task(_init_schema_with_retries())

@app.on_event("shutdown")
async def on_shutdown():
    if _pool:
        await _pool.close()

@app.get("/health")
async def health():
    status = "ok" if _db_ready else "degraded"
    return {"status": status, "arc": "omicron", "role": "archive"}

class ArchiveIn(BaseModel):
    arc: str
    source: str
    payload: dict

@app.post("/archive/write")
async def archive_write(ev: ArchiveIn = Body(...)):
    try:
        async with _pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "INSERT INTO omicron_events (id, arc, source, payload) VALUES (%s, %s, %s, %s)",
                    (str(uuid.uuid4()), ev.arc, ev.source, json.dumps(ev.payload)),
                )
            await conn.commit()
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"write failed: {e}")

@app.get("/archive/query")
async def archive_query(
    since: Optional[str] = Query(None),
    until: Optional[str] = Query(None),
    arc: Optional[str]   = Query(None),
    source: Optional[str]= Query(None),
    limit: int = Query(100, ge=1, le=1000),
):
    where, params = [], []
    if since: where.append("ts >= %s"); params.append(since)
    if until: where.append("ts <= %s"); params.append(until)
    if arc:   where.append("arc = %s"); params.append(arc)
    if source:where.append("source = %s"); params.append(source)
    sql = "SELECT id, ts, arc, source, payload FROM omicron_events"
    if where: sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY ts DESC LIMIT %s"; params.append(limit)
    try:
        async with _pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(sql, params)
                rows = await cur.fetchall()
        return {"count": len(rows), "items": rows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"query failed: {e}")
