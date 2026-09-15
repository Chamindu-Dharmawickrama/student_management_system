import { sendSuccess } from "../../utils/apiResponse.js";
import { getAdminDashboardService, getTeacherDashboardService, getStudentDashboardService } from "./dashboard.service.js";

// GET /dashboard/admin
export const getAdminDashboardController = async (req, res) => {
    const data = await getAdminDashboardService(req.query);
    return sendSuccess(res, { statusCode: 200, message: "Admin dashboard retrieved successfully.", data });
};

// GET /dashboard/teacher
export const getTeacherDashboardController = async (req, res) => {
    const data = await getTeacherDashboardService(req.user.id);
    return sendSuccess(res, { statusCode: 200, message: "Teacher dashboard retrieved successfully.", data });
};

// GET /dashboard/student
export const getStudentDashboardController = async (req, res) => {
    const data = await getStudentDashboardService(req.user.id);
    return sendSuccess(res, { statusCode: 200, message: "Student dashboard retrieved successfully.", data });
};
