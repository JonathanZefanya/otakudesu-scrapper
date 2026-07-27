import type { Response } from "express";
import type { ApiResponse, Pagination } from "../types/index.js";

/**
 * Standard API response helper.
 */
export function setPayload<T>(
	res: Response,
	options: {
		message?: string;
		data?: T;
		pagination?: Pagination | null;
	} = {},
): ApiResponse<T> {
	const statusCode = res.statusCode;
	const statusMessage = res.statusMessage || "OK";

	const body: ApiResponse<T> = {
		statusCode,
		statusMessage,
		message: options.message || "",
	};

	if (options.data !== undefined) body.data = options.data;
	if (options.pagination !== undefined) body.pagination = options.pagination;

	return body;
}
