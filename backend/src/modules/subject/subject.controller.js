import { sendSuccess } from "../../utils/apiResponse.js";
import {
    createSubjectService,
    listSubjectsService,
    getSubjectService,
    updateSubjectService,
    deleteSubjectService,
} from "./subject.service.js";

// POST /subjects
export const createSubjectController = async (req, res) => {
    const subject = await createSubjectService(req.body);

    return sendSuccess(res, {
        statusCode: 201,
        message: "Subject created successfully.",
        data: subject,
    });
};

// GET /subjects
export const listSubjectsController = async (req, res) => {
    const { items, meta } = await listSubjectsService(req.query);

    return sendSuccess(res, {
        statusCode: 200,
        message: "Subjects retrieved successfully.",
        data: items,
        meta,
    });
};

// GET /subjects/:id
export const getSubjectController = async (req, res) => {
    const subject = await getSubjectService(req.params.id);

    return sendSuccess(res, {
        statusCode: 200,
        message: "Subject retrieved successfully.",
        data: subject,
    });
};

// PATCH /subjects/:id
export const updateSubjectController = async (req, res) => {
    const subject = await updateSubjectService(req.params.id, req.body);

    return sendSuccess(res, {
        statusCode: 200,
        message: "Subject updated successfully.",
        data: subject,
    });
};

// DELETE /subjects/:id
export const deleteSubjectController = async (req, res) => {
    const result = await deleteSubjectService(req.params.id);

    return sendSuccess(res, {
        statusCode: 200,
        message: result.hardDeleted ? "Subject deleted successfully." : "Subject deactivated successfully.",
        data: result,
    });
};
