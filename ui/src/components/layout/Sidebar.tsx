import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const { pathname } = useLocation();

  const nav = [
    { label: "Home", path: "/" },
    { label: "GodView", path: "/godview" },
    { label: "Vitals", path: "/vitals" }
  ];

  return (
    <aside className="w-64 bg-[#0d0d12] border-r border-[#222] p-4 flex flex-col gap-4">
      <h1 className="text-xl font-bold mb-6 tracking-wide">SAGE</h1>

      {nav.map(n => (
        <Link
          key={n.path}
          to={n.path}
          className={`p-2 rounded transition ${
            pathname === `/ui${n.path}` || pathname === n.path
              ? "bg-purple-600"
              : "hover:bg-[#1a1a22]"
          }`}
        >
          {n.label}
        </Link>
      ))}
    </aside>
  );
}
