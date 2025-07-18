import express from "express";
import userController from "../controllers/user.js"; 
import verifyUser from "../middleware/verifyUser.js";
import { profileUpload } from "../middleware/upload.js";
const router = express.Router();

router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.get("/getProfile", verifyUser, userController.getProfile);
router.patch("/updateProfile", verifyUser,profileUpload.single("profile_picture"), userController.updateProfile);
router.delete("/deleteAccount", verifyUser, userController.deleteAccount);
router.post("/forgotPassword", userController.forgotPassword);
router.post("/resetPassword", userController.resetPassword);
router.post("/verify_otp", userController.verifyOtpAndCompleteSignup);
router.post("/resend_otp", userController.resentOTP);
router.post("/logout", userController.logoutUser);

export default router;
