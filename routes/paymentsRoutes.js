import express from "express";
import verifyUser from "../middleware/verifyUser.js";
import paymentController from "../controllers/paymentsController.js";

const router = express.Router();

router.post("/create-payment-intent", verifyUser,paymentController.createPaymentIntent);
router.post("/confirm-payment", verifyUser, paymentController.confirmPayment);
router.get("/check-payment-status", verifyUser, paymentController.checkPaymentStatus);
router.get("/admin-get-payments", verifyUser, paymentController.adminGetAllPaymentsDetails);

export default router;
