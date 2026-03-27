import { useState, useCallback } from "react";
import { useAgent } from "agents/react";
import { UrlInput, type Lang } from "./url-input";
import { RoastStage } from "./roast-stage";
import { ElevenlabsLogo } from "./logos/elevenlabs";
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
		async (inputUrl: string, lang: Lang) => {
			setPhase("analyzing");
			setError("");
			setScript(null);

			try {
				await agent.call("analyzeUrl", [inputUrl, lang]);
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
						className="mt-10 space-y-3"
						style={{ animation: "fade-in 0.5s ease-out 0.2s both" }}
					>
						<div className="flex items-center justify-center gap-3">
							<span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
								Powered by
							</span>
							<div className="flex items-center gap-3">
								<div className="flex items-center gap-1.5 opacity-40">
									<svg viewBox="0 0 24 24" className="h-3.5 w-auto" xmlns="http://www.w3.org/2000/svg">
										<path fill="#F38020" d="M16.5088 16.8447c.1475-.5068.0908-.9707-.1553-1.3154-.2246-.3164-.6045-.499-1.0615-.5205l-8.6592-.1123a.1559.1559 0 0 1-.1333-.0713c-.0283-.042-.0351-.0986-.021-.1553.0278-.084.1123-.1484.2036-.1562l8.7359-.1123c1.0351-.0489 2.1601-.8868 2.5537-1.9136l.499-1.3013c.0215-.0561.0293-.1128.0147-.168-.5625-2.5463-2.835-4.4453-5.5499-4.4453-2.5039 0-4.6284 1.6177-5.3876 3.8614-.4927-.3658-1.1187-.5625-1.794-.499-1.2026.119-2.1665 1.083-2.2861 2.2856-.0283.31-.0069.6128.0635.894C1.5683 13.171 0 14.7754 0 16.752c0 .1748.0142.3515.0352.5273.0141.083.0844.1475.1689.1475h15.9814c.0909 0 .1758-.0645.2032-.1553l.12-.4268zm2.7568-5.5634c-.0771 0-.1611 0-.2383.0112-.0566 0-.1054.0415-.127.0976l-.3378 1.1744c-.1475.5068-.0918.9707.1543 1.3164.2256.3164.6055.498 1.0625.5195l1.8437.1133c.0557 0 .1055.0263.1329.0703.0283.043.0351.1074.0214.1562-.0283.084-.1132.1485-.204.1553l-1.921.1123c-1.041.0488-2.1582.8867-2.5527 1.914l-.1406.3585c-.0283.0713.0215.1416.0986.1416h6.5977c.0771 0 .1474-.0489.169-.126.1122-.4082.1757-.837.1757-1.2803 0-2.6025-2.125-4.727-4.7344-4.727" />
									</svg>
									<span className="text-[11px] text-muted-foreground font-medium">Cloudflare</span>
								</div>
								<span className="text-muted/50 text-xs">+</span>
								<ElevenlabsLogo variant="wordmark" mode="dark" className="h-[12px] w-auto opacity-40" />
							</div>
						</div>
						<p className="text-[10px] text-muted/50 text-center">
							<span className="text-muted-foreground/60">#ElevenHacks</span>
						</p>
					</div>
				)}
			</div>
		</main>
	);
}
