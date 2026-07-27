import { pipe, string, optional, regex, minLength, maxLength } from "valibot";

export const PageSchema = optional(
	pipe(string(), regex(/^\d{1,6}$/)),
	"1",
);

export const SearchSchema = pipe(
	string(),
	minLength(1, "Search query is required"),
	maxLength(100, "Search query too long"),
);
