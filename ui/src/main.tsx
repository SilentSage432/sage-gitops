/// <reference types="vite/client" />
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App";
import { OperatorMemoryProvider } from "./core/OperatorMemoryContext";
import { getFederationToken, setFederationToken } from "./federation/token";
import "./index.css";
import "./styles/federationLayout.css";
import "./styles/sageSurface.css";
import "./sage/kernel/animations.css";
import "./sage/kernel/reflexAnimations.css";
import "./sage/kernel/heartbeatAnimations.css";
import "./sage/cognition/defaultPatterns";
import "./styles/sageVisualOverride.css";
import "./styles/primeCinematic.css";

const existingToken = getFederationToken();
if (existingToken) {
  setFederationToken(existingToken);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <OperatorMemoryProvider>
      <BrowserRouter 
        basename={import.meta.env.DEV ? "/" : "/ui"}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
      </BrowserRouter>
    </OperatorMemoryProvider>
  </React.StrictMode>
);
