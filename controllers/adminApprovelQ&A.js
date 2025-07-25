import dotenv from "dotenv";
dotenv.config();

import _ from "lodash";
import userQuery from "../utils/helper/dbHelper.js";

const adminApproveQuestions = async (req, res) => {
  const { questionId } = req.params;
  const { userType } = req.user;

  if (userType !== "admin") {
    return res.status(403).json({
      status: "error",
      error: "Forbidden",
      message: "Only admin can approve questions",
      statusCode: 403,
    });
  }

  try {
    const [question] = await userQuery(`SELECT * FROM questions WHERE id = ?`, [
      questionId,
    ]);

    if (!question) {
      return res.status(404).json({
        status: "error",
        error: "Not Found",
        message: "Question not found",
        statusCode: 404,
      });
    }

    await userQuery(`UPDATE questions SET is_approved = 1 WHERE id = ?`, [
      questionId,
    ]);

    // Get the user_id to notify the question author
    const userId = question.user_id;
    const message = `Your question "${question.title}" has been approved by admin.`;

    // Insert notification
    await userQuery(
      `INSERT INTO approve_reject_notifications (user_id, message) VALUES (?, ?)`,
      [userId, message]
    );

    return res.status(200).json({
      status: "success",
      message: "Question approved successfully",
      statusCode: 200,
    });
  } catch (error) {
    console.error("DB Error: ", error);
    return res.status(500).json({
      status: "error",
      error: "Internal Server Error",
      message: error.message,
      statusCode: 500,
    });
  }
};

const getPendingQuestions = async (req, res) => {
  const { userType } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  if (userType !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Only Admin can access pending questions.",
      statusCode: 403,
    });
  }

  try {
    const pendingQuestions = await userQuery(
      `SELECT q.id, q.title, q.details, q.tags, q.posted_at, q.is_approved,
             u.first_name, u.last_name, u.profile_picture
        FROM questions q
        JOIN users u ON q.user_id = u.id
        WHERE q.is_deleted = 0 AND q.is_approved = 0
        ORDER BY q.posted_at DESC
        LIMIT ? OFFSET ?
        `,
      [limit, offset]
    );

    return res.status(200).json({
      status: "success",
      message: "Pending questions fetched successfully",
      data: {
        page,
        limit,
        questions: pendingQuestions,
      },
      statusCode: 200,
    });
  } catch (error) {
    console.error("DB Error: ", error);
    return res.status(500).json({
      status: "error",
      error: "Internal Server Error",
      message: error.message,
      statusCode: 500,
    });
  }
};

const getApprovedQuestions = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // 1. Get paginated questions with user info
    const questions = await userQuery(
      `
            SELECT 
                q.id, q.title, q.details, q.tags, q.posted_at, q.is_approved,
                u.first_name, u.last_name, u.profile_picture
            FROM questions q
            JOIN users u ON q.user_id = u.id
            WHERE q.is_deleted = 0 AND q.is_approved = 1
            ORDER BY q.posted_at DESC
            LIMIT ? OFFSET ?
        `,
      [limit, offset]
    );

    if (questions.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No approved questions found.",
        statusCode: 404,
      });
    }

    const questionIds = questions.map((q) => q.id);

    // 2. Fetch likes, views, comments counts
    const [likes, views, comments] = await Promise.all([
      userQuery(
        `
                SELECT question_id, COUNT(*) AS likes_count 
                FROM question_likes 
                WHERE question_id IN (?) 
                GROUP BY question_id
            `,
        [questionIds]
      ),

      userQuery(
        `
                SELECT question_id, COUNT(*) AS views_count 
                FROM question_views 
                WHERE question_id IN (?) 
                GROUP BY question_id
            `,
        [questionIds]
      ),

      userQuery(
        `
                SELECT question_id, COUNT(*) AS comments_count 
                FROM question_comments 
                WHERE question_id IN (?) 
                GROUP BY question_id
            `,
        [questionIds]
      ),
    ]);

    // 3. Helper to map counts by question_id
    const mapCounts = (items, key) =>
      Object.fromEntries(items.map((i) => [i.question_id, i[key]]));

    const likesMap = mapCounts(likes, "likes_count");
    const viewsMap = mapCounts(views, "views_count");
    const commentsMap = mapCounts(comments, "comments_count");

    // 4. Enrich questions
    const formattedQuestions = questions.map((q) => ({
      id: q.id,
      title: q.title,
      details: q.details,
      posted_at: q.posted_at,
      is_approved: q.is_approved,
      tags: JSON.parse(q.tags || "[]"),
      user: {
        fullName: `${q.first_name} ${q.last_name}`,
        profilePicture: q.profile_picture,
      },
      likes_count: likesMap[q.id] || 0,
      views_count: viewsMap[q.id] || 0,
      comments_count: commentsMap[q.id] || 0,
    }));

    return res.status(200).json({
      status: "success",
      message: "Approved questions fetched successfully.",
      data: {
        page,
        limit,
        questions: formattedQuestions,
      },
      statusCode: 200,
    });
  } catch (error) {
    console.error("DB Error:", error);
    return res.status(500).json({
      status: "error",
      error: "Internal Server Error",
      message: error.message,
      statusCode: 500,
    });
  }
};

const adminRejectQuestion = async (req, res) => {
  const { questionId } = req.params;
  const { feedback } = req.body;
  const { userType } = req.user;

  if (userType !== "admin") {
    return res.status(403).json({
      status: "error",
      error: "Forbidden",
      message: "Only admin can reject questions",
      statusCode: 403,
    });
  }

  //Validation reason
  if (!feedback || feedback.trim() === "") {
    return res.status(400).json({
      status: "error",
      error: "Bad Request",
      message: "Rejection feedback is required.",
      statusCode: 400,
    });
  }

  try {
    const [question] = await userQuery(`SELECT * FROM questions WHERE id = ?`, [
      questionId,
    ]);

    if (!question) {
      return res.status(404).json({
        status: "error",
        error: "Not Found",
        message: "Question Not Found",
        statusCode: 404,
      });
    }

    await userQuery(
      `UPDATE questions SET is_approved = 0, is_reject = 1, is_deleted = 1, reject_reason = ?
       WHERE id = ?`,
      [feedback, questionId]
    );

    // Send rejection notification
    const userId = question.user_id;
    const message = `Your question "${question.title}" was rejected by admin. Reason: ${feedback}`;

    await userQuery(
      `INSERT INTO approve_reject_notifications (user_id, message) VALUES (?, ?)`,
      [userId, message]
    );

    return res.status(200).json({
      status: "success",
      message: "Question rejected successfully.",
      statusCode: 200,
    });
  } catch (error) {
    console.error("DB Error: ", error);
    return res.status(500).json({
      status: "error",
      error: "Internal Server Error",
      message: error.message,
      statusCode: 500,
    });
  }
};

const getMyRejectedQuestions = async (req, res) => {
  const { userId } = req.user;

  try {
    const rejectedQuestions = await userQuery(
      `SELECT id, title, details, tags, is_reject, reject_reason, updated_at 
       FROM questions 
       WHERE user_id = ? AND is_reject = 1 AND is_deleted = 1
       ORDER BY updated_at DESC`,
      [userId]
    );

    return res.status(200).json({
      status: "success",
      message: "Your rejected questions fetched successfully.",
      data: rejectedQuestions,
      statusCode: 200,
    });
  } catch (error) {
    console.error("DB Error: ", error);
    return res.status(500).json({
      status: "error",
      error: "Internal Server Error",
      message: error.message,
      statusCode: 500,
    });
  }
};

const getApproveRejectNotifications = async (req, res) => {
  const { userId } = req.user;

  try {
    const notifications = await userQuery(
      `SELECT id, message, is_read, created_at 
       FROM approve_reject_notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    return res.status(200).json({
      status: "success",
      message: "Questions Notifications fetched successfully",
      data: notifications,
      statusCode: 200,
    });
  } catch (error) {
    console.error("DB Error :", error);
    return res.status(500).json({
      status: "error",
      error: "Internal Server Error",
      message: error.message,
      statusCode: 500,
    });
  }
};

export default {
  adminApproveQuestions,
  getPendingQuestions,
  getApprovedQuestions,
  adminRejectQuestion,
  getMyRejectedQuestions,
  getApproveRejectNotifications,
};
