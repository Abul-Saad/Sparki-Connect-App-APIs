import express from "express";
import paymentsController from "../controllers/paymentsController.js";

import verifyUser from "../middleware/verifyUser.js";

const router = express.Router();

router.post("/payment-intent", verifyUser, paymentsController.createPaymentIntent);
router.post("/confirm-payment", verifyUser, paymentsController.confirmPayment);

export default router;