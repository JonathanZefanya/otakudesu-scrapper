import { pipe, string, number, optional, regex, minLength, maxLength } from "valibot";

/** Validasi page query param */
export const PageSchema = optional(
	pipe(string(), regex(/^\d{1,6}$/, "Page must be digits 1-6")),
	"1",
);

/** Validasi search query param */
export const SearchSchema = pipe(
	string(),
	minLength(1, "Search query is required"),
	maxLength(50, "Search query too long"),
);

/** Schema untuk parse page number dari query */
export const PageNumberSchema = pipe(
	optional(string(), "1"),
	// akan di-parse manual via Number()
);
