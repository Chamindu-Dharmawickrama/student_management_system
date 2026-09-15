import { sendSuccess } from "../../utils/apiResponse.js";
import {
    createGradeBandService,
    listGradeBandsService,
    getGradeBandService,
    updateGradeBandService,
    deleteGradeBandService,
} from "./gradeBand.service.js";

export const createGradeBandController = async (req, res) => {
    const band = await createGradeBandService(req.body);
    return sendSuccess(res, { statusCode: 201, message: "Grade band created successfully.", data: band });
};

export const listGradeBandsController = async (req, res) => {
    const { items, meta } = await listGradeBandsService(req.query);
    return sendSuccess(res, { statusCode: 200, message: "Grade bands retrieved successfully.", data: items, meta });
};

export const getGradeBandController = async (req, res) => {
    const band = await getGradeBandService(req.params.id);
    return sendSuccess(res, { statusCode: 200, message: "Grade band retrieved successfully.", data: band });
};

export const updateGradeBandController = async (req, res) => {
    const band = await updateGradeBandService(req.params.id, req.body);
    return sendSuccess(res, { statusCode: 200, message: "Grade band updated successfully.", data: band });
};

export const deleteGradeBandController = async (req, res) => {
    await deleteGradeBandService(req.params.id);
    return sendSuccess(res, { statusCode: 200, message: "Grade band deleted successfully.", data: { id: req.params.id } });
};
