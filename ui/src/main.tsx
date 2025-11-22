/// <reference types="vite/client" />
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App";
import "./index.css";
import "./sage/kernel/animations.css";
import "./sage/kernel/reflexAnimations.css";
import "./sage/kernel/heartbeatAnimations.css";
import "./sage/cognition/defaultPatterns";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter 
      basename={import.meta.env.DEV ? "/" : "/ui"}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
