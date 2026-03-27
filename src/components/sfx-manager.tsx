import { useState, useCallback, useRef } from "react";

interface SfxFile {
	name: string;
	url: string;
	size: string;
}

const SFX_NAMES = [
	"rimshot",
	"airhorn",
	"crowd-laugh",
	"sad-trombone",
	"crowd-ooh",
	"mic-drop",
	"crowd-cheer",
	"record-scratch",
	"dramatic-hit",
	"womp-womp",
];

export function SfxManager() {
	const [files, setFiles] = useState<SfxFile[]>([]);
	const [playing, setPlaying] = useState<string | null>(null);
	const [generating, setGenerating] = useState<string | null>(null);
	const [customPrompt, setCustomPrompt] = useState("");
	const [customName, setCustomName] = useState("");
	const [customDuration, setCustomDuration] = useState(2);
	const [generatedAudio, setGeneratedAudio] = useState<{ name: string; url: string } | null>(null);
	const [log, setLog] = useState<string[]>([]);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const addLog = (msg: string) => setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

	const loadLibrary = useCallback(() => {
		const items = SFX_NAMES.map((name) => ({
			name,
			url: `/sfx/${name}.mp3`,
			size: "?",
		}));
		setFiles(items);
		addLog(`Loaded ${items.length} SFX from /sfx/`);
	}, []);

	const playFile = useCallback((name: string, url: string) => {
		if (audioRef.current) {
			audioRef.current.pause();
		}
		const audio = new Audio(url);
		audio.volume = 1;
		audioRef.current = audio;
		setPlaying(name);
		audio.onended = () => setPlaying(null);
		audio.play().catch(() => setPlaying(null));
		addLog(`Playing: ${name}`);
	}, []);

	const stopAudio = useCallback(() => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current = null;
		}
		setPlaying(null);
	}, []);

	const generateSfx = useCallback(async (prompt: string, name: string, duration: number) => {
		setGenerating(name);
		addLog(`Generating "${name}" (${duration}s): ${prompt.slice(0, 80)}...`);

		try {
			const res = await fetch("/api/generate-sfx", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ prompt, name, duration }),
			});

			if (!res.ok) {
				const err = await res.text();
				addLog(`ERROR: ${err}`);
				setGenerating(null);
				return;
			}

			const data = await res.json() as { url: string; size: number };
			addLog(`Generated: ${name} (${(data.size / 1024).toFixed(1)} KB)`);
			setGeneratedAudio({ name, url: data.url });
			setGenerating(null);
		} catch (err) {
			addLog(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
			setGenerating(null);
		}
	}, []);

	const downloadAudio = useCallback((url: string, name: string) => {
		const a = document.createElement("a");
		a.href = url;
		a.download = `${name}.mp3`;
		a.click();
		addLog(`Downloaded: ${name}.mp3`);
	}, []);

	return (
		<div className="min-h-screen bg-black text-white p-6 max-w-4xl mx-auto space-y-8">
			<div>
				<h1 className="text-3xl font-bold">
					<span className="text-red-500">SFX</span> Manager
				</h1>
				<p className="text-neutral-500 text-sm mt-1">
					Preview, generate, download, and replace sound effects
				</p>
			</div>

			<div className="border border-neutral-800 rounded-lg">
				<div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
					<h2 className="text-sm font-semibold">Current Library</h2>
					<button
						type="button"
						onClick={loadLibrary}
						className="px-3 py-1 text-xs bg-neutral-800 rounded hover:bg-neutral-700 transition"
					>
						Load
					</button>
				</div>

				{files.length === 0 ? (
					<p className="p-4 text-neutral-600 text-sm">Click Load to see your SFX library</p>
				) : (
					<div className="divide-y divide-neutral-900">
						{files.map((f) => (
							<div key={f.name} className="px-4 py-3 flex items-center justify-between">
								<div className="flex items-center gap-3">
									<button
										type="button"
										onClick={() => (playing === f.name ? stopAudio() : playFile(f.name, f.url))}
										className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition ${
											playing === f.name
												? "bg-red-600 text-white"
												: "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
										}`}
									>
										{playing === f.name ? "■" : "▶"}
									</button>
									<div>
										<p className="text-sm font-mono">{f.name}.mp3</p>
										<p className="text-[10px] text-neutral-600">{f.url}</p>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => downloadAudio(f.url, f.name)}
										className="px-2 py-1 text-[10px] border border-neutral-700 rounded text-neutral-400 hover:text-white hover:border-neutral-500 transition"
									>
										Download
									</button>
									<button
										type="button"
										onClick={() => {
											setCustomName(f.name);
											setCustomPrompt("");
										}}
										className="px-2 py-1 text-[10px] border border-neutral-700 rounded text-neutral-400 hover:text-white hover:border-neutral-500 transition"
									>
										Regenerate
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			<div className="border border-neutral-800 rounded-lg">
				<div className="px-4 py-3 border-b border-neutral-800">
					<h2 className="text-sm font-semibold">Generate New SFX</h2>
					<p className="text-[10px] text-neutral-600 mt-0.5">
						Uses ElevenLabs Text-to-Sound-Effects API
					</p>
				</div>
				<div className="p-4 space-y-3">
					<div className="flex gap-2">
						<input
							type="text"
							value={customName}
							onChange={(e) => setCustomName(e.target.value)}
							placeholder="filename (e.g. crowd-gasp)"
							className="w-40 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-sm placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
						/>
						<input
							type="number"
							value={customDuration}
							onChange={(e) => setCustomDuration(Number(e.target.value))}
							min={1}
							max={10}
							className="w-16 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-sm text-center focus:outline-none focus:border-neutral-600"
						/>
						<span className="text-neutral-600 text-sm self-center">sec</span>
					</div>
					<textarea
						value={customPrompt}
						onChange={(e) => setCustomPrompt(e.target.value)}
						placeholder="Describe the sound effect in detail...&#10;&#10;e.g. A live comedy club audience of 200 people erupting in genuine belly laughs and clapping. Some people whistling. Indoor venue with natural reverb. Fades out after 3 seconds."
						rows={4}
						className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-sm placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 resize-none"
					/>
					<div className="flex gap-2">
						<button
							type="button"
							disabled={!customPrompt.trim() || !customName.trim() || !!generating}
							onClick={() => generateSfx(customPrompt, customName, customDuration)}
							className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
						>
							{generating ? `Generating ${generating}...` : "Generate"}
						</button>
					</div>

					{generatedAudio && (
						<div
							className="flex items-center gap-3 p-3 bg-neutral-950 border border-neutral-800 rounded"
							style={{ animation: "fade-up 0.3s ease-out both" }}
						>
							<button
								type="button"
								onClick={() =>
									playing === generatedAudio.name
										? stopAudio()
										: playFile(generatedAudio.name, generatedAudio.url)
								}
								className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition ${
									playing === generatedAudio.name
										? "bg-red-600 text-white"
										: "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
								}`}
							>
								{playing === generatedAudio.name ? "■" : "▶"}
							</button>
							<span className="text-sm font-mono flex-1">{generatedAudio.name}.mp3</span>
							<button
								type="button"
								onClick={() => downloadAudio(generatedAudio.url, generatedAudio.name)}
								className="px-3 py-1 text-xs bg-neutral-800 rounded hover:bg-neutral-700 transition"
							>
								Download
							</button>
						</div>
					)}
				</div>
			</div>

			<div className="border border-neutral-800 rounded-lg">
				<div className="px-4 py-3 border-b border-neutral-800">
					<h2 className="text-sm font-semibold font-mono">Log</h2>
				</div>
				<div className="p-4 max-h-48 overflow-y-auto font-mono text-[11px] text-neutral-500 space-y-0.5">
					{log.length === 0 ? (
						<p className="text-neutral-700">No activity yet</p>
					) : (
						log.map((l, i) => <p key={`log-${i}`}>{l}</p>)
					)}
				</div>
			</div>
		</div>
	);
}
