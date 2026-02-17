/**
 * Web Audio API sound synthesis for game notes.
 *
 * Converts note names (e.g. "G4", "A4", "C5", "E#5") to frequencies
 * and plays short sine/triangle tones.
 */

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Map enharmonic equivalents: E# → F, B# → C, Cb → B, Fb → E
const ENHARMONIC_MAP: Record<string, string> = {
  'E#': 'F',
  'B#': 'C',
  'Cb': 'B',
  'Fb': 'E',
};

/** Parse a note string like "G4", "C#5", "E#5" into a MIDI number. */
function noteToMidi(note: string): number {
  const match = note.match(/^([A-G][#b]?)(\d+)$/);
  if (!match) return 69; // fallback to A4

  let [, name, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);

  // Handle enharmonic
  if (ENHARMONIC_MAP[name]) {
    name = ENHARMONIC_MAP[name];
    // E# in octave 5 → F5, but B# in octave 4 → C5 (octave bumps)
    if (match[1] === 'B#') {
      return noteToMidi(`${name}${octave + 1}`);
    }
  }

  const semitone = NOTE_NAMES.indexOf(name);
  if (semitone === -1) return 69;

  return (octave + 1) * 12 + semitone;
}

/** Convert MIDI number to frequency in Hz. */
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Convert a note name to frequency. */
export function noteToFreq(note: string): number {
  return midiToFreq(noteToMidi(note));
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a note with the given duration.
 * Uses a triangle wave with a quick attack and exponential release
 * for a pleasant, game-like tone.
 */
export function playNote(note: string, durationMs: number = 200): void {
  const ctx = getAudioContext();
  const freq = noteToFreq(note);
  const now = ctx.currentTime;
  const duration = durationMs / 1000;

  // Oscillator
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, now);

  // Gain envelope: quick attack, sustain, exponential release
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.01); // 10ms attack
  gain.gain.setValueAtTime(0.3, now + duration * 0.7);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}
