import { useState } from "react";

interface UrlInputProps {
	onSubmit: (url: string) => void;
	isLoading: boolean;
	phase: string;
}

const PHASE_LABELS: Record<string, string> = {
	analyzing: "Scraping the internet for dirt...",
	scripting: "Writing your roast...",
};

export function UrlInput({ onSubmit, isLoading, phase }: UrlInputProps) {
	const [input, setInput] = useState("");

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const trimmed = input.trim();
		if (!trimmed) return;
		const url = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
		onSubmit(url);
	}

	return (
		<form onSubmit={handleSubmit}>
			<div className="flex gap-2">
				<input
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Paste a URL to roast..."
					disabled={isLoading}
					className="flex-1 px-4 py-3 bg-[#0a0a0a] border border-[#262626] rounded-lg text-white text-sm placeholder:text-[#525252] focus:outline-none focus:border-[#525252] transition-colors disabled:opacity-60"
				/>
				<button
					type="submit"
					disabled={isLoading || !input.trim()}
					className="px-6 py-3 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 relative overflow-hidden whitespace-nowrap"
				>
					{isLoading ? (
						<span className="flex items-center gap-2">
							<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
							Roasting...
						</span>
					) : (
						"Roast It"
					)}
				</button>
			</div>

			{isLoading && (
				<p
					className="text-center text-xs text-[#a3a3a3] mt-3 font-mono"
					style={{ animation: "fade-in 0.3s ease-out both" }}
				>
					{PHASE_LABELS[phase] || "Loading..."}
				</p>
			)}
		</form>
	);
}
