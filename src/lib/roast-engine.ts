import type { SfxKey } from "./sfx";

export type Lang = "en" | "es";

export interface RoastSegment {
	type: "burn" | "compliment";
	text: string;
	sfx?: SfxKey;
}

export interface RoastScript {
	intro: string;
	segments: RoastSegment[];
	finalScore: number;
	scoreComment: string;
}

export const ROAST_SYSTEM_PROMPTS: Record<Lang, string> = {
	en: `You write comedy roasts about websites. You are lighthearted and funny, like a comedy roast show. You reference specific details you find. Output ONLY a JSON object with this exact structure (no markdown, no extra text):
{"intro":"one-liner about who/what this is","segments":[{"type":"burn","text":"funny observation"},{"type":"burn","text":"another joke"},{"type":"compliment","text":"genuine nice thing"},{"type":"burn","text":"more humor"}],"finalScore":72,"scoreComment":"witty summary"}
Use 4-8 segments. Mix burns and compliments (3:1 ratio). Reference specific details from the content. Be funny not mean.`,

	es: `Escribes roasts de comedia sobre sitios web. Eres gracioso y ligero, como un show de comedia. Refieres detalles especificos. Responde SOLO con un objeto JSON con esta estructura exacta (sin markdown, sin texto extra):
{"intro":"una linea sobre quien/que es esto","segments":[{"type":"burn","text":"observacion graciosa"},{"type":"burn","text":"otro chiste"},{"type":"compliment","text":"algo genuinamente bueno"},{"type":"burn","text":"mas humor"}],"finalScore":72,"scoreComment":"resumen ingenioso"}
Usa 4-8 segmentos. Mezcla quemadas y cumplidos (3:1). Referencia detalles especificos del contenido. Se gracioso no cruel. Todo en espanol.`,
};

export function buildRoastPrompt(url: string, content: string, lang: Lang): string {
	const trimmed = content.slice(0, 6000);
	const instruction = lang === "es"
		? "Roastea este sitio web/perfil. Responde COMPLETAMENTE en espanol. Solo JSON, sin markdown."
		: "Roast this website/profile. Respond with ONLY the JSON object, no markdown fences, no explanation.";

	return `${instruction}

URL: ${url}

Scraped content:
${trimmed}`;
}

const FALLBACKS: Record<Lang, RoastScript> = {
	en: {
		intro: "Well, this is awkward...",
		segments: [
			{ type: "burn", text: "I tried to roast you but your site broke my brain.", sfx: "sad_trombone" },
			{ type: "compliment", text: "But hey, at least you have a website. That's more than most people.", sfx: "crowd_cheer" },
		],
		finalScore: 50,
		scoreComment: "Inconclusive. Try again.",
	},
	es: {
		intro: "Bueno, esto es incomodo...",
		segments: [
			{ type: "burn", text: "Intente roastearte pero tu sitio me frio el cerebro.", sfx: "sad_trombone" },
			{ type: "compliment", text: "Pero oye, al menos tienes un sitio web. Eso es mas que la mayoria.", sfx: "crowd_cheer" },
		],
		finalScore: 50,
		scoreComment: "Inconcluso. Intenta de nuevo.",
	},
};

export function parseRoastScript(text: string, lang: Lang = "en"): RoastScript {
	const fallback = FALLBACKS[lang];

	try {
		const cleaned = text
			.replace(/```json\s*/g, "")
			.replace(/```\s*/g, "")
			.trim();
		const jsonStr = cleaned.match(/\{[\s\S]*\}/)?.[0];
		if (!jsonStr) return fallback;

		const parsed = JSON.parse(jsonStr);
		if (!parsed.segments || !Array.isArray(parsed.segments)) return fallback;

		return {
			intro: parsed.intro || fallback.intro,
			segments: parsed.segments.map((s: Record<string, unknown>) => ({
				type: s.type === "compliment" ? "compliment" : "burn",
				text: String(s.text || ""),
				sfx: s.sfx ? String(s.sfx) : undefined,
			})),
			finalScore: typeof parsed.finalScore === "number" ? parsed.finalScore : 50,
			scoreComment: String(parsed.scoreComment || "No comment."),
		};
	} catch {
		return fallback;
	}
}
