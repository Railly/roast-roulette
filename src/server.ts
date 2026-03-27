import { routeAgentRequest } from "agents";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export { RoastSessionAgent } from "./agents/roast-session";
export { LeaderboardAgent } from "./agents/leaderboard";

export default {
	async fetch(request: Request, env: Env) {
		const url = new URL(request.url);

		if (url.pathname === "/api/generate-sfx" && request.method === "POST") {
			try {
				const { prompt, name, duration = 2 } = (await request.json()) as {
					prompt: string;
					name: string;
					duration?: number;
				};

				if (!prompt || !name) {
					return new Response("Missing prompt or name", { status: 400 });
				}

				const client = new ElevenLabsClient({ apiKey: env.ELEVENLABS_API_KEY });
				const audio = await client.textToSoundEffects.convert({
					text: prompt,
					durationSeconds: Math.min(10, Math.max(1, duration)),
					promptInfluence: 0.8,
				});

				const buffer = await new Response(audio).arrayBuffer();
				const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
				const dataUri = `data:audio/mpeg;base64,${base64}`;

				return Response.json({
					url: dataUri,
					size: buffer.byteLength,
					name,
				});
			} catch (err) {
				return new Response(String(err), { status: 500 });
			}
		}

		if (url.pathname === "/api/test-ai") {
			try {
				const response = await env.AI.run(
					"@cf/meta/llama-3.3-70b-instruct-fp8-fast",
					{
						messages: [
							{ role: "system", content: 'You write comedy. Output ONLY valid JSON: {"joke":"your joke here","score":85}' },
							{ role: "user", content: "Write a joke about websites that have no content." },
						],
						max_tokens: 200,
					} as AiTextGenerationInput,
				);
				return Response.json({ ok: true, response, type: typeof response });
			} catch (err) {
				return Response.json({ ok: false, error: String(err) }, { status: 500 });
			}
		}

		return (
			(await routeAgentRequest(request, env)) ||
			new Response("Not found", { status: 404 })
		);
	},
} satisfies ExportedHandler<Env>;
