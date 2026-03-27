import { useState, useCallback, useEffect, useRef } from "react";
import type { RoastScript, RoastSegment } from "../lib/roast-engine";
import { HypeScore } from "./hype-score";

interface RoastStageProps {
	script: RoastScript;
	agent: { call: (method: string, ...args: unknown[]) => Promise<unknown> };
	onReset: () => void;
}

type StagePhase = "intro" | "segments" | "score" | "done";

export function RoastStage({ script, agent, onReset }: RoastStageProps) {
	const [stagePhase, setStagePhase] = useState<StagePhase>("intro");
	const [currentIndex, setCurrentIndex] = useState(-1);
	const [playedSegments, setPlayedSegments] = useState<RoastSegment[]>([]);
	const [showScore, setShowScore] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const sfxRef = useRef<HTMLAudioElement | null>(null);
	const autoPlayStarted = useRef(false);

	const playAudio = useCallback((dataUri: string): Promise<void> => {
		return new Promise((resolve) => {
			const audio = new Audio(dataUri);
			audioRef.current = audio;
			audio.onended = () => resolve();
			audio.onerror = () => resolve();
			audio.play().catch(() => resolve());
		});
	}, []);

	const playSfx = useCallback((dataUri: string) => {
		const audio = new Audio(dataUri);
		sfxRef.current = audio;
		audio.volume = 0.4;
		audio.play().catch(() => {});
	}, []);

	const playSegment = useCallback(
		async (index: number) => {
			setIsPlaying(true);
			setCurrentIndex(index);

			const result = (await agent.call("speakSegment", index)) as {
				audio: string;
				sfxAudio?: string;
			};

			const segment = index === -1
				? { type: "burn" as const, text: script.intro }
				: script.segments[index];

			if (segment) {
				setPlayedSegments((prev) => [...prev, segment]);
			}

			if (result.sfxAudio) {
				setTimeout(() => playSfx(result.sfxAudio!), 200);
			}

			await playAudio(result.audio);
			setIsPlaying(false);
		},
		[agent, script, playAudio, playSfx],
	);

	const playAll = useCallback(async () => {
		await playSegment(-1);

		for (let i = 0; i < script.segments.length; i++) {
			await playSegment(i);
		}

		setStagePhase("score");
		const scoreResult = (await agent.call("speakScore")) as {
			audio: string;
			sfxAudio: string;
		};

		setShowScore(true);
		playSfx(scoreResult.sfxAudio);
		await playAudio(scoreResult.audio);

		await agent.call("finishRoast");
		setStagePhase("done");
	}, [script, agent, playSegment, playAudio, playSfx]);

	useEffect(() => {
		if (!autoPlayStarted.current) {
			autoPlayStarted.current = true;
			playAll();
		}
	}, [playAll]);

	return (
		<div className="space-y-6" style={{ animation: "scale-in 0.4s ease-out both" }}>
			<div className="border border-[#262626] rounded-xl overflow-hidden">
				<div className="px-4 py-3 border-b border-[#262626] flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div
							className={`w-2 h-2 rounded-full ${
								isPlaying ? "bg-red-500 animate-pulse" : "bg-[#525252]"
							}`}
						/>
						<span className="text-xs text-[#a3a3a3] font-mono">
							{stagePhase === "intro" && "Starting roast..."}
							{stagePhase === "segments" && `Segment ${currentIndex + 1}/${script.segments.length}`}
							{stagePhase === "score" && "Final score..."}
							{stagePhase === "done" && "Roast complete"}
						</span>
					</div>
					{stagePhase === "segments" && (
						<span className="text-[10px] text-[#525252] font-mono">
							{script.segments[currentIndex]?.type === "burn" ? "🔥" : "💙"}
						</span>
					)}
				</div>

				<div className="p-5 space-y-3 max-h-80 overflow-y-auto">
					{playedSegments.map((seg, i) => (
						<div
							key={`seg-${i}`}
							className={`text-sm leading-relaxed ${
								seg.type === "burn" ? "text-red-400" : "text-blue-400"
							}`}
							style={{ animation: "fade-up 0.3s ease-out both" }}
						>
							<span className="mr-2 text-xs opacity-50">
								{seg.type === "burn" ? "🔥" : "💙"}
							</span>
							{seg.text}
						</div>
					))}

					{isPlaying && (
						<div className="flex items-center gap-2 text-[#525252]">
							<div className="flex gap-0.5">
								{[0, 1, 2].map((i) => (
									<div
										key={`dot-${i}`}
										className="w-1.5 h-1.5 bg-current rounded-full animate-pulse"
										style={{ animationDelay: `${i * 150}ms` }}
									/>
								))}
							</div>
						</div>
					)}
				</div>
			</div>

			{showScore && (
				<HypeScore score={script.finalScore} comment={script.scoreComment} />
			)}

			{stagePhase === "done" && (
				<div
					className="flex gap-3 justify-center"
					style={{ animation: "fade-up 0.3s ease-out 0.2s both" }}
				>
					<button
						type="button"
						onClick={onReset}
						className="px-5 py-2.5 bg-[#171717] border border-[#262626] text-sm text-[#a3a3a3] rounded-lg hover:text-white hover:border-[#525252] transition-all"
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
