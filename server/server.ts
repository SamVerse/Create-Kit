import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware, requireAuth } from "@clerk/express";

import aiRouter from "../server/routes/aiRoutes.js";
import userRouter from "../server/routes/userRoutes.js";
import connectCloudinary from "../server/configs/cloudinary.js";

const app = express();

// Lazy connect (serverless-safe)
let cloudinaryReady = false;
app.use(async (_req, _res, next) => {
  if (!cloudinaryReady) {
    await connectCloudinary();
    cloudinaryReady = true;
  }
  next();
});

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

app.get("/api/health", (_req, res) => {
  res.send("CreateKit Server is running");
});

app.use("/api", requireAuth());
app.use("/api/ai", aiRouter);
app.use("/api/user", userRouter);

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});

export default app;
