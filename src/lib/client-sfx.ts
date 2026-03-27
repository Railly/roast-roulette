const sfxCache = new Map<string, HTMLAudioElement>();

function preload(name: string): HTMLAudioElement {
	const cached = sfxCache.get(name);
	if (cached) return cached;
	const audio = new Audio(`/sfx/${name}.mp3`);
	audio.preload = "auto";
	sfxCache.set(name, audio);
	return audio;
}

function play(name: string, volume = 0.6) {
	const audio = preload(name);
	const clone = audio.cloneNode(true) as HTMLAudioElement;
	clone.volume = volume;
	clone.play().catch(() => {});
}

const BURN_SFX = [
	{ name: "rimshot", vol: 0.7 },
	{ name: "airhorn", vol: 0.5 },
	{ name: "crowd-laugh", vol: 0.6 },
	{ name: "crowd-ooh", vol: 0.6 },
	{ name: "record-scratch", vol: 0.5 },
];

const COMPLIMENT_SFX = [
	{ name: "crowd-cheer", vol: 0.6 },
	{ name: "crowd-ooh", vol: 0.5 },
	{ name: "dramatic-reveal", vol: 0.5 },
];

const FAIL_SFX = [
	{ name: "sad-trombone", vol: 0.6 },
	{ name: "womp-womp", vol: 0.6 },
];

const SCORE_SFX = [
	{ name: "dramatic-reveal", vol: 0.7 },
	{ name: "crowd-cheer", vol: 0.7 },
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
	[...BURN_SFX, ...COMPLIMENT_SFX, ...FAIL_SFX, ...SCORE_SFX].forEach((s) => preload(s.name));
}

export function playBurnSfx() {
	playVaried(BURN_SFX);
}

export function playComplimentSfx() {
	playVaried(COMPLIMENT_SFX);
}

export function playScoreSfx() {
	play("dramatic-reveal", 0.7);
	setTimeout(() => play("crowd-cheer", 0.65), 800);
}

export function playMicDrop() {
	play("mic-drop", 0.7);
}
