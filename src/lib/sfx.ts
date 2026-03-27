export const SFX_PROMPTS: Record<string, string> = {
	airhorn: "loud air horn blast sports celebration",
	crowd_laugh: "crowd of people laughing hard at a comedy show",
	sad_trombone: "sad trombone wah wah wah failure sound",
	explosion: "dramatic cinematic explosion boom impact",
	crowd_cheer: "excited crowd cheering and clapping stadium",
	dramatic_piano: "dramatic piano chord revelation surprising discovery",
	mic_drop: "microphone dropping on floor with reverb",
	record_scratch: "vinyl record scratch stop moment",
};

export type SfxKey = keyof typeof SFX_PROMPTS;

export const ROAST_SFX: SfxKey[] = ["airhorn", "crowd_laugh", "sad_trombone", "record_scratch", "mic_drop"];
export const COMPLIMENT_SFX: SfxKey[] = ["crowd_cheer", "dramatic_piano"];
export const SCORE_SFX: SfxKey[] = ["explosion", "crowd_cheer"];
