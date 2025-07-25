import stripe from "../utils/stripe.js";
import userQuery from "../utils/helper/dbHelper.js";

const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = "inr", customer_email } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({
        status: "error",
        message: "Amount is required and must be a number.",
        statusCode: 400,
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      metadata: {
        userId: req.user.userId,
      },
      receipt_email: customer_email,
    });

    return res.status(200).json({
      status: "success",
      message: "Payment intent created successfully.",
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentStatus: paymentIntent.status,
      statusCode: 200,
    });

  } catch (error) {
    console.error("Create Payment Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to create payment intent.",
      error: error.message,
      statusCode: 500,
    });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        status: "error",
        message: "Payment Intent ID is required.",
        statusCode: 400,
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        status: "error",
        message: `Payment not succeeded. Current status: ${paymentIntent.status}`,
        statusCode: 400,
      });
    }

    await userQuery(
      `UPDATE users SET subscription_type = 'pro' WHERE id = ?`,
      [req.user.userId]
    );

    await userQuery(
      `INSERT INTO payments (user_id, amount, currency, status, payment_intent_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.userId,
        (paymentIntent.amount / 100).toFixed(2),
        paymentIntent.currency,
        paymentIntent.status,
        paymentIntent.id,
      ]
    );

    return res.status(200).json({
      status: "success",
      message: "Payment verified and user upgraded to Pro.",
      statusCode: 200,
    });
  } catch (error) {
    console.error("Confirm Payment Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to confirm and record payment.",
      error: error.message,
      statusCode: 500,
    });
  }
};

const checkPaymentStatus = async (req, res) => {
  try {
    const { paymentIntentId } = req.query;

    if (!paymentIntentId) {
      return res.status(400).json({
        status: "error",
        message: "Payment Intent ID is required.",
        statusCode: 400,
      });
    }

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    let userMessage = "";
    switch (intent.status) {
      case "succeeded":
        userMessage = "Payment completed successfully.";
        break;
      case "requires_payment_method":
        userMessage = "Payment failed. Please try again.";
        break;
      case "requires_action":
        userMessage = "Authentication required to complete the payment.";
        break;
      case "processing":
        userMessage = "Payment is still processing.";
        break;
      case "canceled":
        userMessage = "Payment was cancelled.";
        break;
      default:
        userMessage = "Unknown payment status.";
    }

    return res.status(200).json({
      status: "success",
      message: userMessage,
      paymentStatus: intent.status,
      amount: intent.amount / 100,
      currency: intent.currency,
      clientSecret: intent.client_secret,
      statusCode: 200,
    });

  } catch (error) {
    console.error("Stripe checkStatus error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve payment status.",
      error: error.message,
      statusCode: 500,
    });
  }
};


const adminGetAllPaymentsDetails = async (req, res) => {
  
  const user = req.user;
  
  // Check if the userType is admin
  if (!user || user.userType !== "admin") {
    return res.status(403).json({
      error: "Forbidden",
      message: "Access denied. Admins only.",
      statusCode: 403,
      status: "error",
    });
  }

  try {
    
    const payments = await userQuery(`
      SELECT 
        p.id AS payment_id,
        p.user_id,
        u.first_name,
        u.last_name,
        u.subscription_type,
        u.email,
        p.amount,
        p.currency,
        p.status,
        p.payment_intent_id,
        p.created_at
      FROM payments p
      JOIN users u ON u.id = p.user_id
      ORDER BY p.created_at DESC
    `);

    return res.status(200).json({
      status: "success",
      message: "All payment records fetched successfully.",
      data: payments,
      statusCode: 200,
    });

  } catch (error) {
    console.error("Get All Payments Error : ", error);
    return res.status(500).json({
      status : "error",
      message : "Failed to fetch payments",
      error : error.message,
      statusCode : 500
    });
  }
}

export default {
    createPaymentIntent,
    confirmPayment,
    checkPaymentStatus,
    adminGetAllPaymentsDetails,
}