import multer from "multer";

// Why we do memory storage instead of disk storage:
// 1. Performance: Memory storage is faster for small files as it avoids disk I/O.
// 2. Simplicity: It simplifies cleanup since files are not written to disk.
// 3. Security: Reduces risk of leaving temporary files on the server.
// 4. Serverless Compatibility: Works well in serverless environments where disk access may be limited or ephemeral. 
export const upload = multer({
  storage: multer.memoryStorage(), 
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});
