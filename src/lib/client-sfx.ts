const sfxCache = new Map<string, HTMLAudioElement>();

function preload(name: string): HTMLAudioElement {
	const cached = sfxCache.get(name);
	if (cached) return cached;
	const audio = new Audio(`/sfx/${name}.mp3`);
	audio.preload = "auto";
	sfxCache.set(name, audio);
	return audio;
}

function play(name: string, volume = 0.85) {
	const audio = preload(name);
	const clone = audio.cloneNode(true) as HTMLAudioElement;
	clone.volume = Math.min(1, volume);
	clone.play().catch(() => {});
}

const BURN_SFX = [
	{ name: "rimshot", vol: 0.85 },
	{ name: "airhorn", vol: 0.45 },
	{ name: "crowd-laugh", vol: 0.5 },
	{ name: "crowd-ooh", vol: 0.5 },
	{ name: "punch", vol: 0.7 },
	{ name: "sad-trombone", vol: 0.7 },
	{ name: "womp-womp", vol: 0.7 },
];

const COMPLIMENT_SFX = [
	{ name: "crowd-cheer", vol: 0.55 },
	{ name: "crowd-ooh", vol: 0.5 },
	{ name: "crowd-laugh", vol: 0.5 },
];

function pickRandom<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

let lastPlayed = "";

function playVaried(options: { name: string; vol: number }[]) {
	const filtered = options.length > 1 ? options.filter((o) => o.name !== lastPlayed) : options;
	const pick = pickRandom(filtered);
	lastPlayed = pick.name;
	play(pick.name, pick.vol);
}

export function preloadAll() {
	const all = [...BURN_SFX, ...COMPLIMENT_SFX, { name: "dramatic-hit" }];
	all.forEach((s) => preload(s.name));
}

export function playBurnSfx() {
	playVaried(BURN_SFX);
}

export function playComplimentSfx() {
	playVaried(COMPLIMENT_SFX);
}

export function playScoreSfx() {
	play("dramatic-hit", 0.7);
	setTimeout(() => play("crowd-cheer", 0.55), 1000);
}
