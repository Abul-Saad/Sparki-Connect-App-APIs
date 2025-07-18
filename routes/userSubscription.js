import express from "express";
import userSubscriptions from "../controllers/userSubscriptions.js";
import verifyUser from "../middleware/verifyUser.js";
const router = express.Router();

router.patch("/subscriptions/:id",verifyUser, userSubscriptions.adminUpdateUserSubscription);
router.get("/get-subscriptionsUsers", verifyUser, userSubscriptions.getAllUsers);

export default router;