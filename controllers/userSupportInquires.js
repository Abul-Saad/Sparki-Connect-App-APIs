import dotenv from "dotenv";
dotenv.config();

import _ from "lodash";
import userQuery from "../utils/helper/dbHelper.js";

const submitUserInquiry = async (req, res) => {
  const { subject, message } = req.body;
  const { userId } = req.user;

  if (!subject || !message) {
    return res.status(400).json({
      status: "error",
      message: "Subject and message are required.",
      statusCode: 400,
    });
  }
  try {
    // Check for duplicate inquiry
    const [existing] = await userQuery(
      `SELECT id FROM support_inquiries WHERE user_id = ? AND subject = ? AND message = ?`,
      [userId, subject.trim(), message.trim()]
    );

    if (existing) {
      return res.status(409).json({
        status: "error",
        message: "Duplicate inquiry already exists.",
        statusCode: 409,
      });
    }
    await userQuery(
      `INSERT INTO support_inquiries(user_id, subject, message) VALUES (?, ?, ?)`,
      [userId, subject.trim(), message.trim()]
    );

    return res.status(200).json({
      status: "success",
      message: "Support inquiry submitted successfully.",
      statusCode: 200,
    });
  } catch (error) {
    console.error("DB Error : ", error);
    return res.status(500).json({
      status: "error",
      error: "Internal Server Error",
      message: error.message,
      statusCode: 500,
    });
  }
};

const getAllInquiry = async (req, res) => {
  const { userType } = req.user;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  if (userType !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Only admins can view inquiries.",
      statusCode: 403,
    });
  }

  try {
    const inquiries = await userQuery(
      `
      SELECT i.*, u.first_name, u.last_name, u.email 
      FROM support_inquiries i
      JOIN users u ON i.user_id = u.id
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
        `,
      [limit, offset]
    );

    return res.status(200).json({
      status: "success",
      message: "Inquiries fetched successfully.",
      data: {
        page,
        limit,
        Inquiries_data: inquiries,
      },
      statusCode: 200,
    });
  } catch (error) {
    console.error("Support Inquires Errors : ", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch inquiries.",
      error: error.message,
      statusCode: 500,
    });
  }
};

const replyToUserInquiry = async (req, res) => {
  const { inquiryId } = req.params;
  const { message } = req.body;
  const user = req.user;

  if (!message || message.trim() === "") {
    return res.status(400).json({
      status: "error",
      message: "Message is required.",
      statusCode: 400,
    });
  }

  const senderType = user.userType === "admin" ? "admin" : "visitor";
  const senderId = user.userId;

  try {
    await userQuery(
      `INSERT INTO support_inquiry_replies (inquiry_id, sender_type, sender_id, message)
       VALUES (?, ?, ?, ?)`,
      [inquiryId, senderType, senderId, message.trim()]
    );

    if (senderType === "admin") {
      await userQuery(
        `UPDATE support_inquiries SET status = 'resolved' WHERE id = ?`,
        [inquiryId]
      );
    }

    const [inquiry] = await userQuery(
      `SELECT user_id FROM support_inquiries WHERE id = ?`,
      [inquiryId]
    );

    if (inquiry) {
      await userQuery(
        `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
        [
          inquiry.user_id,
          "Your support inquiry has been resolved",
          message.trim(),
        ]
      );
    }

    return res.status(200).json({
      status: "success",
      message: "Reply sent successfully. Inquiry marked as resolved.",
      statusCode: 200,
    });
  } catch (error) {
    console.error("Auto-resolved Error : ", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to send reply or resolve inquiry.",
      error: error.message,
      statusCode: 500,
    });
  }
};

const getInquiryReplies = async (req, res) => {
  const { inquiryId } = req.params;
  const user = req.user;

  try {
    const [inquiry] = await userQuery(
      `SELECT user_id FROM support_inquiries WHERE id = ?`,
      [inquiryId]
    );
    if(!inquiry) {
      return res.status(404).json({
        status : "error",
        message : "Inquiry not found.",
        statusCode : 404
      });
    }

    if(user.userType !== "admin" && user.userId !== inquiry.user_id){
      return res.status(403).json({
        status : "error",
        message : "You are not authorized to view this inquiry.",
        statusCode : 403,
      });
    }

    const replies = await userQuery(
      `SELECT sender_type, sender_id, message, sent_at
       FROM support_inquiry_replies 
       WHERE inquiry_id = ? 
       ORDER BY sent_at ASC`,
       [inquiryId]
    );

    return res.status(200).json({
      status : "success",
      message : "Replies fetched successfully.",
      statusCode : 200,
      data : {
        inquiryId: parseInt(inquiryId),
        replies: replies.map(reply => ({
          senderType: reply.sender_type,
          senderId: reply.sender_id,
          message: reply.message,
          sentAt: reply.sent_at
        }))
      }
    });

  } catch (error) {
    console.error("Fetch Inquiry Replies Error:", error);
    return res.status(500).json({
      status : "error",
      message : "Failed to fetch inquiry replies.",
      error : error.message,
      statusCode : 500,
    });
  }
}

const markNotificationAsRead = async (req, res) => {
  const { notificationId } = req.params;
  const { userId, userType } = req.user;

  try {
    const query = userType === 'admin'
      ? `SELECT * FROM notifications WHERE id = ?`
      : `SELECT * FROM notifications WHERE id = ? AND user_id = ?`;
    const params = userType === 'admin' ? [notificationId] : [notificationId, userId];

    const [notification] = await userQuery(query, params);

    if (!notification) {
      return res.status(404).json({
        status: "error",
        message: "Notification not found.",
        statusCode: 404,
      });
    }

    if (notification.is_read === 0) {
      await userQuery(`UPDATE notifications SET is_read = 1 WHERE id = ?`, [
        notificationId,
      ]);
    }

    
    return res.status(200).json({
      status : "success",
      message : "Notification marked as read.",
      statusCode : 200,
      data : {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        created_at: notification.created_at,
      }, 
    });
  } catch (error) {
    console.error("Mark Notification Read Error : ", error);
    return res.status(500).json({
      status : "error",
      message : "Failed to update notification.",
      error : error.message,
      statusCode : 500,
    });
  }

}

export default {
  submitUserInquiry,
  getAllInquiry,
  replyToUserInquiry,
  getInquiryReplies,
  markNotificationAsRead,
};
