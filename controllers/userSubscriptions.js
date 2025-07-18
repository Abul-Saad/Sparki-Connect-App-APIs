import dotenv from "dotenv";
dotenv.config();
import _ from "lodash";

import userQuery from "../utils/helper/dbHelper.js";

const adminUpdateUserSubscription = async (req, res) =>{
  const { id } = req.params;
  const { subscription_type } = req.body;

    if (!req.user || req.user.userType !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Only admin can update user subscriptions.",
      statusCode: 403,
    });
  }

  if(!["free", "pro"].includes(subscription_type)){
    return res.status(400).json({
      status : "error",
      message : "Invalid subscription type. Must be 'free' or 'pro'.",
      statusCode : 400,
    });
  }

  try {
    const [user] = await userQuery(
      `SELECT * FROM users WHERE id = ?`,
      [id]
    );

    if(!user) {
      return res.status(404).json({
        status : "error",
        message : "User not found",
        statusCode : 404,
      });
    }

    if(user.user_type === "admin") {
      return res.status(403).json({
        status : "error",
        message : "Cannot change subscription for admin users.",
        statusCode : 403,
      });
    }

    await userQuery(
      `UPDATE users SET subscription_type = ? WHERE id = ?`,
      [subscription_type, id]
    );

    return res.status(200).json({
      status : "success",
      message : `User ${id}'s subscription updated to ${subscription_type}.`,
      statusCode : 200,
    });

  } catch (error) {
    console.error("Admin Update Subscription Error: ", error);
    return res.status(500).json({
      status : "error",
      message : "Internal Server Error",
      error : error.message,
      statusCode : 500,
    });
  }
}

const getAllUsers = async (req, res) => {
    try {
      if (req.user.userType !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Only admin can access the Subscription User's.",
        statusCode: 403,
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

        // Count total users
    const [countResult] = await userQuery(
      `SELECT COUNT(*) AS total FROM users 
       WHERE user_type != 'admin' 
       AND subscription_type IN ('free', 'pro')`
    );
    const total = countResult.total;
    const totalPages = Math.ceil(total / limit);
    
    const users = await userQuery(
      `SELECT id, first_name, last_name, email, subscription_type, user_type 
       FROM users 
       WHERE user_type != 'admin' 
       AND subscription_type IN ('free', 'pro')
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
 
    return res.status(200).json({
      status: "success",
      message: "Fetched subscribed users",
      users,
      page,
      limit,
      total,
      totalPages,
      statusCode: 200,
    });

    } catch (error) {
        console.error("Get All User's Error : ", error);
        return res.status(500).json({
            status : "error",
            message : "Internal Server Error",
            error : error.message,
            statusCode : 500
        });
    }

}

export default {
    adminUpdateUserSubscription,
    getAllUsers,
}