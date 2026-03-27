import { Agent, callable } from "agents";

export interface LeaderboardEntry {
	url: string;
	score: number;
	intro: string;
	bestBurn: string;
	timestamp: number;
}

export interface LeaderboardState {
	entries: LeaderboardEntry[];
}

export class LeaderboardAgent extends Agent<Env, LeaderboardState> {
	initialState: LeaderboardState = { entries: [] };

	@callable()
	async addEntry(entry: Omit<LeaderboardEntry, "timestamp">) {
		const newEntry = { ...entry, timestamp: Date.now() };
		const entries = [...this.state.entries, newEntry]
			.sort((a, b) => b.score - a.score)
			.slice(0, 50);
		this.setState({ entries });
		this.broadcast(JSON.stringify({ type: "leaderboard-update", entries }));
	}

	@callable()
	async getEntries(): Promise<LeaderboardEntry[]> {
		return this.state.entries;
	}
}
