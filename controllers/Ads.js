import dotenv from "dotenv";
dotenv.config();

import _ from "lodash";
import userQuery from "../utils/helper/dbHelper.js";

const AddAds = async (req, res) => {
  const {
    title,
    subtitle,
    button_text,
    button_url,
    start_date,
    end_date,
  } = req.body;

  const image_url = req.file ? `/uploads/ads_images/${req.file.filename}` : null;
  const user = req.user;

  // Check if the userType is admin
  if (!user || user.userType !== "admin") {
    return res.status(403).json({
      error: "Forbidden",
      message: "You are not authorized to perform this action",
      statusCode: 403,
      status: "error",
    });
  }

  if (
    !title ||
    !subtitle ||
    !button_text ||
    !button_url ||
    !image_url ||
    !start_date ||
    !end_date
  ) {
    return res.status(400).json({
      error: "Missing required fields",
      statusCode: 400,
      status: "error",
    });
  }

  try {
    const existingAd = await userQuery(
      `SELECT * FROM ads WHERE title = ? AND subtitle = ? AND button_url = ? AND image_url = ? AND start_date = ? AND end_date = ?`,
      [title, subtitle, button_url, image_url, start_date, end_date]
    );

    if (existingAd.length > 0) {
      return res.status(409).json({
        error: "Conflict",
        message: "An ad with the same title and date range already exists",
        statusCode: 409,
        status: "error",
      });
    }
    const query = `INSERT INTO ads(
                    title,
                    subtitle, 
                    button_text, 
                    button_url, 
                    image_url, 
                    start_date, 
                    end_date, 
                    created_at
                    ) VALUES(?, ?, ?, ?, ?, ?, ?, NOW())`;

    const values = [
      title,
      subtitle,
      button_text,
      button_url,
      image_url,
      start_date,
      end_date,
    ];

    await userQuery(query, values);

    return res.status(200).json({
      message: "Advertisement added successfully",
      statusCode: 200,
      status: "success",
    });
  } catch (error) {
    console.log("DB Error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
      statusCode: 500,
      status: "error",
    });
  }
};

const getAds = async (req, res) => {
  try {
    const ads = await userQuery(`
      SELECT 
        id,
        title,
        subtitle,
        button_text,
        button_url,
        image_url,
        start_date,
        end_date,
        created_at
      FROM ads
      ORDER BY created_at DESC
    `);

    return res.status(200).json({
      message: "Advertisements fetched successfully",
      data: ads,
      statusCode: 200,
      status: "success",
    });
  } catch (error) {
    console.log("DB Error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
      statusCode: 500,
      status: "error",
    });
  }
};

const updateAds = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    subtitle,
    button_text,
    button_url,
    start_date,
    end_date,
  } = req.body;
  
  const image_url = req.file ? `/uploads/ads_images/${req.file.filename}` : null;
  const user = req.user;
  // Check if the userType is admin
  if (!user || user.userType !== "admin") {
    return res.status(403).json({
      error: "Forbidden",
      message: "You are not authorized to perform this action",
      statusCode: 403,
      status: "error",
    });
  }

  const fieldsToUpdate = {};
  if (title !== undefined) fieldsToUpdate.title = title;
  if (subtitle !== undefined) fieldsToUpdate.subtitle = subtitle;
  if (button_text !== undefined) fieldsToUpdate.button_text = button_text;
  if (button_url !== undefined) fieldsToUpdate.button_url = button_url;
  if (image_url !== undefined) fieldsToUpdate.image_url = image_url;
  if (start_date !== undefined) fieldsToUpdate.start_date = start_date;
  if (end_date !== undefined) fieldsToUpdate.end_date = end_date;

  if (Object.keys(fieldsToUpdate).length === 0) {
    return res.status(400).json({
      error: "Bad request",
      message: "At least one field must be provided to update",
      statusCode: 400,
      status: "error",
    });
  }

  try {
    const setClause = Object.keys(fieldsToUpdate)
      .map((field) => `${field} = ?`)
      .join(", ");
    const values = [...Object.values(fieldsToUpdate), id];

    const query = `UPDATE ads SET ${setClause} WHERE id = ?`;
    const result = await userQuery(query, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "Advertisement not found",
        statusCode: 404,
        status: "error",
      });
    }

    return res.status(200).json({
      message: "Advertisement updated successfully",
      statusCode: 200,
      status: "success",
    });
  } catch (error) {
    console.error("DB Error", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
      statusCode: 500,
      status: "Error",
    });
  }
};

const deleteAds = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  if (!user || user.userType !== "admin") {
    return res.status(403).json({
      error: "Forbidden",
      message: "You are not authorized to perform this action",
      statusCode: 403,
      status: "error",
    });
  }

  try {
    const result = await userQuery(`DELETE FROM ads WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "Advertisement not found",
        statusCode: 404,
        status: "error",
      });
    }

    return res.status(200).json({
      message: "Advertisement deleted successfully",
      statusCode: 200,
      status: "success",
    });
  } catch (error) {
    console.error("DB Error: ", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
      statusCode: 500,
      status: "error",
    });
  }
};

export default {
  AddAds,
  getAds,
  updateAds,
  deleteAds
};
