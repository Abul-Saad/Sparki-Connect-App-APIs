import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";

import _ from "lodash";
import userQuery from "../utils/helper/dbHelper.js";

const addCalculator = async (req, res) => {
  if (!req.user || req.user.userType !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Access denied. Only admin can add calculators.",
      statusCode: 403,
    });
  }

  let { title, subtitle, coming_soon } = req.body;

  const iconFile = req.file;
  const iconPath = iconFile
    ? `/uploads/calculator_icons/${iconFile.filename}`
    : null;

  if (!title) {
    return (
      res.status(400),
      json({
        status: "error",
        message: "Title are required.",
        statusCode: 400,
      })
    );
  }

  title = title.trim();
  subtitle = subtitle ? subtitle.trim() : null;

  if (title.length < 3 || title.length > 100) {
    return res.status(400).json({
      status: "error",
      message: "Title must be between 3 and 100 characters.",
      statusCode: 400,
    });
  }

  if (subtitle && subtitle.length > 200) {
    return res.status(400).json({
      status: "error",
      message: "Title must be less than 200 characters.",
      statusCode: 400,
    });
  }

  if (coming_soon !== undefined && coming_soon !== null) {
    if (
      !(
        coming_soon === true ||
        coming_soon === false ||
        coming_soon === 0 ||
        coming_soon === 1 ||
        coming_soon === "0" ||
        coming_soon === "1"
      )
    ) {
      return res.status(400).json({
        status: "error",
        message: "Coming Soon must be boolean or 0/1.",
        statusCode: 400,
      });
    }
    coming_soon =
      coming_soon === true || coming_soon === 1 || coming_soon === "1" ? 1 : 0;
  } else {
    coming_soon = 0;
  }

  try {
    const [existing] = await userQuery(
      `SELECT id FROM calculators_versions WHERE title = ? LIMIT 1`,
      [title]
    );

    if (existing && existing.id) {
      return res.status(409).json({
        status: "error",
        message: "A calculator with this title already exists.",
        statusCode: 409,
      });
    }

    await userQuery(
      `INSERT INTO calculators_versions (title, subtitle, icon_path, coming_soon) VALUES (?, ?, ?, ?)`,
      [title, subtitle, iconPath, coming_soon]
    );

    return res.status(200).json({
      status: "success",
      message: "Calculator added successfully.",
      statusCode: 200,
    });
  } catch (error) {
    console.error("Add Calculator Error : ", error);
    return res.status(500).json({
      status: "error",
      error: "Internal Server Error",
      message: error.message,
      statusCode: 500,
    });
  }
};

const getAllCalculator = async (req, res) => {

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

   if(!req.user || req.user.userType !== "admin"){
    return res.status(403).json({
      status : "error",
      message : "Access denied. Only admin can access the all calculator hide n unhide.",
      statusCode : 403,
    });
  }
  try {

    const [countResult] = await userQuery(
      `
        SELECT COUNT(*) AS total 
        FROM calculators_versions
      `
    );
    const totalCalculators = countResult.total;
    const totalPages = Math.ceil(totalCalculators / limit);

    if (totalCalculators === 0) {
      return res.status(404).json({
        status: "error",
        error: "Not Found",
        message: "No calculators found.",
        statusCode: 404,
      });
    }

    const calculators = await userQuery(
      `SELECT * FROM calculators_versions ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return res.status(200).json({
      status: "success",
      message: "Calculators fetched successfully.",
      data: {
        calculators,
        pagination: {
          total: totalCalculators,
          page,
          limit,
          totalPages,
        },
      },
      statusCode: 200,
    });
  } catch (error) {
    console.error("Get Calculator Error : ", error);
    return res.status(500).json({
      status: "error",
      error: "Internal Server Error",
      message: error.message,
      statusCode: 500,
    });
  }
};

const updateCalculator = async (req, res) => {
  if (!req.user || req.user.userType !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Access denied. Only admin can update calculators.",
      statusCode: 403,
    });
  }

  const { id } = req.params;
  let { title, subtitle, coming_soon } = req.body;

  if (!id || isNaN(id)) {
    return res.status(400).json({
      status: "error",
      message: "Valid ID is required.",
      statusCode: 400,
    });
  }

  if (!title) {
    return res.status(400).json({
      status: "error",
      message: "Title is required.",
      statusCode: 400,
    });
  }

  title = title.trim();
  subtitle = subtitle ? subtitle.trim() : null;

  if (title.length < 3 || title.length > 100) {
    return res.status(400).json({
      status: "error",
      message: "Title must be between 3 and 100 characters.",
      statusCode: 400,
    });
  }

  if (subtitle && subtitle.length > 200) {
    return res.status(400).json({
      status: "error",
      message: "Subtitle must be less than 200 characters.",
      statusCode: 400,
    });
  }

  if (coming_soon !== undefined && coming_soon !== null) {
    if (
      !(
        coming_soon === true ||
        coming_soon === false ||
        coming_soon === 0 ||
        coming_soon === 1 ||
        coming_soon === "0" ||
        coming_soon === "1"
      )
    ) {
      return res.status(400).json({
        status: "error",
        message: "Coming Soon must be boolean or 0/1.",
        statusCode: 400,
      });
    }
    coming_soon =
      coming_soon === true || coming_soon === 1 || coming_soon === "1" ? 1 : 0;
  } else {
    coming_soon = 0;
  }

  const iconFile = req.file;
  const iconPath = iconFile
    ? `/uploads/calculator_icons/${iconFile.filename}`
    : null;

  try {
    const [existing] = await userQuery(
      `SELECT id FROM calculators_versions WHERE title = ? AND id != ? LIMIT 1`,
      [title, id]
    );

    if (existing && existing.id) {
      return res.status(409).json({
        status: "error",
        message: "A calculator with this title already exists.",
        statusCode: 409,
      });
    }

    let query;
    let params;

    if (iconPath) {
      query = `UPDATE calculators_versions 
             SET title = ?, subtitle = ?, icon_path = ?, coming_soon = ? 
             WHERE id = ?`;
      params = [title, subtitle, iconPath, coming_soon, id];
    } else {
      query = `UPDATE calculators_versions 
             SET title = ?, subtitle = ?, coming_soon = ? 
             WHERE id = ?`;
      params = [title, subtitle, coming_soon, id];
    }

    const result = await userQuery(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "No calculator found with the given ID.",
        statusCode: 404,
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Calculator updated successfully.",
      statusCode: 200,
    });
  } catch (error) {
    console.error("Update Calculator Error: ", error);
    return res.status(500).json({
      status: "error",
      error: "Internal Server Error",
      message: error.message,
      statusCode: 500,
    });
  }
};

const deleteCalculator = async (req, res) => {
    if (!req.user || req.user.userType !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Access denied. Only admin can delete calculator.",
      statusCode: 403,
    });
  }
  const { id } = req.params;
  if(!id || isNaN(id)){
    return res.status(400).json({
        status : "error",
        message : "Valid ID is required.",
        statusCode : 400,
    });
  }

  try {
    const [existing] = await userQuery(
        `SELECT icon_path FROM calculators_versions WHERE id = ? LIMIT 1`,
        [id]
    );
    if(!existing){
        return res.status(404).json({
            status : "error",
            message : "No calculator found with the given ID.",
            statusCode : 404
        });
    }

    const result = await userQuery(
        `DELETE FROM calculators_versions WHERE id = ?`,
        [id]
    );

    if(result.affectedRows === 0){
        return res.status(404).json({
            status : "error",
            message : "No calculator found with the given ID.",
            statusCode : 404,
        });
    }
    // Remove icon file if exists
    if (existing.icon_path) {
      const filePath = path.join(process.cwd(), existing.icon_path);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.warn(`Failed to delete icon file at ${filePath}:`, err.message);
        }
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Calculator deleted successfully.",
      statusCode: 200,
    });
  } catch (error) {
    console.error("Delete Calculator Error: ", error);
    return res.status(500).json({
        status : "error",
        error : "Internal Server Error",
        message : error.message,
        statusCode : 500,
    });
  }
}

const toggleCalculatorVisibility = async (req, res) => {
  if(!req.user || req.user.userType !== "admin"){
    return res.status(403).json({
      status : "error",
      message : "Access denied. Only admin can hide and Unhide status change.",
      statusCode : 403,
    });
  }

  const { id } = req.params;
  if(!id || isNaN(id)) {
    return res.status(400).json({
      status : "error",
      message : "Valid ID is required.",
      statusCode : 400,
    });
  }
  try {
    const [existing] = await userQuery(
      `SELECT id, is_hidden FROM calculators_versions WHERE id = ? LIMIT 1`,
      [id]
    );

    if(!existing) {
      return res.status(404).json({
        status : "error",
        message : "No calculator found with the given ID.",
        statusCode : 404
      });
    }

    const hide_unhide = existing.is_hidden === 1 ? 0 : 1;

    await userQuery(
      `UPDATE calculators_versions SET is_hidden = ? WHERE id = ?`,
      [hide_unhide, id]
    );

    return res.status(200).json({
      status : "success",
      message : `Calculator ${hide_unhide ? "unhidden" : "hidden"} successfully.`,
      is_hidden : hide_unhide,
      statusCode : 200,
    });

  } catch (error) {
    console.error("Toogle Calculator Error", error);
    return res.status(500).json({
      status : "error",
      message : "Internal Server Error",
      statusCode : 500,
    });
  }

}

const getUnhideCalculator = async (req, res) => {

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;
  
  try {
    
    const [countResult] = await userQuery(
      `
        SELECT COUNT(*) AS total
        FROM calculators_versions
        WHERE is_hidden = 1
      `
    );

    const total = countResult.total;
    const totalPages = Math.ceil(total / limit);

    if (total === 0) {
      return res.status(404).json({
        status: "error",
        error: "Not Found",
        message: "No unhide calculators found.",
        statusCode: 404,
      });
    }

    const unhideCalculator = await userQuery(
      `SELECT * FROM calculators_versions WHERE is_hidden = 1 ORDER BY created_at DESC
      LIMIT ? OFFSET ?
      `,
      [limit, offset]
    );

    return res.status(200).json({
      status : "success",
      message : "Unhide Calculator fetched successfully!.",
      data : {
        unhideCalculators: unhideCalculator,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      },
      statusCode : 200,
    });

  } catch (error) {
    console.error("Get Unhide Calculator Error", error);
    return res.status(500).json({
      status : "error",
      error : "Internal Server Error",
      message : error.message,
      statusCode : 500,
    });
  }

}

const toggleComingSoonLabel = async (req, res) => {
  if(!req.user || req.user.userType !== "admin"){
    return res.status(403).json({
      status : "error",
      message : "Access denied. Only admin can coming soon Label status change.",
      statusCode : 403,
    });
  }

  const { id } = req.params;
  if(!id || isNaN(id)) {
    return res.status(400).json({
      status : "error",
      message : "Valid ID is required.",
      statusCode : 400,
    });
  }

  try {
    const [row] = await userQuery(`SELECT coming_soon FROM calculators_versions WHERE id = ?`,[id]);

    if(!row) {
      return res.status(404).json({
        status : "error",
        message : "No Coming Soon found with the given ID.",
        statusCode : 404
      });
    }

    const updated = row.coming_soon === 1 ? 0 : 1;
    await userQuery(`UPDATE calculators_versions SET coming_soon = ? WHERE id = ?`, [updated, id]);
    res.status(200).json({
      status: "success",
      message: `Coming Soon label ${updated ? "enabled" : "disabled"}.`,
      coming_soon: updated,
    });

  } catch (error) {
    console.error("Coming Soon toggle error:", error);
    res.status(500).json({
      status : "error",
      message : "Internal Server Error",
      error : error.message,
      statusCode : 500,
    })
  }

}


export default {
  addCalculator,
  getAllCalculator,
  updateCalculator,
  deleteCalculator,
  toggleCalculatorVisibility,
  getUnhideCalculator,
  toggleComingSoonLabel,
};
