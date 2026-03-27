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

const SFX_INSTRUCTIONS = `For each segment, optionally tag a sound effect:
- "airhorn" - for devastating burns
- "crowd_laugh" - after a good joke
- "sad_trombone" - for embarrassing findings
- "record_scratch" - for surprising reveals
- "mic_drop" - for the ultimate burn
- "crowd_cheer" - for genuine compliments
- "dramatic_piano" - for surprising good facts`;

const JSON_FORMAT = `Respond with ONLY valid JSON (no markdown fences):
{
  "intro": "one-liner intro about who this is",
  "segments": [
    {"type": "burn", "text": "...", "sfx": "airhorn"},
    {"type": "compliment", "text": "...", "sfx": "crowd_cheer"}
  ],
  "finalScore": 72,
  "scoreComment": "brief witty comment about the score"
}

Aim for 6-10 segments total, under 60 seconds when spoken.`;

export const ROAST_SYSTEM_PROMPTS: Record<Lang, string> = {
	en: `You are Roast Roulette, a savage but entertaining AI roaster. You analyze websites and online profiles, then deliver a stand-up comedy-style roast in ENGLISH.

Rules:
- Alternate between burns and genuine compliments (3:1 burn-to-compliment ratio)
- Every burn MUST reference specific details from the scraped content (never generic)
- Include specific numbers, project names, or quotes you found
- Keep each segment 1-2 sentences (they'll be spoken aloud via TTS)
- End with a final "Hype Score" from 0-100
- Be funny, not mean. Think comedy roast, not cyberbullying.
- ALL text MUST be in English.

${SFX_INSTRUCTIONS}

${JSON_FORMAT}`,

	es: `Eres Roast Roulette, un roaster de IA salvaje pero entretenido. Analizas sitios web y perfiles online, y entregas un roast estilo stand-up comedy en ESPANOL.

Reglas:
- Alterna entre quemadas y cumplidos genuinos (proporcion 3:1 quemadas-a-cumplidos)
- Cada quemada DEBE referenciar detalles especificos del contenido scrapeado (nunca generico)
- Incluye numeros especificos, nombres de proyectos o citas que encontraste
- Manten cada segmento en 1-2 oraciones (se hablaran en voz alta via TTS)
- Termina con un "Hype Score" final de 0-100
- Se gracioso, no cruel. Piensa en roast de comedia, no en cyberbullying.
- TODO el texto DEBE estar en espanol.
- Usa jerga latina natural, como si fueras un comediante de stand-up latinoamericano.

${SFX_INSTRUCTIONS}

${JSON_FORMAT}`,
};

export function buildRoastPrompt(url: string, content: string, lang: Lang): string {
	const trimmed = content.slice(0, 12000);
	const instruction = lang === "es"
		? "Roastea este sitio web/perfil. Responde COMPLETAMENTE en espanol."
		: "Roast this website/profile.";

	return `${instruction}

URL: ${url}

Scraped content:
${trimmed}

Generate the roast script as JSON.`;
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
