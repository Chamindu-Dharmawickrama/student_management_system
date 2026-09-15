import { sendSuccess } from "../../utils/apiResponse.js";
import { getTeacherService } from "../teacher/teacher.service.js";
import { createMarkService, updateMarkService, listTeacherMarksService, createBulkMarksService } from "../marks/marks.service.js";
import { getMyClassesService, getMyStudentsService } from "./teacherPortal.service.js";

// GET /teacher/me — reuses the admin detail service unchanged: User.id is
// the FK anchor for TeacherProfile, so req.user.id works exactly like the
// admin's :id path param.
export const getMyProfileController = async (req, res) => {
    const teacher = await getTeacherService(req.user.id);

    return sendSuccess(res, {
        statusCode: 200,
        message: "Profile retrieved successfully.",
        data: teacher,
    });
};

// GET /teacher/classes
export const getMyClassesController = async (req, res) => {
    const data = await getMyClassesService(req.user.id);

    return sendSuccess(res, {
        statusCode: 200,
        message: "Classes retrieved successfully.",
        data,
    });
};

// GET /teacher/students
export const getMyStudentsController = async (req, res) => {
    const { items, meta } = await getMyStudentsService(req.user.id, req.query);

    return sendSuccess(res, {
        statusCode: 200,
        message: "Students retrieved successfully.",
        data: items,
        meta,
    });
};

// GET /teacher/marks
export const listMyMarksController = async (req, res) => {
    const { items, meta } = await listTeacherMarksService(req.user.id, req.query);

    return sendSuccess(res, {
        statusCode: 200,
        message: "Marks retrieved successfully.",
        data: items,
        meta,
    });
};

// POST /teacher/marks
export const createMarkController = async (req, res) => {
    const mark = await createMarkService(req.user.id, req.body);

    return sendSuccess(res, {
        statusCode: 201,
        message: "Mark entered successfully.",
        data: mark,
    });
};

// POST /teacher/marks/bulk
export const bulkCreateMarksController = async (req, res) => {
    const result = await createBulkMarksService(req.user.id, req.body);

    return sendSuccess(res, {
        statusCode: 200,
        message: "Bulk marks recorded.",
        data: result,
    });
};

// PATCH /teacher/marks/:id
export const updateMarkController = async (req, res) => {
    const mark = await updateMarkService(req.user.id, req.params.id, req.body);

    return sendSuccess(res, {
        statusCode: 200,
        message: "Mark updated successfully.",
        data: mark,
    });
};
