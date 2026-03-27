import { useEffect, useState } from "react";

interface Particle {
	id: number;
	emoji: string;
	x: number;
	y: number;
	size: number;
	rotation: number;
	duration: number;
	delay: number;
}

const BURN_EMOJIS = ["🔥", "💀", "☠️", "🫠", "😭", "💣", "🪦", "😤", "🤡", "📉"];
const COMPLIMENT_EMOJIS = ["💙", "✨", "🌟", "👑", "💎", "🎯", "🏆", "💪", "🫶", "📈"];
const SCORE_EMOJIS = ["🎉", "🎊", "🥇", "🏆", "⭐", "🔥", "💯", "👑", "✨", "🎆"];

function pickRandom<T>(arr: T[], count: number): T[] {
	const shuffled = [...arr].sort(() => Math.random() - 0.5);
	return shuffled.slice(0, count);
}

export function EmojiBurst({ type, count = 8 }: { type: "burn" | "compliment" | "score"; count?: number }) {
	const [particles, setParticles] = useState<Particle[]>([]);

	useEffect(() => {
		const pool =
			type === "burn" ? BURN_EMOJIS : type === "compliment" ? COMPLIMENT_EMOJIS : SCORE_EMOJIS;
		const emojis = pickRandom(pool, count);

		const newParticles: Particle[] = emojis.map((emoji, i) => ({
			id: Date.now() + i,
			emoji,
			x: 20 + Math.random() * 60,
			y: 30 + Math.random() * 40,
			size: 16 + Math.random() * 20,
			rotation: -30 + Math.random() * 60,
			duration: 1.5 + Math.random() * 1,
			delay: Math.random() * 0.3,
		}));

		setParticles(newParticles);

		const timeout = setTimeout(() => setParticles([]), 3000);
		return () => clearTimeout(timeout);
	}, [type, count]);

	return (
		<div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
			{particles.map((p) => (
				<div
					key={p.id}
					className="absolute"
					style={{
						left: `${p.x}%`,
						top: `${p.y}%`,
						fontSize: p.size,
						animation: `emoji-float ${p.duration}s ease-out ${p.delay}s both`,
						transform: `rotate(${p.rotation}deg)`,
					}}
				>
					{p.emoji}
				</div>
			))}
		</div>
	);
}
