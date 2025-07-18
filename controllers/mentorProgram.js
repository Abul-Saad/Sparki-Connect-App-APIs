import dotenv from "dotenv";
dotenv.config();

import _ from "lodash";
import userQuery from "../utils/helper/dbHelper.js";

const createMentorProgram = async (req, res) => {
  const {
    title,
    subtitle,
    access_type,
    status,
    skill_tiers,
    modules,
    new_content_monthly,
  } = req.body;

  const iconFile = req.file;
  const iconPath = iconFile
    ? `/uploads/mentor_icons/${iconFile.filename}`
    : null;

  if (!req.user || req.user.userType !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Access denied. Only admin can upload PDF templates.",
      statusCode: 403,
    });
  }

  if (!title || !subtitle || !access_type || !status) {
    return res.status(400).json({
      status: "error",
      message: "All required fields",
      statusCode: 400,
    });
  }

  try {
    await userQuery(
      `INSERT INTO mentor_programs 
       (title, subtitle, icons, access_type, status, skill_tiers, modules, new_content_monthly) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        subtitle,
        iconPath,
        access_type,
        status,
        skill_tiers,
        modules,
        new_content_monthly === "true" || new_content_monthly === true ? 1 : 0,
      ]
    );

    return res.status(200).json({
      status: "success",
      message: "Mentor Program added successfully",
      statusCode: 200,
    });
  } catch (error) {
    console.error("Add Mentor Program : ", error);
    return res.status(500).json({
      status: "error",
      error: "Internal Server Error",
      message: error.message,
      statusCode: 500,
    });
  }
};

const getAllMentorProgram = async (req, res) => {

  //here is admin and pro users get mentors programs

  // if(req.user.userType !== "admin") {
  //   if(req.user.subscription_type !== "pro"){
  //     return res.status(403).json({
  //       status : "error",
  //       message : "Access denied. Only 'pro' users or admins can access mentor programs.",
  //       statusCode : 403,
  //     });
  //   }
  // }

  if(!req.user || req.user.userType !== "admin") {
    return res.status(403).json({
      status : "error",
      message : "Access denied. Only admin can get mentor program.",
      statusCode : 403,
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {

    const countResult = await userQuery(`SELECT COUNT(*) as count FROM mentor_programs`);
    const totalItems = countResult[0].count;
    const totalPages = Math.ceil(totalItems / limit);


    const data = await userQuery(
      `SELECT * FROM mentor_programs ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return res.status(200).json({
      status: "success",
      message: "Mentor programs fetched successfully.",
      data: data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        pageSize: limit,
      },
      statusCode: 200,
    });
  } catch (error) {
    console.error("DB Error", error);
    return res.status(500).json({
      status: "error",
      error: "Internal Server Error",
      message: error.message,
      statusCode: 500,
    });
  }
};

const updateMentorProgram = async (req, res) => {
  if (!req.user || req.user.userType !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Access denied. Only admin can update mentor programs.",
      statusCode: 403,
    });
  }

  const {
    id,
    title,
    subtitle,
    access_type,
    status,
    skill_tiers,
    modules,
    new_content_monthly,
  } = req.body;

  const iconFile = req.file;
  const iconPath = iconFile
    ? `/uploads/mentor_icons/${iconFile.filename}`
    : null;

  if (!id) {
    return res.status(400).json({
      status: "error",
      message: "Mentor Program ID is required.",
      statusCode: 400,
    });
  }

  try {
    const updateFields = [
      "title = ?",
      "subtitle = ?",
      "access_type = ?",
      "status = ?",
      "skill_tiers = ?",
      "modules = ?",
      "new_content_monthly = ?",
    ];

    const values = [
      title,
      subtitle,
      access_type,
      status,
      skill_tiers,
      modules,
      new_content_monthly,
    ];

    if (iconPath) {
      updateFields.push("icons = ?");
      values.push(iconPath);
    }

    values.push(id);
    await userQuery(
      `UPDATE mentor_programs SET ${updateFields.join(", ")} WHERE id = ?`,
      values
    );

    return res.status(200).json({
      status: "success",
      message: "Mentor program updated successfully.",
      statusCode: 200,
    });
  } catch (error) {
    console.error("Update Mentor Error:", error);
    return res.status(500).json({
      status: "error",
      message: error.message,
      statusCode: 500,
    });
  }
};

const deleteMentorProgram = async (req, res) => {
  const { id } = req.params;

  if (!req.user || req.user.userType !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Access denied. Only admin can delete mentor programs.",
      statusCode: 403,
    });
  }

  try {

    const result = await userQuery(
      `SELECT id FROM mentor_programs WHERE id = ?`,
      [id]
    );
    if (result.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Mentor program not found or already deleted.",
        statusCode: 404,
      });
    }

    await userQuery(`DELETE FROM mentor_programs WHERE id = ?`, [id]);

    return res.status(200).json({
      status: "success",
      message: "Mentor program deleted successfully.",
      statusCode: 200,
    });
  } catch (error) {
    console.error("Delete : Error", error);
    return res.status(500).json({
      status: "error",
      error: "Internal Server Error",
      message: error.message,
      statusCode: 500,
    });
  }
};

const toggleMentorVisibility = async (req, res) => {
  if(!req.user || req.user.userType !== "admin") {
    return res.status(403).json({
      status : "error",
      message : "Access denied. Only admin can hide and Unhide Mentor Programs.",
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
      `SELECT id, is_hidden FROM mentor_programs WHERE id = ? LIMIT 1`,
      [id]
    );

    if(!existing){
      return res.status(404).json({
        status : "error",
        message : "No Mentor Program found with given ID.",
        statusCode : 404,
      });
    }

    const hide_unhide = existing.is_hidden === 1 ? 0 : 1;

    await userQuery(
      `UPDATE mentor_programs SET is_hidden = ? WHERE id = ?`,
      [hide_unhide, id]
    );

    return res.status(200).json({
      status : "success",
      message : `Mentor Program ${hide_unhide ? "hidden" : "unhidden"} successfully.`,
      is_hidden : hide_unhide,
      statusCode : 200,
    });

  } catch (error) {
    console.error("Toogle Mentor Program Error", error);
    return res.status(500).json({
      status : "error",
      message : "Internal Server Error",
      statusCode : 500,
    });
  }
};

const getUnhideMentorProgram = async (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    
    const countResult = await userQuery(`SELECT COUNT(*) as count FROM mentor_programs`);
    const totalItems = countResult[0].count;
    const totalPages = Math.ceil(totalItems / limit);

    const unhideMentorProgram = await userQuery(
      `SELECT * FROM mentor_programs WHERE is_hidden = 0 ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return res.status(200).json({
      status : "success",
      message : "Unhide Mentor Programs fetched successfully!.",
      data : unhideMentorProgram,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        pageSize: limit,
      },
      statusCode : 200,
    });

  } catch (error) {
    console.error("Get Unhide Mentor Program Error", error);
    return res.status(500).json({
      status : "error",
      error : "Internal Server Error",
      message : error.message,
      statusCode : 500,
    });
  }
}

export default {
  createMentorProgram,
  getAllMentorProgram,
  updateMentorProgram,
  deleteMentorProgram,
  toggleMentorVisibility,
  getUnhideMentorProgram,
};
