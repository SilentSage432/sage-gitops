import { Router } from "express";
const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "healthy", service: "arc-bridge-local" });
});

export default router;

