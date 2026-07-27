export const appConfig = {
	port: parseInt(process.env.PORT || "3001", 10),
	sourceUrl: true,
	nodeEnv: process.env.NODE_ENV || "development",
} as const;

export const sources = {
	otakudesu: {
		baseUrl: "https://otakudesu.blog",
		name: "Otakudesu",
		enabled: true,
		cacheTtl: 10,
	},
	kuramanime: {
		baseUrl: "https://v19.kuramanime.ing",
		name: "Kuramanime",
		enabled: true,
		cacheTtl: 10,
	},
	oploverz: {
		baseUrl: "https://oploverz.am",
		name: "Oploverz",
		enabled: true,
		cacheTtl: 10,
	},
	nimegami: {
		baseUrl: "https://nimegami.id",
		name: "Nimegami",
		enabled: true,
		cacheTtl: 10,
	},
	samehadaku: {
		baseUrl: "https://v2.samehadaku.how",
		name: "Samehadaku",
		enabled: false, // Cloudflare block
		cacheTtl: 10,
	},
} as const;

export type SourceKey = keyof typeof sources;
