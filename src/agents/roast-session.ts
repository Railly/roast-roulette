import { Agent, callable } from "agents";
import { Buffer } from "node:buffer";
import { createClient, streamToDataUri } from "../lib/elevenlabs";
import {
	ROAST_SYSTEM_PROMPTS,
	buildRoastPrompt,
	parseRoastScript,
	type RoastScript,
	type Lang,
} from "../lib/roast-engine";


export interface RoastState {
	phase: "idle" | "analyzing" | "scripting" | "delivering" | "scoring" | "defense" | "done";
	url: string | null;
	script: RoastScript | null;
	currentSegment: number;
	pageContent: string | null;
	lang: Lang;
}

const VOICE_IDS: Record<Lang, string> = {
	en: "JBFqnCBsd6RMkjVDRZzb",
	es: "pFZP5JQG7iQjIQuC4Bku",
};

const TTS_MODELS: Record<Lang, string> = {
	en: "eleven_flash_v2_5",
	es: "eleven_multilingual_v2",
};

export class RoastSessionAgent extends Agent<Env, RoastState> {
	initialState: RoastState = {
		phase: "idle",
		url: null,
		script: null,
		currentSegment: 0,
		pageContent: null,
		lang: "en",
	};

	private get voiceId() {
		return VOICE_IDS[this.state.lang] || VOICE_IDS.en;
	}

	private get ttsModel() {
		return TTS_MODELS[this.state.lang] || TTS_MODELS.en;
	}

	@callable()
	async analyzeUrl(url: string, lang: Lang = "en"): Promise<{ content: string; title: string }> {
		this.setState({ ...this.state, phase: "analyzing", url, lang });
		this.broadcast(JSON.stringify({ type: "phase", phase: "analyzing" }));

		let html = "";
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 10000);
			const res = await fetch(url, {
				headers: { "User-Agent": "RoastRoulette/1.0" },
				signal: controller.signal,
				redirect: "follow",
			});
			html = await res.text();
			clearTimeout(timeout);
		} catch (err) {
			console.error("Fetch error:", err);
			html = `<title>${url}</title><body>Could not fetch page content for ${url}</body>`;
		}

		const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || url;
		const textContent = html
			.replace(/<script[\s\S]*?<\/script>/gi, "")
			.replace(/<style[\s\S]*?<\/style>/gi, "")
			.replace(/<[^>]+>/g, " ")
			.replace(/\s+/g, " ")
			.trim()
			.slice(0, 8000);

		this.setState({ ...this.state, pageContent: textContent });
		console.log(`Analyzed ${url}: ${textContent.length} chars, title: ${title}`);
		return { content: textContent, title };
	}

	@callable()
	async generateRoast(): Promise<RoastScript> {
		this.setState({ ...this.state, phase: "scripting" });
		this.broadcast(JSON.stringify({ type: "phase", phase: "scripting" }));

		const lang = this.state.lang;
		let text = "";
		try {
			const result = await this.env.AI.run(
				"@cf/meta/llama-3.3-70b-instruct-fp8-fast",
				{
					messages: [
						{ role: "system", content: ROAST_SYSTEM_PROMPTS[lang] },
						{ role: "user", content: buildRoastPrompt(this.state.url!, this.state.pageContent!, lang) },
					],
					max_tokens: 1500,
				} as AiTextGenerationInput,
			);
			const inner = (result as { response: unknown }).response;
			if (typeof inner === "string") {
				text = inner;
			} else if (typeof inner === "object" && inner !== null) {
				text = JSON.stringify(inner);
			}
		} catch (err) {
			this.broadcast(JSON.stringify({ type: "debug", error: String(err) }));
		}

		console.log("Raw LLM response:", text.slice(0, 500));
		const script = parseRoastScript(text, lang);
		this.setState({ ...this.state, script, phase: "delivering", currentSegment: 0 });
		this.broadcast(JSON.stringify({ type: "phase", phase: "delivering" }));
		this.broadcast(JSON.stringify({ type: "script", script }));

		return script;
	}

	@callable()
	async speakSegment(index: number): Promise<{ audio: string }> {
		const script = this.state.script;
		if (!script) throw new Error("No script generated");

		const segment = index === -1
			? { type: "burn" as const, text: script.intro }
			: script.segments[index];
		if (!segment) throw new Error("Invalid segment index");

		this.setState({ ...this.state, currentSegment: index });
		this.broadcast(JSON.stringify({ type: "segment", index, segment }));

		const client = createClient(this.env.ELEVENLABS_API_KEY);
		const stream = await client.textToSpeech.convert(this.voiceId, {
			text: segment.text,
			modelId: this.ttsModel,
			outputFormat: "mp3_44100_128",
		});
		const audio = await streamToDataUri(stream);

		return { audio };
	}

	@callable()
	async speakScore(): Promise<{ audio: string }> {
		const script = this.state.script;
		if (!script) throw new Error("No script");

		this.setState({ ...this.state, phase: "scoring" });
		this.broadcast(JSON.stringify({ type: "phase", phase: "scoring" }));

		const lang = this.state.lang;
		const scoreText = lang === "es"
			? `Puntaje final: ${script.finalScore} de 100. ${script.scoreComment}`
			: `Final score: ${script.finalScore} out of 100. ${script.scoreComment}`;

		const client = createClient(this.env.ELEVENLABS_API_KEY);
		const stream = await client.textToSpeech.convert(this.voiceId, {
			text: scoreText,
			modelId: this.ttsModel,
			outputFormat: "mp3_44100_128",
		});
		const audio = await streamToDataUri(stream);

		return { audio };
	}

	@callable()
	async finishRoast() {
		this.setState({ ...this.state, phase: "done" });
		this.broadcast(JSON.stringify({ type: "phase", phase: "done" }));
	}

}
