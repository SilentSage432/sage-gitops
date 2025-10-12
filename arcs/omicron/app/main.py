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
_pool: AsyncConnectionPool | None = None

async def init_db():
    global _pool
    dsn = pg_dsn_from_env()
    # Create pool; open=True pre-creates min_size connections
    _pool = AsyncConnectionPool(dsn, min_size=1, max_size=5, open=True)

    # Ensure schema; tolerate transient failures
    async with _pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(CREATE_TABLE_SQL)
        await conn.commit()

@app.on_event("startup")
async def on_startup():
    # Don't crash the app if DB is not yet reachable; report degraded via /health
    try:
        await init_db()
    except Exception as e:
        # lazy-init later; health will report degraded until pool works
        print(f"[omicron] startup: DB init deferred: {e}")

@app.on_event("shutdown")
async def on_shutdown():
    if _pool:
        await _pool.close()
        # psycopg_pool close() is sync-compatible under await

@app.get("/health")
async def health():
    try:
        async with _pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT 1")
        return {"status":"ok","arc":"omicron","role":"archive"}
    except Exception as e:
        return {"status":"degraded","error":str(e)}

class ArchiveIn(BaseModel):
    arc: str = Field(..., description="Arc sending the event (e.g., xi, zeta, lambda, mu, nu)")
    source: str = Field(..., description="Logical source or channel")
    payload: dict = Field(..., description="Arbitrary JSON payload")

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
    since: Optional[str] = Query(None, description="ISO8601, e.g., 2025-10-10T00:00:00Z"),
    until: Optional[str] = Query(None, description="ISO8601"),
    arc: Optional[str]   = Query(None),
    source: Optional[str]= Query(None),
    limit: int = Query(100, ge=1, le=1000),
):
    where, params = [], []
    if since:
        where.append("ts >= %s"); params.append(since)
    if until:
        where.append("ts <= %s"); params.append(until)
    if arc:
        where.append("arc = %s"); params.append(arc)
    if source:
        where.append("source = %s"); params.append(source)
    sql = "SELECT id, ts, arc, source, payload FROM omicron_events"
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY ts DESC LIMIT %s"; params.append(limit)
    try:
        async with _pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(sql, params)
                rows = await cur.fetchall()
        return {"count": len(rows), "items": rows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"query failed: {e}")
