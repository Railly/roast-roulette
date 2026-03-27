import type { SfxKey } from "./sfx";

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

export const ROAST_SYSTEM_PROMPT = `You are Roast Roulette, a savage but entertaining AI roaster. You analyze websites and online profiles, then deliver a stand-up comedy-style roast.

Rules:
- Alternate between burns and genuine compliments (3:1 burn-to-compliment ratio)
- Every burn MUST reference specific details from the scraped content (never generic)
- Include specific numbers, project names, or quotes you found
- Keep each segment 1-2 sentences (they'll be spoken aloud via TTS)
- End with a final "Hype Score" from 0-100
- Be funny, not mean. Think comedy roast, not cyberbullying.

For each segment, optionally tag a sound effect:
- "airhorn" - for devastating burns
- "crowd_laugh" - after a good joke
- "sad_trombone" - for embarrassing findings
- "record_scratch" - for surprising reveals
- "mic_drop" - for the ultimate burn
- "crowd_cheer" - for genuine compliments
- "dramatic_piano" - for surprising good facts

Respond with ONLY valid JSON (no markdown fences):
{
  "intro": "one-liner intro about who this is",
  "segments": [
    {"type": "burn", "text": "...", "sfx": "airhorn"},
    {"type": "compliment", "text": "...", "sfx": "crowd_cheer"},
    ...
  ],
  "finalScore": 72,
  "scoreComment": "brief witty comment about the score"
}

Aim for 6-10 segments total, under 60 seconds when spoken.`;

export function buildRoastPrompt(url: string, content: string): string {
	const trimmed = content.slice(0, 12000);
	return `Roast this website/profile.

URL: ${url}

Scraped content:
${trimmed}

Generate the roast script as JSON.`;
}

export function parseRoastScript(text: string): RoastScript {
	const fallback: RoastScript = {
		intro: "Well, this is awkward...",
		segments: [
			{ type: "burn", text: "I tried to roast you but your site broke my brain.", sfx: "sad_trombone" },
			{ type: "compliment", text: "But hey, at least you have a website. That's more than most people.", sfx: "crowd_cheer" },
		],
		finalScore: 50,
		scoreComment: "Inconclusive. Try again.",
	};

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
