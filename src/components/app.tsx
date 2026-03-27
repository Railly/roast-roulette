import { useState, useCallback } from "react";
import { useAgent } from "agents/react";
import { UrlInput } from "./url-input";
import { RoastStage } from "./roast-stage";
import type { RoastScript } from "../lib/roast-engine";

type Phase = "idle" | "analyzing" | "scripting" | "delivering" | "scoring" | "done";

export function App() {
	const [phase, setPhase] = useState<Phase>("idle");
	const [script, setScript] = useState<RoastScript | null>(null);
	const [error, setError] = useState("");

	const agent = useAgent({
		agent: "RoastSessionAgent",
		onMessage: (evt) => {
			try {
				const raw = typeof evt === "object" && "data" in evt ? (evt as MessageEvent).data : evt;
				const data = JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw as ArrayBuffer));
				if (data.type === "phase") setPhase(data.phase);
				if (data.type === "script") setScript(data.script);
			} catch {}
		},
	});

	const handleSubmit = useCallback(
		async (inputUrl: string) => {
			setPhase("analyzing");
			setError("");
			setScript(null);

			try {
				await agent.call("analyzeUrl", [inputUrl]);
				const roastScript = (await agent.call("generateRoast")) as RoastScript;
				setScript(roastScript);
				setPhase("delivering");
			} catch (err) {
				setError(err instanceof Error ? err.message : "Something went wrong");
				setPhase("idle");
			}
		},
		[agent],
	);

	const handleReset = useCallback(() => {
		setPhase("idle");
		setScript(null);
		setError("");
	}, []);

	const isIdle = phase === "idle";

	return (
		<main
			className={`min-h-screen flex flex-col items-center p-6 sm:p-8 transition-all duration-700 ${
				isIdle ? "justify-center" : "justify-start pt-12"
			}`}
		>
			<div className="max-w-xl w-full">
				<div
					className={`text-center transition-all duration-500 ${isIdle ? "mb-8 space-y-3" : "mb-6 space-y-1"}`}
					style={{
						transform: isIdle ? "none" : "scale(0.85)",
						transformOrigin: "center top",
					}}
				>
					<h1
						className={`font-bold tracking-tight transition-all duration-500 ${
							isIdle ? "text-5xl sm:text-6xl" : "text-2xl"
						}`}
					>
						<span className="text-red-500">Roast</span> Roulette
					</h1>
					<p
						className={`text-[var(--muted-foreground)] transition-all duration-500 ${
							isIdle ? "text-base opacity-100" : "text-xs opacity-0 max-h-0 overflow-hidden"
						}`}
					>
						Paste any URL. Get roasted by AI. Live.
					</p>
				</div>

				{(isIdle || phase === "analyzing" || phase === "scripting") && (
					<UrlInput
						onSubmit={handleSubmit}
						isLoading={phase === "analyzing" || phase === "scripting"}
						phase={phase}
					/>
				)}

				{error && (
					<p
						className="text-red-500 text-center text-sm mt-6"
						style={{ animation: "fade-up 0.3s ease-out both" }}
					>
						{error}
					</p>
				)}

				{script && (phase === "delivering" || phase === "scoring" || phase === "done") && (
					<RoastStage script={script} agent={agent} onReset={handleReset} />
				)}

				{isIdle && (
					<div
						className="mt-10 text-center"
						style={{ animation: "fade-in 0.5s ease-out 0.2s both" }}
					>
						<p className="text-xs text-[var(--muted)]">
							Built with Cloudflare Workers + ElevenLabs for{" "}
							<span className="text-[var(--muted-foreground)]">#ElevenHacks</span>
						</p>
					</div>
				)}
			</div>
		</main>
	);
}
