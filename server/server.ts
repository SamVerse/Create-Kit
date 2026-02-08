import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { clerkMiddleware, requireAuth } from '@clerk/express'
import aiRouter from './routes/aiRoutes.js';
import connectCloudinary from './configs/cloudinary.js';
import userRouter from './routes/userRoutes.js';


const app = express();
const PORT = process.env.PORT || 3000;

// Connect to Cloudinary
await connectCloudinary();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware())


// Health check endpoint
app.get('/', (req, res) => {
  res.send('CreateKit Server is running');
});

// Protect AI routes with authentication middleware
app.use(requireAuth());

// AI Routes
app.use('/api/ai', aiRouter); 

// User Routes
app.use('/api/user', userRouter); 

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;