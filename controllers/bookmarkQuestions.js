import dotenv from "dotenv";
dotenv.config();

import _ from "lodash";
import userQuery from "../utils/helper/dbHelper.js";

const addBookmarkQuestion = async (req, res) => {
  const { questionId } = req.body;
  const { userId } = req.user;

  if (!questionId) {
    return res.status(400).json({
      status: "error",
      message: "Question ID is required.",
      statusCode: 400,
    });
  }

  try {
    // Check if question exists
    const [question] = await userQuery(
      `SELECT id FROM questions WHERE id = ?`,
      [questionId]
    );

    if (!question) {
      return res.status(404).json({
        status: "error",
        message: "The question you are trying to bookmark does not exist.",
        statusCode: 404,
      });
    }

    // Prevent duplicate bookmarks_questions
    const [exists] = await userQuery(
      `SELECT 1 FROM bookmarks_questions WHERE user_id = ? AND question_id = ? LIMIT 1`,
      [userId, questionId]
    );

    if (exists) {
      return res.status(409).json({
        status: "error",
        message: "You have already bookmarked this question.",
        statusCode: 409,
      });
    }

    await userQuery(
      `INSERT INTO bookmarks_questions (user_id, question_id) VALUES (?, ?)`,
      [userId, questionId]
    );

    return res.status(201).json({
      status: "success",
      message: "Question bookmarked successfully.",
      statusCode: 201,
    });
  } catch (error) {
    console.error("Bookmark Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
      error: error.message,
      statusCode: 500,
    });
  }
};

const getBookmarkedQuestions = async (req, res) => {
  const { userId } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // Get paginated Bookmark-questions
    const totalResult = await userQuery(
      `SELECT COUNT(*) AS total FROM bookmarks_questions WHERE user_id = ?`,
      [userId]
    );
    const total = totalResult[0]?.total || 0;

    const bookmarkedQuestions = await userQuery(
      `SELECT q.id AS questionId, q.title, q.details, q.tags, q.posted_at
             FROM bookmarks_questions b
             JOIN questions q ON b.question_id = q.id
             WHERE b.user_id = ?
             ORDER BY q.posted_at DESC
             LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    return res.status(200).json({
      status: "success",
      message: "Bookmarked questions fetched successfully.",
      data: bookmarkedQuestions,
      saveItems : total,
      pagination: {
        totalitems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        limit,
      },
      statusCode: 200,
    });
  } catch (error) {
    console.error("Fetch Bookmark Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
      error: error.message,
      statusCode: 500,
    });
  }
};

const removeBookmarkedQuestion = async (req, res) => {
  const { questionId } = req.params;
  const { userId } = req.user;

  if (!questionId) {
    return res.status(400).json({
      status: "error",
      message: "Question ID required.",
      statusCode: 400,
    });
  }

  try {
    // Check if Bookmark exists
    const [bookmark] = await userQuery(
      `SELECT 1 FROM bookmarks_questions WHERE user_id = ? AND question_id = ? LIMIT 1 `,
      [userId, questionId]
    );

    if (!bookmark) {
      return res.status(404).json({
        status: "error",
        message: "Bookmark not found.",
        statusCode: 404,
      });
    }

    await userQuery(
      `DELETE FROM bookmarks_questions WHERE user_id = ? AND question_id = ? `,
      [userId, questionId]
    );

    return res.status(200).json({
      status: "success",
      message: "Bookmark remove successfully!.",
      statusCode: 200,
    });
  } catch (error) {
    console.error("Remove BookMark Error : ", error);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
      error: error.message,
      statusCode: 500,
    });
  }
};

export default {
  addBookmarkQuestion,
  getBookmarkedQuestions,
  removeBookmarkedQuestion,
};
