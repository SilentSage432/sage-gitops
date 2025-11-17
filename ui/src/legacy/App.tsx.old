import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SidebarLayout from "./layouts/SidebarLayout";
import HomePage from "./pages/HomePage";
import GodViewPage from "./pages/GodViewPage";
import VitalsPage from "./pages/VitalsPage";

export default function App() {
  return (
    <BrowserRouter basename="/ui">
      <SidebarLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/godview" element={<GodViewPage />} />
          <Route path="/vitals" element={<VitalsPage />} />
        </Routes>
      </SidebarLayout>
    </BrowserRouter>
  );
}
