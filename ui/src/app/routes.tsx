import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "../pages/Home/HomePage";
import { GodViewPage } from "../pages/GodView/GodViewPage";
import { VitalsPage } from "../pages/Vitals/VitalsPage";

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/ui" replace />} />
      <Route path="/ui" element={<HomePage />} />
      <Route path="/ui/godview" element={<GodViewPage />} />
      <Route path="/ui/vitals" element={<VitalsPage />} />
    </Routes>
  );
};
