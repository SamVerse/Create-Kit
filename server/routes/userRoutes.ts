import express from "express";
import { getPublishedCreations, getUserCreations, toggleLikeCreation, togglePublishCreation } from "../controllers/userController.js";
import { auth } from "../middlewares/auth.js";

const userRouter = express.Router();

userRouter.get("/get-user-creations", auth , getUserCreations);
userRouter.get("/get-published-creations", auth , getPublishedCreations);
userRouter.post("/toggle-like-creation/:creationId", auth , toggleLikeCreation);
userRouter.post("/toggle-publish-creation", auth , togglePublishCreation);

export default userRouter;



