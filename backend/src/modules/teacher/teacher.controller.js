import { sendSuccess } from "../../utils/apiResponse.js";
import {
    registerTeacherService,
    listTeachersService,
    getTeacherService,
    updateTeacherService,
    deactivateTeacherService,
} from "./teacher.service.js";

// POST /teachers
export const createTeacherController = async (req, res) => {
    const teacher = await registerTeacherService(req.body);

    return sendSuccess(res, {
        statusCode: 201,
        message: "Teacher registered successfully. Login credentials have been emailed.",
        data: teacher,
    });
};

// GET /teachers
export const listTeachersController = async (req, res) => {
    const { items, meta } = await listTeachersService(req.query);

    return sendSuccess(res, {
        statusCode: 200,
        message: "Teachers retrieved successfully.",
        data: items,
        meta,
    });
};

// GET /teachers/:id
export const getTeacherController = async (req, res) => {
    const teacher = await getTeacherService(req.params.id);

    return sendSuccess(res, {
        statusCode: 200,
        message: "Teacher retrieved successfully.",
        data: teacher,
    });
};

// PATCH /teachers/:id
export const updateTeacherController = async (req, res) => {
    const teacher = await updateTeacherService(req.params.id, req.body);

    return sendSuccess(res, {
        statusCode: 200,
        message: "Teacher updated successfully.",
        data: teacher,
    });
};

// DELETE /teachers/:id
export const deleteTeacherController = async (req, res) => {
    await deactivateTeacherService(req.params.id, req.user.id);

    return sendSuccess(res, {
        statusCode: 200,
        message: "Teacher deactivated successfully.",
        data: { id: req.params.id, isActive: false },
    });
};
