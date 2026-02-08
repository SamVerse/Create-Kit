import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      free_usage?: number;
      plan?: "premium" | "free";

      // add Multer typings
      file?: Multer.File;
      files?: Multer.File[];
    }
  }
}
