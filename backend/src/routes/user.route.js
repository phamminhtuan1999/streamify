import express from "express";
import {
  getRecommendedUsers,
  getMyFriends,
} from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.get("/", getRecommendedUsers);
router.post("/friends", getMyFriends);

export default router;
