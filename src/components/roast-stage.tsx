import { useState, useCallback, useEffect, useRef } from "react";
import type { RoastScript, RoastSegment } from "../lib/roast-engine";
import { HypeScore } from "./hype-score";
import { Orb, type AgentState } from "./ui/orb";
import { ShimmeringText } from "./ui/shimmering-text";
import { EmojiBurst } from "./emoji-burst";
import { playBurnSfx, playComplimentSfx, playScoreSfx, preloadAll } from "../lib/client-sfx";

interface RoastStageProps {
	script: RoastScript;
	agent: { call: (method: string, args?: unknown[]) => Promise<unknown> };
	onReset: () => void;
}

type StagePhase = "intro" | "segments" | "score" | "done";

const PHASE_COLORS: Record<string, [string, string]> = {
	intro: ["#8b5cf6", "#ec4899"],
	burn: ["#ef4444", "#f97316"],
	compliment: ["#3b82f6", "#06b6d4"],
	score: ["#fbbf24", "#f97316"],
	done: ["#525252", "#737373"],
};

export function RoastStage({ script, agent, onReset }: RoastStageProps) {
	const [stagePhase, setStagePhase] = useState<StagePhase>("intro");
	const [currentIndex, setCurrentIndex] = useState(-1);
	const [playedSegments, setPlayedSegments] = useState<RoastSegment[]>([]);
	const [showScore, setShowScore] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [orbColors, setOrbColors] = useState<[string, string]>(PHASE_COLORS.intro);
	const [orbState, setOrbState] = useState<AgentState>("thinking");
	const [emojiBurst, setEmojiBurst] = useState<{ type: "burn" | "compliment" | "score"; key: number } | null>(null);
	const [glowType, setGlowType] = useState<"burn" | "compliment" | "score" | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const autoPlayStarted = useRef(false);
	const sfxReady = useRef(false);

	useEffect(() => {
		preloadAll();
		setTimeout(() => { sfxReady.current = true; }, 500);
	}, []);

	const playAudio = useCallback((dataUri: string): Promise<void> => {
		return new Promise((resolve) => {
			const audio = new Audio(dataUri);
			audioRef.current = audio;
			audio.onended = () => resolve();
			audio.onerror = () => resolve();
			audio.play().catch(() => resolve());
		});
	}, []);

	const triggerBurst = useCallback((type: "burn" | "compliment" | "score") => {
		setEmojiBurst({ type, key: Date.now() });
		setGlowType(type);
		setTimeout(() => setGlowType(null), 2000);
	}, []);

	const playSegment = useCallback(
		async (index: number) => {
			setIsPlaying(true);
			setCurrentIndex(index);

			const segment =
				index === -1 ? { type: "burn" as const, text: script.intro } : script.segments[index];

			if (segment) {
				const colorKey = index === -1 ? "intro" : segment.type;
				setOrbColors(PHASE_COLORS[colorKey] || PHASE_COLORS.burn);
				setOrbState("talking");
			}

			const result = (await agent.call("speakSegment", [index])) as { audio: string };

			if (segment) {
				setPlayedSegments((prev) => [...prev, segment]);
			}

			await playAudio(result.audio);

			if (segment && sfxReady.current) {
				const isBurn = segment.type === "burn";
				if (isBurn) {
					playBurnSfx();
				} else {
					playComplimentSfx();
				}
				triggerBurst(isBurn ? "burn" : "compliment");
				await new Promise((r) => setTimeout(r, 1200));
			}

			setOrbState("thinking");
			setIsPlaying(false);
		},
		[agent, script, playAudio, triggerBurst],
	);

	const playAll = useCallback(async () => {
		setStagePhase("intro");
		await playSegment(-1);

		setStagePhase("segments");
		for (let i = 0; i < script.segments.length; i++) {
			await playSegment(i);
		}

		setStagePhase("score");
		setOrbColors(PHASE_COLORS.score);
		setOrbState("talking");

		const scoreResult = (await agent.call("speakScore")) as { audio: string };

		setShowScore(true);
		playScoreSfx();
		triggerBurst("score");
		await playAudio(scoreResult.audio);

		await agent.call("finishRoast");
		setOrbColors(PHASE_COLORS.done);
		setOrbState(null);
		setStagePhase("done");
	}, [script, agent, playSegment, playAudio, triggerBurst]);

	useEffect(() => {
		if (!autoPlayStarted.current) {
			autoPlayStarted.current = true;
			playAll();
		}
	}, [playAll]);

	const scrollRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [playedSegments]);

	const currentSegment = currentIndex >= 0 ? script.segments[currentIndex] : null;
	const activeType = currentSegment?.type || (stagePhase === "intro" ? "burn" : null);

	const glowClass =
		glowType === "burn"
			? "animate-[glow-pulse-red_1s_ease-in-out]"
			: glowType === "compliment"
				? "animate-[glow-pulse-blue_1s_ease-in-out]"
				: glowType === "score"
					? "animate-[glow-pulse-gold_1.5s_ease-in-out]"
					: "";

	return (
		<div className="space-y-6" style={{ animation: "scale-in 0.4s ease-out both" }}>
			{emojiBurst && (
				<EmojiBurst
					key={emojiBurst.key}
					type={emojiBurst.type}
					count={emojiBurst.type === "score" ? 16 : 8}
				/>
			)}

			<div className="flex flex-col items-center gap-4">
				<div className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full transition-shadow duration-500 ${glowClass}`}>
					<Orb colors={orbColors} agentState={orbState} />
				</div>

				<div className="h-6 flex items-center">
					{isPlaying ? (
						<ShimmeringText
							text={
								stagePhase === "intro"
									? "Warming up..."
									: activeType === "burn"
										? "Roasting... 🔥"
										: "Props... 💙"
							}
							className="text-sm font-medium"
							shimmerColor={orbColors[0]}
							color="#737373"
							duration={1.5}
							spread={2}
						/>
					) : stagePhase === "done" ? (
						<p className="text-sm text-muted-foreground">Show's over.</p>
					) : null}
				</div>
			</div>

			<div className={`border rounded-xl overflow-hidden transition-colors duration-500 ${
				glowType === "burn" ? "border-red-500/30" :
				glowType === "compliment" ? "border-blue-500/30" :
				"border-border"
			}`}>
				<div className="px-4 py-3 border-b border-border flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div
							className={`w-2 h-2 rounded-full transition-colors ${
								isPlaying
									? activeType === "burn"
										? "bg-red-500 animate-pulse"
										: "bg-blue-500 animate-pulse"
									: "bg-muted"
							}`}
						/>
						<span className="text-xs text-muted-foreground font-mono">
							{stagePhase === "intro" && "Starting roast..."}
							{stagePhase === "segments" &&
								`Segment ${Math.max(0, currentIndex) + 1}/${script.segments.length}`}
							{stagePhase === "score" && "Final score..."}
							{stagePhase === "done" && "Roast complete"}
						</span>
					</div>
					{currentSegment && (
						<span className="text-sm">{currentSegment.type === "burn" ? "🔥" : "💙"}</span>
					)}
				</div>

				<div ref={scrollRef} className="p-5 space-y-3 max-h-64 overflow-y-auto">
					{playedSegments.map((seg, i) => (
						<div
							key={`seg-${i}`}
							className={`text-sm leading-relaxed transition-all ${
								seg.type === "burn" ? "text-red-400" : "text-blue-400"
							}`}
							style={{ animation: "fade-up 0.3s ease-out both" }}
						>
							<span className="mr-2 text-xs">
								{seg.type === "burn" ? "🔥" : "💙"}
							</span>
							{seg.text}
						</div>
					))}

					{isPlaying && (
						<div className="flex items-center gap-1.5 py-1">
							{[0, 1, 2].map((i) => (
								<div
									key={`dot-${i}`}
									className="w-1.5 h-1.5 bg-muted rounded-full animate-pulse"
									style={{ animationDelay: `${i * 150}ms` }}
								/>
							))}
						</div>
					)}
				</div>
			</div>

			{showScore && <HypeScore score={script.finalScore} comment={script.scoreComment} />}

			{stagePhase === "done" && (
				<div
					className="flex gap-3 justify-center"
					style={{ animation: "fade-up 0.3s ease-out 0.2s both" }}
				>
					<button
						type="button"
						onClick={onReset}
						className="px-5 py-2.5 bg-accent border border-border text-sm text-muted-foreground rounded-lg hover:text-foreground hover:border-ring transition-all"
					>
						Roast another
					</button>
					<button
						type="button"
						onClick={() => {
							const text = `I just got roasted by AI and scored ${script.finalScore}/100 💀\n\nTry it: ${window.location.origin}\n\n#ElevenHacks @CloudflareDev @elevenlabsio`;
							window.open(
								`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
								"_blank",
							);
						}}
						className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-500 transition-all"
					>
						Share on X
					</button>
				</div>
			)}
		</div>
	);
}
