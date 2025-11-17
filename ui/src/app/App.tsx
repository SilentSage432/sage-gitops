import React from "react";
import { AppRoutes } from "./routes";
import { Shell } from "../components/layout/Shell";

export const App: React.FC = () => {
  return (
    <Shell>
      <AppRoutes />
    </Shell>
  );
};

export default App;
