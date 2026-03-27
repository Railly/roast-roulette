import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const client = new ElevenLabsClient({
	apiKey: "sk_e5c661cea9199f7a5ebe3da1bc5848a9861d581940d0b24e",
});

const OUT = join(import.meta.dir, "..", "public", "sfx");

const SFX_LIST: { name: string; prompt: string; duration: number; influence: number }[] = [
	{
		name: "rimshot",
		prompt: "A clean, punchy drum rimshot 'ba dum tss' with a tight snare hit followed by a hi-hat crash. Dry recording, close mic, like a real drum kit in a comedy club. No reverb, no echo.",
		duration: 2,
		influence: 0.8,
	},
	{
		name: "airhorn",
		prompt: "A single loud compressed air horn blast, the classic sports/meme MLG airhorn. Very loud, very short, distorted and obnoxious. Like the ones at football games.",
		duration: 1,
		influence: 0.9,
	},
	{
		name: "crowd-laugh",
		prompt: "A burst of genuine human laughter from a live comedy club audience of about 50 people. Spontaneous, hearty belly laughs with some clapping. Recorded with room ambience. Fades out naturally.",
		duration: 4,
		influence: 0.7,
	},
	{
		name: "sad-trombone",
		prompt: "The classic 'wah wah wah waaah' sad trombone descending notes. A real brass trombone playing the iconic comedy failure jingle. Slow, exaggerated, cartoonish.",
		duration: 3,
		influence: 0.9,
	},
	{
		name: "crowd-ooh",
		prompt: "A live audience collectively going 'OOOOH!' in reaction to a savage burn or roast. Like when someone gets absolutely destroyed at a comedy roast. Shocked and impressed.",
		duration: 2,
		influence: 0.8,
	},
	{
		name: "mic-drop",
		prompt: "A heavy microphone being dropped onto a wooden stage floor. A single solid thud with a brief burst of feedback. Dramatic silence after the impact.",
		duration: 2,
		influence: 0.8,
	},
	{
		name: "crowd-cheer",
		prompt: "An enthusiastic indoor audience erupting in cheers, whistles, and loud clapping. Like a standing ovation at a comedy special. Excited crowd energy with whooping.",
		duration: 4,
		influence: 0.7,
	},
	{
		name: "record-scratch",
		prompt: "A vinyl DJ record scratch. The classic 'SCREEEECH' of a needle being dragged across a vinyl record, like in movies when everything suddenly stops. Single sharp scratch.",
		duration: 1,
		influence: 0.9,
	},
	{
		name: "dramatic-hit",
		prompt: "A massive cinematic orchestral hit. A full orchestra playing a single dramatic stinger chord with brass, timpani, and a cymbal crash. Like a movie trailer impact moment.",
		duration: 2,
		influence: 0.8,
	},
	{
		name: "womp-womp",
		prompt: "A tuba or sousaphone playing the sad descending 'womp womp womp' three-note failure sound. Low brass, cartoonish, exaggerated. The classic 'you lost' jingle.",
		duration: 3,
		influence: 0.9,
	},
];

async function generateSfx(item: typeof SFX_LIST[number]) {
	console.log(`  ${item.name}...`);

	const audio = await client.textToSoundEffects.convert({
		text: item.prompt,
		durationSeconds: item.duration,
		promptInfluence: item.influence,
	});

	const buffer = await new Response(audio).arrayBuffer();
	const path = join(OUT, `${item.name}.mp3`);
	await writeFile(path, Buffer.from(buffer));
	const kb = (buffer.byteLength / 1024).toFixed(1);
	console.log(`  ${item.name}.mp3 (${kb} KB)`);
}

console.log(`Generating ${SFX_LIST.length} SFX...\n`);

for (const item of SFX_LIST) {
	try {
		await generateSfx(item);
	} catch (err) {
		console.error(`  FAILED ${item.name}:`, err instanceof Error ? err.message : err);
	}
}

console.log("\nDone.");
