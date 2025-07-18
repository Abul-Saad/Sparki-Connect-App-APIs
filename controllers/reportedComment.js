import dotenv from "dotenv";
dotenv.config();
import _ from "lodash";
import userQuery from "../utils/helper/dbHelper.js";

// Reported Comment and display the Admin only

const reportedComment = async (req, res) => {
  const {commentId, reason} = req.body;
  const {userId} = req.user;

  if(!commentId || !reason || typeof reason !== "string")
  {
    return res.status(400).json({
      status : "error",
      message : "Comment ID and reason are required.",
      statusCode : 400
    });
  }

  try {
    const [reportedCommentExists] = await userQuery(
      `SELECT 1 FROM question_comments WHERE id = ? LIMIT 1`,
      [commentId]
    );

    if(!reportedCommentExists){
      return res.status(404).json({
        status : "error",
        message : `Comment with ID ${commentId} not found.`,
        statusCode : 404
      });
    }

    await userQuery(
      `INSERT INTO reported_comments (comment_id, reported_by, reason) VALUES (?, ?, ?)`,
      [commentId, userId, reason]
    );

    return res.status(200).json({
      status : "success",
      message : "Comment reported successfully.",
      statusCode: 200,
    });

  } catch (error) {
    console.error("Report Error: ", error);
    return res.status(500).json({
      status : "error",
      message : "Internal Server Error",
      statusCode : 500
    });
  }
};

const getReportedComment = async (req, res) => {
  const user = req.user;
  if(!user || user.userType !== "admin"){
    return res.status(403).json({
      status : "error",
      message : "Access denied. Admins only.",
      statusCode : 403,
    });
  }

   const page = parseInt(req.query.page) || 1;
   const limit = parseInt(req.query.limit) || 10;

  try {

    // Get total count first
    const totalCountResult = await userQuery(
      `SELECT COUNT(*) AS total FROM reported_comments`
    );
    const totalCount = totalCountResult[0].total;

    const totalPages = Math.ceil(totalCount / limit);
    const safePage = page > totalPages ? totalPages : page;
    const offset = (safePage - 1) * limit;

    // Fetch paginated data
    const reports = await userQuery(
      `SELECT 
        ra.id,
        ra.comment_id,
        qc.comment AS comment_content,
        ra.reason,
        ra.reported_by,
        CONCAT(u.first_name, ' ', u.last_name) AS reporter_name,
        ra.reported_at
      FROM reported_comments ra
      JOIN question_comments qc ON ra.comment_id = qc.id
      JOIN users u ON ra.reported_by = u.id
      ORDER BY ra.reported_at DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return res.status(200).json({
      status : "success",
      message : "Fetch All Reported Comments",
      data : reports,
      pagination: {
        total: totalCount,
        page: safePage,
        limit,
        totalPages
      },
      statusCode : 200
    });
    
  } catch (error) {
    console.error("Fetch Reported Error: ", error);
    return res.status(500).json({
      status : "error",
      message : "Internal Server Error",
      statusCode : 500,
    });
  }
};

export default {
    reportedComment,
    getReportedComment,
}