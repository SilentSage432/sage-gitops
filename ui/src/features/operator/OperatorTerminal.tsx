import { useState, useEffect, useRef } from "react";

import "./OperatorTerminal.css";



export default function OperatorTerminal() {

  const [input, setInput] = useState("");

  const [log, setLog] = useState<

    { text: string; category: string; ts: number }[]

  >([]);



  const [filters, setFilters] = useState({

    system: true,

    arc: true,

    rho2: true,

    federation: true,

    agent: true,

    whisperer: true,

    error: true,

    debug: false,

    heartbeat: true,

  });



  const logRef = useRef<HTMLDivElement>(null);



  useEffect(() => {

    /** Auto-scroll whenever logs update */

    if (logRef.current) {

      logRef.current.scrollTop = logRef.current.scrollHeight;

    }

  }, [log]);



  /** Handle incoming telemetry (from ws stream) */

  useEffect(() => {

    const handler = (e: CustomEvent) => {

      const { text, category = "system" } = e.detail || {};



      setLog((prev) => [

        ...prev,

        { text, category, ts: Date.now() }

      ]);

    };



    window.addEventListener("SAGE_TERMINAL_LOG", handler as EventListener);

    return () =>

      window.removeEventListener("SAGE_TERMINAL_LOG", handler as EventListener);

  }, []);



  function handleSend() {

    if (!input.trim()) return;

    setLog((prev) => [

      ...prev,

      { text: `> ${input}`, category: "whisperer", ts: Date.now() },

    ]);

    setInput("");

  }



  const filteredLog = log.filter((entry) => {
    const cat = entry.category as keyof typeof filters;
    return filters[cat] ?? true;
  });



  return (

    <div className="terminal-wrapper">



      {/* CATEGORY FILTER BAR */}

      <div className="terminal-filter-bar">

        {Object.keys(filters).map((cat) => {

          const category = cat as keyof typeof filters;

          return (

            <button

              key={cat}

              className={`terminal-filter-btn ${filters[category] ? "on" : "off"}`}

              onClick={() =>

                setFilters((f) => ({ ...f, [category]: !f[category] }))

              }

            >

              {cat.toUpperCase()}

            </button>

          );

        })}

      </div>



      {/* LOG OUTPUT */}

      <div className="terminal-log" ref={logRef}>

        {filteredLog.map((entry, idx) => (

          <div key={idx} className={`terminal-line cat-${entry.category}`}>

            {entry.text}

          </div>

        ))}

      </div>



      {/* INPUT BAR */}

      <div className="terminal-input-bar">

        <input

          className="terminal-input"

          value={input}

          placeholder="Issue command..."

          onChange={(e) => setInput(e.target.value)}

          onKeyDown={(e) => e.key === "Enter" && handleSend()}

        />

        <button className="terminal-send" onClick={handleSend}>

          Send

        </button>

      </div>

    </div>

  );

}
