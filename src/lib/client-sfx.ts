const audioCtxRef = { current: null as AudioContext | null };

function getCtx(): AudioContext {
	if (!audioCtxRef.current) {
		audioCtxRef.current = new AudioContext();
	}
	return audioCtxRef.current;
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.3) {
	const ctx = getCtx();
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();
	osc.type = type;
	osc.frequency.value = freq;
	gain.gain.value = volume;
	gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
	osc.connect(gain);
	gain.connect(ctx.destination);
	osc.start();
	osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, volume = 0.15) {
	const ctx = getCtx();
	const bufferSize = ctx.sampleRate * duration;
	const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < bufferSize; i++) {
		data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / bufferSize);
	}
	const source = ctx.createBufferSource();
	source.buffer = buffer;
	const gain = ctx.createGain();
	gain.gain.value = volume;
	source.connect(gain);
	gain.connect(ctx.destination);
	source.start();
}

export type SfxType = "airhorn" | "laugh" | "sad" | "cheer" | "dramatic" | "boom" | "scratch" | "ding";

const SFX_PLAYERS: Record<SfxType, () => void> = {
	airhorn: () => {
		playTone(440, 0.6, "sawtooth", 0.25);
		setTimeout(() => playTone(554, 0.5, "sawtooth", 0.2), 100);
		setTimeout(() => playTone(659, 0.4, "sawtooth", 0.15), 200);
	},
	laugh: () => {
		for (let i = 0; i < 5; i++) {
			setTimeout(() => playTone(300 + Math.random() * 200, 0.12, "triangle", 0.15), i * 120);
		}
	},
	sad: () => {
		playTone(350, 0.4, "triangle", 0.2);
		setTimeout(() => playTone(300, 0.4, "triangle", 0.2), 400);
		setTimeout(() => playTone(250, 0.6, "triangle", 0.15), 800);
	},
	cheer: () => {
		playNoise(0.8, 0.12);
		playTone(523, 0.3, "sine", 0.1);
		setTimeout(() => playTone(659, 0.3, "sine", 0.1), 150);
		setTimeout(() => playTone(784, 0.4, "sine", 0.12), 300);
	},
	dramatic: () => {
		playTone(130, 1.2, "sine", 0.2);
		setTimeout(() => playTone(164, 1.0, "sine", 0.15), 200);
		setTimeout(() => playTone(196, 0.8, "sine", 0.12), 400);
	},
	boom: () => {
		playNoise(0.5, 0.3);
		playTone(60, 0.6, "sine", 0.25);
	},
	scratch: () => {
		playNoise(0.15, 0.25);
		setTimeout(() => playTone(800, 0.1, "sawtooth", 0.15), 50);
		setTimeout(() => playTone(200, 0.15, "sawtooth", 0.1), 100);
	},
	ding: () => {
		playTone(880, 0.3, "sine", 0.2);
		setTimeout(() => playTone(1100, 0.5, "sine", 0.15), 100);
	},
};

const BURN_SFX: SfxType[] = ["airhorn", "laugh", "scratch", "boom"];
const COMPLIMENT_SFX: SfxType[] = ["cheer", "ding", "dramatic"];
const SCORE_SFX: SfxType[] = ["boom", "cheer"];

function pickRandom<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

export function playBurnSfx() {
	const sfx = pickRandom(BURN_SFX);
	SFX_PLAYERS[sfx]();
}

export function playComplimentSfx() {
	const sfx = pickRandom(COMPLIMENT_SFX);
	SFX_PLAYERS[sfx]();
}

export function playScoreSfx() {
	const sfx = pickRandom(SCORE_SFX);
	SFX_PLAYERS[sfx]();
}
