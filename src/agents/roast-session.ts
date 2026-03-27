import { Agent, callable } from "agents";
import { createWorkersAI } from "workers-ai-provider";
import { generateText } from "ai";
import { Buffer } from "node:buffer";
import { createClient, streamToDataUri } from "../lib/elevenlabs";
import { SFX_PROMPTS, type SfxKey } from "../lib/sfx";
import {
	ROAST_SYSTEM_PROMPTS,
	buildRoastPrompt,
	parseRoastScript,
	type RoastScript,
	type Lang,
} from "../lib/roast-engine";
import type { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

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

		const res = await fetch(url, {
			headers: { "User-Agent": "RoastRoulette/1.0" },
		});
		const html = await res.text();

		const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || url;
		const textContent = html
			.replace(/<script[\s\S]*?<\/script>/gi, "")
			.replace(/<style[\s\S]*?<\/style>/gi, "")
			.replace(/<[^>]+>/g, " ")
			.replace(/\s+/g, " ")
			.trim()
			.slice(0, 15000);

		this.setState({ ...this.state, pageContent: textContent });
		return { content: textContent, title };
	}

	@callable()
	async generateRoast(): Promise<RoastScript> {
		this.setState({ ...this.state, phase: "scripting" });
		this.broadcast(JSON.stringify({ type: "phase", phase: "scripting" }));

		const lang = this.state.lang;
		const workersai = createWorkersAI({ binding: this.env.AI });
		let text = "";
		try {
			const result = await generateText({
				model: workersai("@cf/moonshotai/kimi-k2.5"),
				system: ROAST_SYSTEM_PROMPTS[lang],
				prompt: buildRoastPrompt(this.state.url!, this.state.pageContent!, lang),
			});
			text = result.text;
		} catch (err) {
			console.error("Workers AI error:", err);
		}

		console.log("Raw LLM response:", text.slice(0, 500));
		const script = parseRoastScript(text, lang);
		this.setState({ ...this.state, script, phase: "delivering", currentSegment: 0 });
		this.broadcast(JSON.stringify({ type: "phase", phase: "delivering" }));
		this.broadcast(JSON.stringify({ type: "script", script }));

		return script;
	}

	@callable()
	async speakSegment(index: number): Promise<{ audio: string; sfxAudio?: string }> {
		const script = this.state.script;
		if (!script) throw new Error("No script generated");

		const segment = index === -1
			? { type: "burn" as const, text: script.intro }
			: script.segments[index];
		if (!segment) throw new Error("Invalid segment index");

		this.setState({ ...this.state, currentSegment: index });
		this.broadcast(JSON.stringify({ type: "segment", index, segment }));

		const client = createClient(this.env.ELEVENLABS_API_KEY);

		const ttsPromise = client.textToSpeech
			.convert(this.voiceId, {
				text: segment.text,
				modelId: this.ttsModel,
				outputFormat: "mp3_44100_128",
			})
			.then((stream) => streamToDataUri(stream));

		let sfxPromise: Promise<string | undefined> = Promise.resolve(undefined);
		if ("sfx" in segment && segment.sfx) {
			const sfxKey = segment.sfx as SfxKey;
			if (SFX_PROMPTS[sfxKey]) {
				sfxPromise = this.getCachedSfx(sfxKey, client);
			}
		}

		const [audio, sfxAudio] = await Promise.all([ttsPromise, sfxPromise]);
		return { audio, sfxAudio };
	}

	@callable()
	async speakScore(): Promise<{ audio: string; sfxAudio: string }> {
		const script = this.state.script;
		if (!script) throw new Error("No script");

		this.setState({ ...this.state, phase: "scoring" });
		this.broadcast(JSON.stringify({ type: "phase", phase: "scoring" }));

		const lang = this.state.lang;
		const scoreText = lang === "es"
			? `Puntaje final: ${script.finalScore} de 100. ${script.scoreComment}`
			: `Final score: ${script.finalScore} out of 100. ${script.scoreComment}`;

		const client = createClient(this.env.ELEVENLABS_API_KEY);

		const [audio, sfxAudio] = await Promise.all([
			client.textToSpeech
				.convert(this.voiceId, {
					text: scoreText,
					modelId: this.ttsModel,
					outputFormat: "mp3_44100_128",
				})
				.then((s) => streamToDataUri(s)),
			this.getCachedSfx("crowd_cheer", client),
		]);

		return { audio, sfxAudio: sfxAudio! };
	}

	@callable()
	async finishRoast() {
		this.setState({ ...this.state, phase: "done" });
		this.broadcast(JSON.stringify({ type: "phase", phase: "done" }));
	}

	private async getCachedSfx(
		key: SfxKey,
		client: ElevenLabsClient,
	): Promise<string | undefined> {
		const r2Key = `sfx/${key}.mp3`;

		try {
			const cached = await this.env.AUDIO_BUCKET?.get(r2Key);
			if (cached) {
				const buf = await cached.arrayBuffer();
				const base64 = Buffer.from(buf).toString("base64");
				return `data:audio/mpeg;base64,${base64}`;
			}
		} catch {}

		const prompt = SFX_PROMPTS[key];
		if (!prompt) return undefined;

		const audio = await client.textToSoundEffects.convert({
			text: prompt,
			durationSeconds: 5,
			promptInfluence: 0.5,
		});

		const dataUri = await streamToDataUri(audio);

		try {
			const base64Data = dataUri.split(",")[1];
			const binaryData = Buffer.from(base64Data, "base64");
			await this.env.AUDIO_BUCKET?.put(r2Key, binaryData, {
				httpMetadata: { contentType: "audio/mpeg" },
			});
		} catch {}

		return dataUri;
	}
}
