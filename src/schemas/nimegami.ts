import { pipe, string, optional, regex, minLength, maxLength } from "valibot";

export const PageSchema = optional(
	pipe(string(), regex(/^\d{1,6}$/)),
	"1",
);

export const SearchSchema = pipe(
	string(),
	minLength(1),
	maxLength(100),
);
