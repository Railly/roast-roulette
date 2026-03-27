import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const client = new ElevenLabsClient({
	apiKey: process.env.ELEVENLABS_API_KEY || "sk_e5c661cea9199f7a5ebe3da1bc5848a9861d581940d0b24e",
});

const OUT = join(import.meta.dir, "..", "public", "sfx");

const SFX_LIST: { name: string; prompt: string; duration: number }[] = [
	{ name: "rimshot", prompt: "classic comedy ba dum tss rimshot drum hit, crisp snare and cymbal, stand-up comedy club", duration: 2 },
	{ name: "airhorn", prompt: "loud MLG air horn blast, stadium celebration horn, meme sound effect", duration: 2 },
	{ name: "crowd-laugh", prompt: "comedy club audience burst of laughter, people laughing hard at a joke, indoor venue", duration: 3 },
	{ name: "sad-trombone", prompt: "sad trombone wah wah wah descending notes, failure sound effect, comedy show", duration: 3 },
	{ name: "crowd-ooh", prompt: "comedy audience collective ooh reaction, crowd impressed and surprised, indoor show", duration: 2 },
	{ name: "mic-drop", prompt: "microphone hitting floor with thud and feedback, dramatic mic drop moment", duration: 2 },
	{ name: "crowd-cheer", prompt: "excited crowd cheering and clapping enthusiastically, standing ovation, indoor venue", duration: 3 },
	{ name: "record-scratch", prompt: "vinyl record scratch stop, sudden halt, comedic moment of surprise", duration: 1 },
	{ name: "dramatic-reveal", prompt: "dramatic orchestral hit with cymbal crash, big reveal moment, cinematic impact", duration: 2 },
	{ name: "womp-womp", prompt: "tuba playing sad descending womp womp womp notes, comedic failure sound", duration: 2 },
];

async function generateSfx(item: { name: string; prompt: string; duration: number }) {
	console.log(`  Generating: ${item.name} ("${item.prompt.slice(0, 50)}...")`);

	const audio = await client.textToSoundEffects.convert({
		text: item.prompt,
		durationSeconds: item.duration,
		promptInfluence: 0.7,
	});

	const buffer = await new Response(audio).arrayBuffer();
	const path = join(OUT, `${item.name}.mp3`);
	await writeFile(path, Buffer.from(buffer));
	console.log(`  Done: ${path} (${(buffer.byteLength / 1024).toFixed(1)} KB)`);
}

console.log(`Generating ${SFX_LIST.length} sound effects...\n`);

for (const item of SFX_LIST) {
	try {
		await generateSfx(item);
	} catch (err) {
		console.error(`  FAILED: ${item.name}:`, err instanceof Error ? err.message : err);
	}
}

console.log("\nDone! SFX saved to public/sfx/");
