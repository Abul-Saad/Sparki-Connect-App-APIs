import stripe from "../utils/stripe.js";
import userQuery from "../utils/helper/dbHelper.js";

const createPaymentIntent = async (req, res) => {
    try {
        const { amount, currency = "usd" } = req.body;

        if (!amount || isNaN(amount)) {
            return res.status(400).json({
                status: "error",
                message: "Amount is required and must be a number.",
                statusCode: 400,
            });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe requires amount in cents
            currency,
            automatic_payment_methods: {
            enabled: true,
            allow_redirects: "never"
           },
            metadata: {
                userId: req.user.userId,
            },
        });

        return res.status(200).json({
            status: "success",
            message: "Payment intent created successfully.",
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
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
        const { paymentIntentId, paymentMethodId } = req.body;

        if (!paymentIntentId) {
            return res.status(400).json({
                status: "error",
                message: "Payment Intent ID is required.",
                statusCode: 400,
            });
        }

        const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
            payment_method: paymentMethodId,
        });

        if (paymentIntent.status === "requires_action") {
        return res.status(200).json({
            status: "requires_action",
            message: "Additional authentication required.",
            clientSecret: paymentIntent.client_secret,
            statusCode: 200
        });
    }

        if (paymentIntent.status !== "succeeded") {
            return res.status(400).json({
                status: "error",
                message: `Payment not succeeded. Current status: ${paymentIntent.status}`,
                statusCode: 400,
            });
        }

        // Update user subscription type (assuming `pro` means paid)
        await userQuery(
            `UPDATE users SET subscription_type = 'pro' WHERE id = ?`,
            [req.user.userId]
        );

        // Record the payment
        await userQuery(
            `INSERT INTO payments (user_id, amount, currency, status, payment_intent_id)
             VALUES (?, ?, ?, ?, ?)`,
            [
                req.user.userId,
                (paymentIntent.amount / 100).toFixed(2), // Convert cents to dollars
                paymentIntent.currency,
                paymentIntent.status,
                paymentIntent.id
            ]
        );

        return res.status(200).json({
            status: "success",
            message: "Payment confirmed and user upgraded to Pro.",
            statusCode: 200,
        });

    } catch (error) {
        console.error("Confirm Payment Error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to confirm payment.",
            error: error.message,
            statusCode: 500,
        });
    }
};

export default {
    createPaymentIntent,
    confirmPayment
};



// import stripe from "../utils/stripe.js";
// import userQuery from "../utils/helper/dbHelper.js";

// const createPaymentIntent = async (req, res) => {
//   try {
//     const { amount, currency = "usd" } = req.body;

//     if (!amount || isNaN(amount)) {
//       return res.status(400).json({
//         status: "error",
//         message: "Amount must be a valid number.",
//         statusCode: 400,
//       });
//     }

//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: Math.round(amount * 100), // Stripe uses smallest currency unit
//       currency,
//       automatic_payment_methods: {
//         enabled: true,
//         allow_redirects: "never",
//       },
//       metadata: {
//         userId: req.user.userId,
//       },
//     });

//     return res.status(200).json({
//       status: "success",
//       clientSecret: paymentIntent.client_secret,
//       paymentIntentId: paymentIntent.id,
//       statusCode: 200,
//     });
//   } catch (error) {
//     console.error("Create Payment Error:", error);
//     return res.status(500).json({
//       status: "error",
//       message: "Failed to create PaymentIntent",
//       error: error.message,
//       statusCode: 500,
//     });
//   }
// };

// const confirmPayment = async (req, res) => {
//   try {
//     const { paymentIntentId } = req.body;

//     const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

//     if (paymentIntent.status !== "succeeded") {
//       return res.status(400).json({
//         status: "error",
//         message: `Payment not successful. Status: ${paymentIntent.status}`,
//         statusCode: 400,
//       });
//     }

//     await userQuery(
//       `UPDATE users SET subscription_type = 'pro' WHERE id = ?`,
//       [req.user.userId]
//     );

//     await userQuery(
//       `INSERT INTO payments (user_id, amount, currency, status, payment_intent_id)
//        VALUES (?, ?, ?, ?, ?)`,
//       [
//         req.user.userId,
//         (paymentIntent.amount / 100).toFixed(2),
//         paymentIntent.currency,
//         paymentIntent.status,
//         paymentIntent.id
//       ]
//     );

//     return res.status(200).json({
//       status: "success",
//       message: "Payment confirmed and user upgraded to Pro.",
//       statusCode: 200,
//     });

//   } catch (error) {
//     console.error("Confirm Payment Error:", error);
//     return res.status(500).json({
//       status: "error",
//       message: "Failed to confirm payment.",
//       error: error.message,
//       statusCode: 500,
//     });
//   }
// };

// export default {
//   createPaymentIntent,
//   confirmPayment
// };
