import { useState } from "react";

export type Lang = "en" | "es";

interface UrlInputProps {
	onSubmit: (url: string, lang: Lang) => void;
	isLoading: boolean;
	phase: string;
}

const PHASE_LABELS: Record<string, Record<Lang, string>> = {
	analyzing: {
		en: "Scraping the internet for dirt...",
		es: "Buscando trapos sucios en internet...",
	},
	scripting: {
		en: "Writing your roast...",
		es: "Escribiendo tu roast...",
	},
};

const LANG_OPTIONS: { value: Lang; label: string; flag: string }[] = [
	{ value: "en", label: "EN", flag: "🇺🇸" },
	{ value: "es", label: "ES", flag: "🇪🇸" },
];

export function UrlInput({ onSubmit, isLoading, phase }: UrlInputProps) {
	const [input, setInput] = useState("");
	const [lang, setLang] = useState<Lang>("en");

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const trimmed = input.trim();
		if (!trimmed) return;
		const url = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
		onSubmit(url, lang);
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-3">
			<div className="flex gap-2">
				<input
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder={lang === "es" ? "Pega una URL para roastear..." : "Paste a URL to roast..."}
					disabled={isLoading}
					className="flex-1 px-4 py-3 bg-card border border-border rounded-lg text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-ring transition-colors disabled:opacity-60"
				/>
				<button
					type="submit"
					disabled={isLoading || !input.trim()}
					className="px-6 py-3 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 relative overflow-hidden whitespace-nowrap"
				>
					{isLoading ? (
						<span className="flex items-center gap-2">
							<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
							{lang === "es" ? "Roasteando..." : "Roasting..."}
						</span>
					) : lang === "es" ? (
						"Roastear"
					) : (
						"Roast It"
					)}
				</button>
			</div>

			<div className="flex items-center justify-center gap-1">
				{LANG_OPTIONS.map((opt) => (
					<button
						key={opt.value}
						type="button"
						onClick={() => setLang(opt.value)}
						disabled={isLoading}
						className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
							lang === opt.value
								? "bg-foreground text-background"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						<span>{opt.flag}</span>
						{opt.label}
					</button>
				))}
			</div>

			{isLoading && (
				<p
					className="text-center text-xs text-muted-foreground mt-1 font-mono"
					style={{ animation: "fade-in 0.3s ease-out both" }}
				>
					{PHASE_LABELS[phase]?.[lang] || (lang === "es" ? "Cargando..." : "Loading...")}
				</p>
			)}
		</form>
	);
}
