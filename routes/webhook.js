import express from "express";
import Stripe from "stripe";
import bodyParser from "body-parser";
import userQuery from "../utils/helper/dbHelper.js"; // Your MySQL helper
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ⚠️ Use raw body parser for webhooks
router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // ✅ Handle event types
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata.userId;

        // Record success in DB
        await userQuery(
          `INSERT INTO payments (user_id, amount, currency, status, payment_intent_id)
           VALUES (?, ?, ?, ?, ?)`,
          [
            userId,
            (paymentIntent.amount / 100).toFixed(2),
            paymentIntent.currency,
            paymentIntent.status,
            paymentIntent.id,
          ]
        );

        // Optional: upgrade subscription
        await userQuery(
          `UPDATE users SET subscription_type = 'pro' WHERE id = ?`,
          [userId]
        );

        console.log("✅ Payment succeeded and updated DB for user:", userId);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata.userId;

        await userQuery(
          `INSERT INTO payments (user_id, amount, currency, status, payment_intent_id)
           VALUES (?, ?, ?, ?, ?)`,
          [
            userId,
            (paymentIntent.amount / 100).toFixed(2),
            paymentIntent.currency,
            paymentIntent.status,
            paymentIntent.id,
          ]
        );

        console.log("❌ Payment failed for user:", userId);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  }
);

export default router;
