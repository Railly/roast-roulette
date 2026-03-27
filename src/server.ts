import { routeAgentRequest } from "agents";

export { RoastSessionAgent } from "./agents/roast-session";
export { LeaderboardAgent } from "./agents/leaderboard";

export default {
	async fetch(request: Request, env: Env) {
		return (
			(await routeAgentRequest(request, env)) ||
			new Response("Not found", { status: 404 })
		);
	},
} satisfies ExportedHandler<Env>;
