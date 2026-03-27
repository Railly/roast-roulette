const sfxCache = new Map<string, HTMLAudioElement>();

function preload(name: string): HTMLAudioElement {
	const cached = sfxCache.get(name);
	if (cached) return cached;
	const audio = new Audio(`/sfx/${name}.mp3`);
	audio.preload = "auto";
	sfxCache.set(name, audio);
	return audio;
}

function play(name: string, volume = 0.7) {
	const audio = preload(name);
	const clone = audio.cloneNode(true) as HTMLAudioElement;
	clone.volume = Math.min(1, volume);
	clone.play().catch(() => {});
}

const SFX_VOL = 0.7;

const BURN_SFX = [
	"rimshot",
	"airhorn",
	"crowd-laugh",
	"crowd-ooh",
	"punch",
	"sad-trombone",
	"womp-womp",
];

const COMPLIMENT_SFX = [
	"crowd-cheer",
	"crowd-ooh",
	"crowd-laugh",
];

function pickRandom<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

let lastPlayed = "";

function playVaried(options: string[]) {
	const filtered = options.length > 1 ? options.filter((o) => o !== lastPlayed) : options;
	const pick = pickRandom(filtered);
	lastPlayed = pick;
	play(pick, SFX_VOL);
}

export function preloadAll() {
	const all = new Set([...BURN_SFX, ...COMPLIMENT_SFX, "dramatic-hit"]);
	all.forEach((s) => preload(s));
}

export function playBurnSfx() {
	playVaried(BURN_SFX);
}

export function playComplimentSfx() {
	playVaried(COMPLIMENT_SFX);
}

export function playScoreSfx() {
	play("dramatic-hit", SFX_VOL);
	setTimeout(() => play("crowd-cheer", SFX_VOL), 1000);
}
