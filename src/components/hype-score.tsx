import { useEffect, useState } from "react";

interface HypeScoreProps {
	score: number;
	comment: string;
}

export function HypeScore({ score, comment }: HypeScoreProps) {
	const [displayScore, setDisplayScore] = useState(0);
	const [showComment, setShowComment] = useState(false);

	useEffect(() => {
		let frame = 0;
		const totalFrames = 60;
		const interval = setInterval(() => {
			frame++;
			const progress = frame / totalFrames;
			const eased = 1 - (1 - progress) ** 3;
			setDisplayScore(Math.round(eased * score));
			if (frame >= totalFrames) {
				clearInterval(interval);
				setDisplayScore(score);
				setTimeout(() => setShowComment(true), 300);
			}
		}, 30);
		return () => clearInterval(interval);
	}, [score]);

	const color =
		score >= 80 ? "#fbbf24" : score >= 60 ? "#3b82f6" : score >= 40 ? "#a3a3a3" : "#ef4444";

	return (
		<div
			className="border border-[#262626] rounded-xl p-8 text-center"
			style={{ animation: "scale-in 0.5s ease-out both" }}
		>
			<p className="text-xs text-[#525252] uppercase tracking-widest mb-3 font-mono">
				Hype Score
			</p>
			<div
				className="text-7xl sm:text-8xl font-black tabular-nums"
				style={{
					color,
					animation: "score-count 0.6s ease-out both",
					textShadow: `0 0 40px ${color}40`,
				}}
			>
				{displayScore}
			</div>
			<p className="text-xs text-[#525252] mt-1 font-mono">/ 100</p>

			{showComment && (
				<p
					className="text-sm text-[#a3a3a3] mt-4 italic"
					style={{ animation: "fade-up 0.3s ease-out both" }}
				>
					"{comment}"
				</p>
			)}
		</div>
	);
}
