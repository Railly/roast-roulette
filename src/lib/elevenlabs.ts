import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { Buffer } from "node:buffer";

export function createClient(apiKey: string): ElevenLabsClient {
	return new ElevenLabsClient({ apiKey });
}

export async function streamToDataUri(
	stream: ReadableStream,
	mimeType = "audio/mpeg",
): Promise<string> {
	const buffer = await new Response(stream).arrayBuffer();
	const base64 = Buffer.from(buffer).toString("base64");
	return `data:${mimeType};base64,${base64}`;
}
