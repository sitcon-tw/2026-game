/**
 * Lightweight sheet obfuscation.
 * Prevents trivial inspection of the note sequence in React DevTools,
 * network tab, or page source. NOT cryptographically secure —
 * server-side timing validation is the real defense.
 */

/** Encode on the server: XOR each char code with a rotating key, then base64. */
export function encodeSheet(sheet: string[], seed: number): string {
	const raw = JSON.stringify(sheet);
	const bytes = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i++) {
		bytes[i] = raw.charCodeAt(i) ^ ((seed + i * 7) & 0xff);
	}
	// Use base64 that works in both Node and browser
	if (typeof Buffer !== "undefined") {
		return Buffer.from(bytes).toString("base64");
	}
	return btoa(String.fromCharCode(...bytes));
}

/** Decode on the client: reverse the XOR. */
export function decodeSheet(encoded: string, seed: number): string[] {
	const binary = atob(encoded);
	const chars: string[] = [];
	for (let i = 0; i < binary.length; i++) {
		chars.push(String.fromCharCode(binary.charCodeAt(i) ^ ((seed + i * 7) & 0xff)));
	}
	return JSON.parse(chars.join(""));
}
