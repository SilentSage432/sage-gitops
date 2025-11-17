import React from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface ShellProps {
  children?: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  return (
    <div className="shell-container">
      <Header />
      <div className="shell-content">
        <Sidebar />
        <main className="shell-main">
          {children}
        </main>
      </div>
    </div>
  );
};
