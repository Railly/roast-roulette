import { routeAgentRequest } from "agents";

export { RoastSessionAgent } from "./agents/roast-session";
export { LeaderboardAgent } from "./agents/leaderboard";

export default {
	async fetch(request: Request, env: Env) {
		const url = new URL(request.url);

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
				return new Response(JSON.stringify({ ok: true, response, type: typeof response }), {
					headers: { "Content-Type": "application/json" },
				});
			} catch (err) {
				return new Response(JSON.stringify({ ok: false, error: String(err) }), {
					status: 500,
					headers: { "Content-Type": "application/json" },
				});
			}
		}

		return (
			(await routeAgentRequest(request, env)) ||
			new Response("Not found", { status: 404 })
		);
	},
} satisfies ExportedHandler<Env>;
