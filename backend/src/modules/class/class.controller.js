import { sendSuccess } from "../../utils/apiResponse.js";
import {
    createClassService,
    listClassesService,
    getClassService,
    updateClassService,
    deleteClassService,
} from "./class.service.js";

// POST /classes
export const createClassController = async (req, res) => {
    const klass = await createClassService(req.body);

    return sendSuccess(res, {
        statusCode: 201,
        message: "Class created successfully.",
        data: klass,
    });
};

// GET /classes
export const listClassesController = async (req, res) => {
    const { items, meta } = await listClassesService(req.query);

    return sendSuccess(res, {
        statusCode: 200,
        message: "Classes retrieved successfully.",
        data: items,
        meta,
    });
};

// GET /classes/:id
export const getClassController = async (req, res) => {
    const klass = await getClassService(req.params.id);

    return sendSuccess(res, {
        statusCode: 200,
        message: "Class retrieved successfully.",
        data: klass,
    });
};

// PATCH /classes/:id
export const updateClassController = async (req, res) => {
    const klass = await updateClassService(req.params.id, req.body);

    return sendSuccess(res, {
        statusCode: 200,
        message: "Class updated successfully.",
        data: klass,
    });
};

// DELETE /classes/:id
export const deleteClassController = async (req, res) => {
    const result = await deleteClassService(req.params.id);

    return sendSuccess(res, {
        statusCode: 200,
        message: result.hardDeleted ? "Class deleted successfully." : "Class deactivated successfully.",
        data: result,
    });
};
