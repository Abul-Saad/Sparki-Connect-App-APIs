import dotenv from "dotenv";
dotenv.config();
import _ from "lodash";
import userQuery from "../utils/helper/dbHelper.js";
import { error } from "console";

const addQuestion = async (req, res) => {
  const { title, details, tags } = req.body;
  const { userId } = req.user;

  // Basic validation
  const errors = [];
  if (!title || typeof title !== "string")
    errors.push("Title is required and must be a string.");
  if (!details || typeof details !== "string")
    errors.push("Details are required and must be a string.");
  if (!userId) errors.push("User authentication failed.");

  // Convert tags to array (if any)
  const tagArray = tags
    ? tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  if (tagArray.length > 5) {
    errors.push("You can add a maximum of 5 tags only.");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: "error",
      error: "Validation Error",
      message: errors.join(" "),
      statusCode: 400,
    });
  }

  try {
    // Check for duplicate question
    const [existingQuestion] = await userQuery(
      `SELECT 1 FROM questions WHERE title = ? AND user_id = ? LIMIT 1`,
      [title, userId]
    );

    if (existingQuestion) {
      return res.status(409).json({
        status: "error",
        error: "Conflict",
        message: `A question with the title "${title}" already exists for this user.`,
        statusCode: 409,
      });
    }

    // Insert question
    const insertQuery = `
            INSERT INTO questions (title, details, user_id, tags, posted_at)
            VALUES (?, ?, ?, ?, NOW())
        `;
    const result = await userQuery(insertQuery, [
      title,
      details,
      userId,
      JSON.stringify(tagArray),
    ]);

    return res.status(201).json({
      status: "success",
      message: "Question added successfully",
      data: {
        questionId: result.insertId,
        title,
        details,
        tags: tagArray,
      },
      statusCode: 201,
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

const getQuestionsAdmin = async (req, res) => {

  // ✅ Check if user is admin
    if (!req.user || req.user.userType !== "admin") {
        return res.status(403).json({
            status: "error",
            message: "Access denied. Only admin can get all questions.",
            statusCode: 403,
        });
    } 

  // ✅ Read pagination from query
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

 try {

    //✅ Get total count for pagination info
    const totalResult = await userQuery(`SELECT COUNT(*) as total FROM questions`);
    const total = totalResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

  const questions = await userQuery(
      `SELECT q.id, q.title, q.details, q.tags, q.posted_at, q.is_approved, q.is_deleted, is_reject,
       CONCAT(u.first_name, ' ', u.last_name) AS full_name 
       FROM questions q 
       JOIN users u ON q.user_id = u.id 
       ORDER BY q.posted_at DESC
        LIMIT ? OFFSET ?`,
      [limit, offset]

    );
    
    const formattedQuestions  = questions.map((q) => ({
      id: q.id,
      title: q.title,
      details: q.details,
      tags: JSON.parse(q.tags || "[]"),
      postedAt: q.posted_at,
      is_approved: q.is_approved,
      is_deleted: q.is_deleted,
      is_reject: q.is_reject,
      username: q.full_name,
    }));

    return res.status(200).json({
      status: "success",
      data: formattedQuestions,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
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
}

const updateQuestion = async (req, res) => {
  const { id } = req.params;
  const { title, details, tags } = req.body;
  const { userId } = req.user;

  // Basic validation
  const errors = [];
  if (!title || typeof title !== "string")
    errors.push("Title is required and must be a string.");
  if (!details || typeof details !== "string")
    errors.push("Details are required and must be a string.");
  if (!userId) errors.push("User authentication failed.");

  const tagArray = tags
    ? tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  if (tagArray.length > 5) {
    errors.push("You can add a maximum of 5 tags only.");
  }
  if (errors.length > 0) {
    return res.status(400).json({
      status: "error",
      error: "Validation Error",
      message: errors.join(" "),
      statusCode: 400,
    });
  }

  try {
    const [existing] = await userQuery(
      `SELECT * FROM questions WHERE id = ? AND user_id = ? LIMIT 1`,
      [id, userId]
    );
    if (!existing) {
      return res.status(404).json({
        status: "error",
        error: "Not Found",
        message:
          "Question not found or you don't have permission to update it.",
        statusCode: 404,
      });
    }
    const [duplicate] = await userQuery(
      `SELECT 1 FROM questions WHERE title = ? AND user_id = ? AND id != ? LIMIT 1`,
      [title, userId, id]
    );

    if (duplicate) {
      return res.status(409).json({
        status: "error",
        error: "Conflict",
        message: `Another question with the title "${title}" already exists.`,
        statusCode: 409,
      });
    }

    const updateQuery = `UPDATE questions
      SET title = ?, details = ?, tags = ?, updated_at = NOW()
      WHERE id = ? AND user_id = ?`;

    await userQuery(updateQuery, [
      title,
      details,
      JSON.stringify(tagArray),
      id,
      userId,
    ]);

    return res.status(200).json({
      status: "success",
      message: "Question updated successfully",
      data: {
        title,
        details,
        tags,
      },
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

const removeQuestion = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;

  if (!id || !userId) {
    return res.status(400).json({
      status: "error",
      error: "Bad request",
      message: "Question ID or user authentication is missing.",
      statusCode: 400,
    });
  }

  try {
    const [existing] = await userQuery(
      `SELECT * FROM questions WHERE id = ? AND user_id = ? AND is_deleted = 0 LIMIT 1`,
      [id, userId]
    );

    if (!existing) {
      return res.status(404).json({
        status: "error",
        error: "Not Found",
        message:
          "Question not found or you don't have permission to delete it.",
        statusCode: 404,
      });
    }

    await userQuery(
      `UPDATE questions SET is_deleted = 1, deleted_at = NOW() WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    return res.status(200).json({
      status: "success",
      message: "Question soft-deleted successfully",
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

const addQuestionViews = async (req, res) => {
  const { questionId } = req.query;

  if (!questionId) {
    return res.status(400).json({
      status: "error",
      error: "Validation Error",
      message: "Question ID is required.",
      statusCode: 400,
    });
  }

  try {
    // check if question exists
    const [existingQuestion] = await userQuery(
      `SELECT 1 FROM questions WHERE id = ? LIMIT 1`,
      [questionId]
    );

    if (!existingQuestion) {
      return res.status(404).json({
        status: "error",
        error: "Not Found",
        message: `Question with ID ${questionId} does not exist.`,
        statusCode: 404,
      });
    }

    // check if view already exists

    const [existingView] = await userQuery(
      `SELECT 1 FROM question_views WHERE question_id = ? AND user_id = ? LIMIT 1`,
      [questionId, req.user.userId]
    );

    if (existingView) {
      return res.status(409).json({
        status: "error",
        error: "Conflict",
        message: `You have already viewed this question.`,
        statusCode: 409,
      });
    }

    // Insert view record

    const insertQuery = `
            INSERT INTO question_views (question_id, user_id)
            VALUES (?, ?)
        `;

    await userQuery(insertQuery, [questionId, req.user.userId]);
    return res.status(201).json({
      status: "success",
      message: "Question view recorded successfully.",
      statusCode: 201,
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

const addQuestionLikes = async (req, res) => {
  const { questionId } = req.query;

  if (!questionId) {
    return res.status(400).json({
      status: "error",
      error: "Validation Error",
      message: "Question ID is required.",
      statusCode: 400,
    });
  }

  try {
    // Check if question exists
    const [existingQuestion] = await userQuery(
      `SELECT 1 FROM questions WHERE id = ? LIMIT 1`,
      [questionId]
    );

    if (!existingQuestion) {
      return res.status(404).json({
        status: "error",
        error: "Not Found",
        message: `Question with ID ${questionId} does not exist.`,
        statusCode: 404,
      });
    }

    // Check if like already exists
    const [existingLike] = await userQuery(
      `SELECT 1 FROM question_likes WHERE question_id = ? AND user_id = ? LIMIT 1`,
      [questionId, req.user.userId]
    );

    if (existingLike) {
      return res.status(409).json({
        status: "error",
        error: "Conflict",
        message: `You have already liked this question.`,
        statusCode: 409,
      });
    }

    // Insert like record
    const insertQuery = `
            INSERT INTO question_likes (question_id, user_id)
            VALUES (?, ?)
        `;

    await userQuery(insertQuery, [questionId, req.user.userId]);
    return res.status(201).json({
      status: "success",
      message: "Question like recorded successfully.",
      statusCode: 201,
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

const getQuestionLikes = async (req, res) => {
  const { questionId } = req.query;

  if (!questionId) {
    return res.status(400).json({
      status: "error",
      error: "validation Error",
      message: "Question ID is required",
      statusCode: 400,
    });
  }

  try {
    const [likeCountResult] = await userQuery(
      `SELECT COUNT(*) AS likeCount FROM question_likes WHERE question_id = ?`,
      [questionId]
    );

    const userList = await userQuery(
      `SELECT u.id, u.first_name, u.last_name, u.profile_picture
       FROM question_likes ql
       JOIN users u ON ql.user_id = u.id
       WHERE ql.question_id = ?`,
      [questionId]
    );

    return res.status(200).json({
      status: "success",
      message: "Questions Likes fetched successfully.",
      data: {
        questionId,
        likeCount: likeCountResult.likeCount,
        users: userList,
      },
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

const removeQuestionLikes = async (req, res) => {
  const { questionId } = req.query;

  if (!questionId) {
    return res.status(400).json({
      status: "error",
      error: "Validation Error",
      message: "Question ID is required.",
      statusCode: 400,
    });
  }

  try {
    // Check if question exists
    const [existingQuestion] = await userQuery(
      `SELECT 1 FROM questions WHERE id = ? LIMIT 1`,
      [questionId]
    );

    if (!existingQuestion) {
      return res.status(404).json({
        status: "error",
        error: "Not Found",
        message: `Question with ID ${questionId} does not exist.`,
        statusCode: 404,
      });
    }

    // Check if like exists
    const [existingLike] = await userQuery(
      `SELECT 1 FROM question_likes WHERE question_id = ? AND user_id = ? LIMIT 1`,
      [questionId, req.user.userId]
    );

    if (!existingLike) {
      return res.status(404).json({
        status: "error",
        error: "Not Found",
        message: `You have not liked this question.`,
        statusCode: 404,
      });
    }

    // Delete like record
    const deleteQuery = `
            DELETE FROM question_likes 
            WHERE question_id = ? AND user_id = ?
        `;

    await userQuery(deleteQuery, [questionId, req.user.userId]);
    return res.status(200).json({
      status: "success",
      message: "Question like removed successfully.",
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

const addQuestionComments = async (req, res) => {
  const { questionId, comment } = req.body;
  const { userId } = req.user;

  // Basic validation
  if (!questionId || !comment || typeof comment !== "string") {
    return res.status(400).json({
      status: "error",
      error: "Validation Error",
      message: "Question ID and comment are required.",
      statusCode: 400,
    });
  }

  try {
    // Check if question exists
    const [existingQuestion] = await userQuery(
      `SELECT 1 FROM questions WHERE id = ? LIMIT 1`,
      [questionId]
    );

    if (!existingQuestion) {
      return res.status(404).json({
        status: "error",
        error: "Not Found",
        message: `Question with ID ${questionId} does not exist.`,
        statusCode: 404,
      });
    }

    // Insert comment
    const insertQuery = `
            INSERT INTO question_comments (question_id, user_id, comment, posted_at)
            VALUES (?, ?, ?, NOW())
        `;
    await userQuery(insertQuery, [questionId, userId, comment]);

    return res.status(201).json({
      status: "success",
      message: "Comment added successfully",
      statusCode: 201,
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

// New Code
const deleteComments = async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user?.userId || req.user?.id;
  const role = req.user?.userType || req.user?.role;

  if (!commentId) {
    return res.status(400).json({
      status: "error",
      error: "Validation Error",
      message: "Comment ID is required",
      statusCode: 400,
    });
  }

  try {
    const [comment] = await userQuery(
      `SELECT * FROM question_comments WHERE id = ? AND is_deleted = 0 LIMIT 1`,
      [commentId]
    );

    if (!comment) {
      return res.status(404).json({
        status: "error",
        error: "Not Found",
        message: `Comment ID ${commentId} not found or already deleted.`,
        statusCode: 404,
      });
    }

    // console.log("Decoded Token =>", { userId, role });
    // console.log("DB Comment =>", comment);

    // Permission check
    const isVisitor = comment.user_id === userId;
    const isAdmin = role === "admin";

    if (!isVisitor && !isAdmin) {
      return res.status(403).json({
        status: "error",
        error: "Forbidden",
        message: "You do not have permission to delete this comment.",
        statusCode: 403,
      });
    }

    // Soft Delete
    await userQuery(
      `UPDATE question_comments SET is_deleted = 1, deleted_at = NOW() WHERE id = ?`,
      [commentId]
    );

    return res.status(200).json({
      status: "success",
      message: "Comment deleted successfully..",
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

const addCommentLikes = async (req, res) => {
  const { commentId } = req.query;
  if (!commentId) {
    return res.status(400).json({
      status: "error",
      error: "Validation error",
      message: "Comment ID is required.",
      statusCode: 400,
    });
  }

  try {
    // Check if comment exists
    const [existingComment] = await userQuery(
      `SELECT 1 FROM question_comments WHERE id = ? LIMIT 1`,
      [commentId]
    );
    if (!existingComment) {
      return res.status(404).json({
        status: "error",
        error: "Not Found!",
        message: `Comment with ID ${commentId} does not exist.`,
        statusCode: 404,
      });
    }

    // Check if like already exists
    const [existingCommentLike] = await userQuery(
      `SELECT 1 FROM comment_likes WHERE comment_id = ? AND user_id = ? LIMIT 1`,
      [commentId, req.user.userId]
    );

    if (existingCommentLike) {
      return res.status(409).json({
        status: "error",
        error: "Conflict",
        message: "You have already liked this Comment",
        statusCode: 409,
      });
    }

    await userQuery(
      `INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)`,
      [commentId, req.user.userId]
    );

    return res.status(200).json({
      status: "success",
      message: "Comment Like recorded successfully",
      statusCode: 200,
    });
  } catch (error) {
    console.error("DB error: ", error);
    return res.status(500).json({
      status: "error",
      error: "Internal Server Error",
      message: error.message,
      statusCode: 500,
    });
  }
};

const getCommentLikes = async (req, res) => {
  const { commentId } = req.query;

  if (!commentId) {
    return res.status(400).json({
      status: "error",
      error: "Validation Error",
      message: "Comment ID is required.",
      statusCode: 400,
    });
  }

  try {
    const [likeCountResult] = await userQuery(
      `SELECT COUNT(*) AS likeCount FROM comment_likes WHERE comment_id = ?`,
      [commentId]
    );

    const userList = await userQuery(
      `SELECT u.id, u.first_name, u.last_name, u.profile_picture 
       FROM comment_likes cl
       JOIN users u ON cl.user_id = u.id
       WHERE cl.comment_id = ?`,
      [commentId]
    );

    return res.status(200).json({
      status: "success",
      message: "Comment Likes fetched successfully",
      data: {
        commentId,
        likeCount: likeCountResult.likeCount,
        users: userList,
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

const removeCommentLikes = async (req, res) => {
  const { commentId } = req.query;

  if (!commentId) {
    return res.status(400).json({
      status: "error",
      error: "Validation Error",
      message: "Comment ID is required.",
      statusCode: 400,
    });
  }

  try {
    const [existingComment] = await userQuery(
      `SELECT 1 FROM question_comments WHERE id = ? LIMIT 1`,
      [commentId]
    );
    if (!existingComment) {
      return res.status(404).json({
        status: "error",
        error: "Not Found!",
        message: `Comment with ID ${commentId} does not exist.`,
        statusCode: 404,
      });
    }

    const [existingCommentLike] = await userQuery(
      `SELECT 1 FROM comment_likes WHERE comment_id = ? AND user_id = ? LIMIT 1`,
      [commentId, req.user.userId]
    );

    if (!existingCommentLike) {
      return res.status(404).json({
        status: "error",
        error: "Not Found",
        message: `You have not liked this comment.`,
        statusCode: 404,
      });
    }

    await userQuery(
      `DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?`,
      [commentId, req.user.userId]
    );

    return res.status(200).json({
      status: "success",
      message: "Comment like removed successfully!.",
      statusCode: 200,
    });
  } catch (error) {
    console.error("DB error", error);
    return res.status(500).json({
      status: "error",
      error: "Internal Server Error",
      message: error.message,
      statusCode: 500,
    });
  }
};

const getCurrentUserPostedQuestions = async (req, res) => {
  const { userId } = req.user;

  // Pagination params
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  try {

    // Get total count of questions for this user
    const [countResult] = await userQuery(
      `
        SELECT COUNT(*) AS total 
        FROM questions 
        WHERE user_id = ?
      `,
      [userId]
    );
    const totalQuestions = countResult.total;
    const totalPages = Math.ceil(totalQuestions / limit);

    if (totalQuestions === 0) {
          return res.status(404).json({
            status: "error",
            error: "Not Found",
            message: "No questions found for the current user.",
            statusCode: 404,
          });
        }

    // 1. Fetch user questions
    const questions = await userQuery(
      `
            SELECT id, title, details, tags, posted_at 
            FROM questions 
            WHERE user_id = ? 
            ORDER BY posted_at DESC
            LIMIT ? OFFSET ?
        `,
      [userId, limit, offset]
    );

    if (questions.length === 0) {
      return res.status(404).json({
        status: "error",
        error: "Not Found",
        message: "No questions found for the current user.",
        statusCode: 404,
      });
    }

    const questionIds = questions.map((q) => q.id);

    // 2. Parse tags
    questions.forEach((q) => {
      q.tags = JSON.parse(q.tags || "[]");
    });

    // 3. Fetch user info
    const [user] = await userQuery(
      `
            SELECT first_name, last_name, profile_picture 
            FROM users 
            WHERE id = ?
        `,
      [userId]
    );

    // 4. Fetch likes, views, and comments counts grouped by question_id
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

    // 5. Map counts to each question
    const mapCounts = (items, key) =>
      Object.fromEntries(items.map((i) => [i.question_id, i[key]]));

    const likesMap = mapCounts(likes, "likes_count");
    const viewsMap = mapCounts(views, "views_count");
    const commentsMap = mapCounts(comments, "comments_count");

    questions.forEach((q) => {
      q.likes_count = likesMap[q.id] || 0;
      q.views_count = viewsMap[q.id] || 0;
      q.comments_count = commentsMap[q.id] || 0;
    });

    return res.status(200).json({
      status: "success",
      message: "Current user's posted questions fetched successfully.",
      user: {
        fullName: `${user.first_name} ${user.last_name}`,
        profilePicture: user.profile_picture,
      },
      data: { 
        questions,
        pagination: {
          total: totalQuestions,
          page,
          limit,
          totalPages,
        },
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

const getQuestionComments = async (req, res) => {
  const { questionId } = req.query;

  if (!questionId) {
    return res.status(400).json({
      status: "error",
      error: "Validation Error",
      message: "Question ID is required.",
      statusCode: 400,
    });
  }

  try {
    // Check if question exists
    const [existingQuestion] = await userQuery(
      `SELECT 1 FROM questions WHERE id = ? LIMIT 1`,
      [questionId]
    );

    if (!existingQuestion) {
      return res.status(404).json({
        status: "error",
        error: "Not Found",
        message: `Question with ID ${questionId} does not exist.`,
        statusCode: 404,
      });
    }

    // Fetch comments
    const comments = await userQuery(
      `
            SELECT qc.id, qc.comment, qc.posted_at, u.first_name, u.last_name, u.profile_picture
            FROM question_comments qc
            JOIN users u ON qc.user_id = u.id
            WHERE qc.question_id = ? AND qc.is_deleted = 0
            ORDER BY qc.posted_at DESC
        `,
      [questionId]
    );

    return res.status(200).json({
      status: "success",
      message: "Comments fetched successfully.",
      data: { comments },
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

const getMyQuestions = async (req, res) => {
  const { userId } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = ( page - 1) * limit;

  try {
    
    const [countResult] = await userQuery(
      `SELECT COUNT(*) AS total FROM questions WHERE user_id = ? AND deleted_at IS NULL`,
      [userId]
    );

    const total = countResult.total;

    const questions = await userQuery(
      `SELECT id, title, details, tags, is_approved, is_reject, posted_at 
       FROM questions 
       WHERE user_id = ? AND deleted_at IS NULL
       ORDER BY posted_at DESC LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    return res.status(200).json({
      status : "success",
      message : "My questions fetched successfully",
      data : questions,
      postCount : total,
      pagination: {
        currentPage: page,
        totalItems : total,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      },
      statusCode : 200,
    });

  } catch (error) {
    console.error("DB Error: ", error);
    return res.status(500).json({
      status : "error",
      error : "Internal Server Error",
      message : error.message,
      statusCode : 500,
    });
  }

}

export default {
  addQuestion,
  getQuestionsAdmin,
  updateQuestion,
  removeQuestion,
  addQuestionViews,
  addQuestionLikes,
  getQuestionLikes,
  removeQuestionLikes,
  addQuestionComments,
  deleteComments,
  getCurrentUserPostedQuestions,
  getQuestionComments,
  addCommentLikes,
  getCommentLikes,
  removeCommentLikes,
  getMyQuestions,
};
