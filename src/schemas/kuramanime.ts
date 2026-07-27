import {
	pipe,
	string,
	optional,
	union,
	regex,
	minLength,
	maxLength,
	picklist,
} from "valibot";

/** Validasi page */
export const PageSchema = optional(
	pipe(string(), regex(/^\d{1,6}$/)),
	"1",
);

/** Validasi search query */
export const SearchSchema = optional(
	pipe(string(), minLength(1), maxLength(100)),
);

/** Status filter */
export const StatusSchema = optional(
	picklist(["ongoing", "completed", "upcoming", "movie"] as const),
);

/** Sort filter */
export const SortSchema = optional(
	picklist([
		"a-z",
		"z-a",
		"oldest",
		"latest",
		"popular",
		"most_viewed",
		"updated",
	] as const),
);

/** Day untuk schedule */
export const DaySchema = optional(
	picklist([
		"all",
		"random",
		"monday",
		"tuesday",
		"wednesday",
		"thursday",
		"friday",
		"saturday",
		"sunday",
	] as const),
	"all",
);

/** Property type */
export const PropertyTypeSchema = picklist([
	"genre",
	"season",
	"studio",
	"type",
	"quality",
	"source",
	"country",
] as const);
