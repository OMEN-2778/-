
/* ================= BGM: a tiny chiptune sequencer ================= */
const NOTE_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midiOf(n) { const m = /^([A-G])([#b]?)(-?\d)$/.exec(n); return 12 * (+m[3] + 1) + NOTE_PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); }
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
function chordMidis(name, oct) {
  const m = /^([A-G][#b]?)(m?)(7?)$/.exec(name), root = midiOf(m[1] + oct);
  const iv = m[2] ? [0, 3, 7] : [0, 4, 7]; if (m[3]) iv.push(10);
  return iv.map(i => root + i);
}
function parseBar(str) {
  const ev = []; let at = 0;
  for (const tok of str.trim().split(/\s+/)) { const [n, l] = tok.split(':'); const len = +l; if (n !== 'r') ev.push({ at, m: midiOf(n), len }); at += len; }
  return ev;
}
const TRACKS = {
  title: {
    bpm: 92,
    chords: ['G', 'D', 'Em', 'C', 'G', 'C', 'Am', 'D', 'G', 'D', 'Em', 'Bm', 'C', 'G', 'Am', 'D7'],
    lead: [
      'B4:4 D5:4 G5:6 F#5:2', 'A5:6 G5:2 F#5:4 D5:4', 'E5:4 G5:4 B5:6 A5:2', 'G5:8 E5:4 C5:4',
      'D5:4 G5:4 B5:4 A5:2 G5:2', 'E5:6 G5:2 C6:4 B5:4', 'A5:4 C6:4 E5:4 A5:4', 'F#5:8 A5:4 D5:4',
      'B5:6 A5:2 G5:4 D5:4', 'F#5:4 A5:4 D6:6 C6:2', 'B5:4 G5:4 E5:6 G5:2', 'F#5:8 D5:4 B4:4',
      'C5:4 E5:4 G5:4 C6:4', 'B5:6 A5:2 G5:4 D5:4', 'E5:4 A5:4 C6:4 B5:4', 'A5:4 F#5:4 D5:4 F#5:4'],
  },
  battle: {
    bpm: 136,
    chords: ['C', 'Am', 'F', 'G', 'C', 'Am', 'Dm', 'G', 'F', 'G', 'Em', 'Am', 'Dm', 'G', 'C', 'C'],
    lead: [
      'E5:2 G5:2 r:2 E5:2 C6:2 r:2 G5:2 E5:2', 'A5:2 r:2 E5:2 A5:2 C6:4 B5:2 A5:2', 'F5:2 A5:2 C6:2 A5:2 F5:2 r:2 G5:2 A5:2', 'B5:2 r:2 G5:2 r:2 D5:4 G5:2 F5:2',
      'E5:2 G5:2 C6:2 G5:2 E6:4 D6:2 C6:2', 'B5:2 A5:2 E5:2 A5:2 C6:2 r:2 A5:4', 'D5:2 F5:2 A5:2 D6:2 C6:2 A5:2 F5:2 D5:2', 'G5:4 F#5:1 G5:1 r:2 B4:2 D5:2 G5:4',
      'A5:4 C6:4 A5:2 G5:2 F5:4', 'G5:4 B5:4 D6:4 B5:4', 'G5:2 E5:2 B4:2 E5:2 G5:4 B5:4', 'A5:6 G5:2 E5:4 C5:4',
      'F5:2 A5:2 D6:2 A5:2 F5:2 A5:2 D6:4', 'D6:2 C6:2 B5:2 A5:2 G5:4 F5:4', 'E5:2 G5:2 C6:2 E6:2 G6:2 E6:2 C6:4', 'C6:2 r:2 G5:1 G5:1 r:2 C5:4 r:4'],
  },
  battle2: {
    bpm: 144,
    chords: ['Am', 'F', 'G', 'E', 'Am', 'F', 'Dm', 'E', 'F', 'G', 'Am', 'Am', 'Dm', 'E', 'Am', 'E'],
    lead: [
      'A5:2 C6:2 E6:2 A5:2 C6:2 E6:2 D6:2 C6:2', 'C6:4 A5:2 F5:2 A5:4 C6:4', 'B5:2 D6:2 G6:2 D6:2 B5:2 G5:2 A5:2 B5:2', 'G#5:6 B5:2 E6:4 D6:2 B5:2',
      'C6:2 B5:2 A5:2 E5:2 A5:2 B5:2 C6:4', 'F5:2 A5:2 C6:2 F6:2 E6:2 C6:2 A5:4', 'D6:2 C6:2 A5:2 F5:2 D5:4 F5:2 A5:2', 'G#5:2 A5:2 B5:4 E6:4 r:4',
      'A5:4 F5:4 C6:4 A5:4', 'B5:4 G5:4 D6:4 B5:4', 'C6:2 E6:2 A6:4 G6:2 E6:2 C6:4', 'E6:6 D6:2 C6:4 B5:4',
      'A5:2 D6:2 F6:2 D6:2 A5:2 F5:2 D5:4', 'B5:2 G#5:2 E5:2 G#5:2 B5:4 E6:4', 'A5:2 C6:2 E6:2 A6:2 G#6:2 E6:2 C6:2 A5:2', 'B5:4 G#5:4 E5:4 r:4'],
  },
  boss: {
    bpm: 150,
    chords: ['Dm', 'Bb', 'C', 'A', 'Dm', 'Bb', 'Gm', 'A', 'Bb', 'C', 'Dm', 'Dm', 'Gm', 'A', 'Dm', 'A'],
    lead: [
      'D5:2 F5:2 A5:2 D6:2 C6:2 A5:2 F5:4', 'D5:2 F5:2 Bb5:4 A5:2 G5:2 F5:4', 'E5:2 G5:2 C6:2 E6:2 D6:4 C6:4', 'C#6:4 A5:2 E5:2 C#5:4 E5:2 G5:2',
      'F5:2 A5:2 D6:4 F6:2 E6:2 D6:4', 'D6:2 C6:2 Bb5:2 A5:2 Bb5:4 F5:4', 'G5:2 Bb5:2 D6:2 G6:2 F6:2 E6:2 D6:4', 'C#6:2 D6:2 E6:4 A5:4 r:4',
      'F6:4 D6:4 Bb5:4 D6:4', 'E6:4 C6:4 G5:4 C6:4', 'D6:6 E6:2 F6:4 A6:4', 'G6:2 F6:2 E6:2 D6:2 A5:8',
      'Bb5:2 D6:2 G6:4 F6:2 E6:2 D6:4', 'C#6:4 E6:4 A6:4 G6:4', 'F6:2 E6:2 D6:2 A5:2 F5:2 A5:2 D6:4', 'E6:2 C#6:2 A5:2 E5:2 A5:4 r:4'],
  },
  pick: { bpm: 100, chords: ['C', 'C'], lead: ['r:16', 'r:16'] },
};
for (const k in TRACKS) TRACKS[k].bars = TRACKS[k].lead.map(parseBar);

/* ---- more tracks: every scene has three, one is drawn at random per run ---- */
const MORE_TRACKS = {
  title1: { bpm: 84,
    chords: ['D', 'Bm', 'G', 'A', 'D', 'F#m', 'G', 'A', 'Bm', 'G', 'D', 'A', 'G', 'A', 'D', 'D'],
    lead: ['F#5:4 A5:4 D6:6 C#6:2', 'B5:8 A5:4 F#5:4', 'G5:4 B5:4 D6:4 B5:4', 'A5:12 r:4', 'F#5:4 A5:4 D6:4 E6:4', 'F#6:6 E6:2 C#6:4 A5:4', 'B5:4 D6:4 G6:4 F#6:4', 'E6:12 r:4', 'D6:4 C#6:4 B5:4 F#5:4', 'G5:6 A5:2 B5:4 D6:4', 'A5:4 F#5:4 D5:4 F#5:4', 'E5:8 A5:8', 'B5:6 A5:2 G5:4 B5:4', 'C#6:6 B5:2 A5:4 E6:4', 'F#6:6 E6:2 D6:4 A5:4', 'D6:12 r:4'],
    layers: { bass: { pat: 'r.......f.......', len: 7, vol: .17 }, arp: { wave: 'triangle', oct: 5, seq: [0, 1, 2, 3, 4, 3, 2, 1], vol: .02, echo: true, len: .9 }, pad: { oct: 4, vol: .012, att: .5 },
      lead: { wave: 'sine', vol: .075, vib: true, len: .95, att: .03, sus: .85, echo: true, alt: { wave: 'p25', vol: .045, vib: true, len: .95, sus: .8 } },
      drums: { from: 4, h: '..x...x...x...x.', k: 'x...............', v: { h: .011, k: .11 } } } },
  title2: { bpm: 72,
    chords: ['F', 'Dm', 'Bb', 'C', 'F', 'Am', 'Bb', 'C7'],
    lead: ['C6:2 A5:2 F5:2 A5:2 C6:4 F6:4', 'E6:2 D6:2 A5:4 F5:8', 'D6:2 C6:2 Bb5:2 D6:2 F6:6 D6:2', 'C6:8 G5:4 E5:4', 'F5:2 A5:2 C6:2 F6:2 E6:4 C6:4', 'E6:4 C6:2 A5:2 E5:8', 'D6:4 F6:4 E6:4 D6:4', 'C6:12 r:4'],
    layers: { bass: { wave: 'sine', pat: 'r...............', len: 14, vol: .22 }, arp: { wave: 'triangle', oct: 4, every: 2, seq: [0, 1, 2, 3, 2, 1, 0, 1], vol: .03, echo: true, len: 1.6 }, pad: { oct: 5, vol: .011, att: .7, vib: true },
      lead: { wave: 'triangle', vol: .09, len: .6, sus: .2, dec: .25, echo: true, alt: { wave: 'triangle', vol: .08, len: .6, sus: .2, dec: .25, echo: true, oct: 12 } } } },
  battle1: { bpm: 150,
    chords: ['G', 'D', 'G', 'C', 'G', 'D7', 'G', 'G', 'C', 'G', 'D', 'G', 'C', 'G', 'D7', 'G'],
    lead: ['D5:2 G5:2 B5:2 G5:2 D6:4 B5:4', 'C6:2 A5:2 F#5:2 A5:2 D6:4 r:4', 'B5:2 D6:2 B5:2 G5:2 A5:2 B5:2 C6:4', 'E6:4 C6:2 G5:2 E5:4 r:4', 'D5:2 G5:2 B5:2 D6:2 G6:4 F#6:2 E6:2', 'D6:2 C6:2 A5:2 F#5:2 A5:4 C6:4', 'B5:2 A5:2 G5:2 F#5:2 G5:4 D5:4', 'G5:4 r:2 D5:1 D5:1 G5:4 r:4', 'E6:4 G6:4 E6:2 C6:2 G5:4', 'D6:4 B5:4 G5:4 B5:4', 'A5:2 C6:2 F#6:2 E6:2 D6:4 A5:4', 'B5:4 D6:4 G6:8', 'G6:2 E6:2 C6:2 E6:2 G6:4 C6:4', 'B5:2 D6:2 G6:2 D6:2 B5:4 G5:4', 'A5:2 F#5:2 D5:2 F#5:2 A5:2 C6:2 E6:4', 'D6:2 B5:2 G5:4 G6:4 r:4'],
    layers: { bass: { pat: 'r...f...r...f...', len: 1.4, vol: .22 }, stab: { pat: '..x...x...x...x.', vol: .018, len: .6 },
      lead: { wave: 'p50', vol: .045, len: .65, sus: .55, alt: { wave: 'p25', vol: .048, len: .65, sus: .6, double: { wave: 'triangle', iv: -12, vol: .05 } } },
      drums: { k: 'x.......x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', fill: { t: '............xxxx' }, fillEvery: 8, v: { h: .016 } } },
    extra(bar, s, t, sd) {
      if ((bar === 3 || bar === 11) && s === 14) inst('sine', hz(midiOf('G6')), t, sd * 2, .05, { slide: hz(midiOf('G5')), sus: .9, rel: .04 });
      if ((bar === 7 || bar === 15) && s === 12) inst('sine', hz(midiOf('D6')), t, sd * 3, .05, { slide: hz(midiOf('A6')), sus: .9, rel: .05 });
    } },
  battle2a: { bpm: 140,
    chords: ['A', 'F#m', 'D', 'E', 'A', 'F#m', 'D', 'E', 'D', 'E', 'C#m', 'F#m', 'D', 'E', 'A', 'A'],
    lead: ['E5:2 A5:2 C#6:2 E6:2 r:2 C#6:2 B5:2 A5:2', 'C#6:4 A5:2 F#5:2 r:2 A5:2 C#6:4', 'D6:2 F#6:2 A6:2 F#6:2 E6:4 D6:4', 'B5:4 G#5:2 E5:2 G#5:2 B5:2 E6:4', 'A5:2 C#6:2 E6:2 A6:2 G#6:2 E6:2 C#6:4', 'F#6:4 E6:2 C#6:2 A5:4 C#6:4', 'B5:2 A5:2 F#5:2 A5:2 D6:4 F#6:4', 'E6:6 D6:2 B5:4 G#5:4', 'F#6:4 D6:4 A5:4 D6:4', 'G#6:4 E6:4 B5:4 E6:4', 'E6:2 C#6:2 G#5:2 C#6:2 E6:4 G#6:4', 'F#6:8 C#6:4 A5:4', 'D6:2 F#6:2 A6:2 F#6:2 D6:2 A5:2 F#5:4', 'E5:2 G#5:2 B5:2 E6:2 G#6:4 B6:4', 'A6:4 E6:2 C#6:2 A5:4 C#6:4', 'A5:4 r:2 E5:1 A5:1 r:8'],
    layers: { bass: { pat: 'r..r..o.r..f.o..', len: 1.2, vol: .22 }, arp: { wave: 'p12', oct: 5, seq: [0, 1, 2, 1], vol: .013 },
      lead: { wave: 'p12', vol: .05, len: .75, echo: true, sus: .6, alt: { wave: 'p25', vol: .05, len: .8, vib: true } },
      drums: { k: 'x.....x...x.....', s: '....x.......x...', c: '....x.......x...', h: 'xxxxxxxxxxxxxxxx', o: '..x...x...x...x.', fill: { s: '....x.......xxxx' }, v: { h: .008, o: .013, c: .07 } } } },
  battle21: { bpm: 132,
    chords: ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'C', 'Bb', 'A'],
    lead: ['D5:4 F5:2 A5:2 D6:6 C6:2', 'A5:4 F5:4 D5:8', 'Bb5:4 D6:2 F6:2 E6:4 D6:4', 'C#6:8 E6:4 A5:4', 'F6:4 E6:2 D6:2 A5:4 F5:4', 'E5:2 G5:2 C6:2 E6:2 G6:4 E6:4', 'F6:2 E6:2 D6:2 C6:2 Bb5:4 D6:4', 'A5:2 C#6:2 E6:2 A6:2 G6:4 E6:4'],
    layers: { bass: { pat: 'r.r.r.r.r.r.r.r.', len: .9, vol: .22, layer2: { wave: 'p25', vol: .022, iv: 12 } }, pad: { wave: 'p50', oct: 3, vol: .008, att: .1 },
      lead: { wave: 'p50', vol: .045, vib: true, len: .9, sus: .75, alt: { wave: 'p25', vol: .05, vib: true, len: .9, double: { wave: 'triangle', iv: -12, vol: .05 } } },
      drums: { k: 'x.....x.x.......', s: '....x.......x...', h: 'x...x...x...x...', fill: { t: '............xxxx', s: '....x.......x...' }, v: { h: .02, t: .22 } } } },
  battle22: { bpm: 156,
    chords: ['Em', 'C', 'D', 'B', 'Em', 'C', 'Am', 'B'],
    lead: ['E5:2 G5:2 B5:2 E6:2 D6:2 B5:2 G5:2 B5:2', 'C6:2 E6:2 G6:4 E6:2 C6:2 G5:4', 'D6:2 F#6:2 A6:2 F#6:2 D6:2 A5:2 F#5:4', 'D#6:4 F#6:4 B6:4 A6:2 F#6:2', 'G6:2 F#6:2 E6:2 B5:2 G5:2 B5:2 E6:4', 'E6:2 D6:2 C6:2 G5:2 E5:2 G5:2 C6:4', 'A5:2 C6:2 E6:2 A6:2 G6:2 E6:2 C6:4', 'B5:2 D#6:2 F#6:2 B6:2 A6:2 F#6:2 D#6:4'],
    layers: { bass: { pat: 'r.o.r.o.r.o.r.o.', len: .9, vol: .2 }, arp: { wave: 'p12', oct: 5, seq: [0, 1, 2, 3, 2, 1], vol: .015 },
      lead: { wave: 'p25', vol: .05, len: .8, sus: .65, alt: { wave: 'p25', vol: .05, len: .8, echo: true } },
      drums: { k: 'x..x..x...x..x..', s: '....x.......x...', h: 'x.xxx.xxx.xxx.xx', fill: { s: '....x.......xxxx' }, v: { h: .012 } } } },
  boss1: { bpm: 160,
    chords: ['Cm', 'Ab', 'Bb', 'G', 'Cm', 'Ab', 'Fm', 'G'],
    lead: ['C6:4 Eb6:4 G6:4 F6:2 Eb6:2', 'Eb6:4 C6:4 Ab5:8', 'D6:4 F6:4 Bb6:4 Ab6:2 G6:2', 'G6:8 F6:2 Eb6:2 D6:4', 'Eb6:2 D6:2 C6:2 G5:2 C6:4 Eb6:4', 'Ab6:4 G6:2 F6:2 Eb6:4 C6:4', 'F6:2 Ab6:2 C7:4 B6:4 G6:4', 'B5:2 D6:2 F6:2 G6:2 B6:8'],
    layers: { bass: { pat: 'rrorrrorrrorrror', len: .8, vol: .19 }, pad: { oct: 4, vol: .02, vib: true, att: .3 },
      lead: { wave: 'p25', vol: .048, vib: true, len: .9, double: { wave: 'p12', iv: -5, vol: .022 }, alt: { wave: 'p25', vol: .05, vib: true, len: .9, echo: true, double: { wave: 'triangle', iv: -12, vol: .05 } } },
      drums: { k: 'x.x.x.x.x.x.x.x.', s: '....x.......x...', h: '..x...x...x...x.', fill: { t: '........xxxxxxxx' }, fillEvery: 8, v: { k: .24, h: .016 } } } },
  boss2: { bpm: 168, spb: 12,
    chords: ['Am', 'E', 'Am', 'Dm', 'F', 'E', 'Am', 'E', 'Dm', 'Am', 'E', 'Am', 'F', 'E', 'Am', 'E'],
    lead: ['E5:4 A5:4 C6:4', 'B5:8 G#5:4', 'A5:4 C6:4 E6:4', 'F6:8 D6:4', 'C6:4 F6:4 A6:4', 'G#6:8 E6:4', 'A6:4 E6:4 C6:4', 'B5:12', 'D6:4 F6:4 A6:4', 'C6:8 A5:4', 'B5:4 G#5:4 E5:4', 'A5:4 C6:4 E6:4', 'F6:4 E6:4 D6:4', 'E6:4 G#6:4 B6:4', 'A6:8 E6:4', 'E5:4 r:8'],
    layers: { bass: { pat: 'r...........', len: 3.5, vol: .22 }, stab: { pat: '....x...x...', vol: .02, len: .9 },
      lead: { wave: 'p50', vol: .045, vib: true, len: .9, alt: { wave: 'triangle', vol: .08, len: .7, echo: true, oct: 12 } },
      drums: { k: 'x...........', h: '....x...x...', r: '..........x.', v: { h: .014, r: .06 } } } },
  endless1: { bpm: 146,
    chords: ['Bm', 'G', 'D', 'A', 'Bm', 'G', 'Em', 'F#'],
    lead: ['F#5:2 B5:2 D6:2 F#6:2 E6:4 D6:4', 'B5:4 D6:2 G6:2 F#6:4 D6:4', 'A5:2 D6:2 F#6:2 A6:2 G6:2 F#6:2 E6:4', 'C#6:8 E6:4 A5:4', 'D6:2 C#6:2 B5:2 F#5:2 B5:4 D6:4', 'G6:4 F#6:2 E6:2 D6:4 B5:4', 'E6:2 G6:2 B6:4 A6:2 G6:2 E6:4', 'F#6:4 A#5:4 C#6:4 F#6:4'],
    layers: { bass: { pat: 'r.r.r.r.r.r.r.r.', len: .9, vol: .2, layer2: { wave: 'p12', vol: .02, iv: 0 } }, arp: { wave: 'p12', oct: 5, seq: [0, 1, 2, 1], vol: .015 }, pad: { wave: 'p50', oct: 3, vol: .007, att: .2, from: 4 },
      lead: { wave: 'p25', vol: .05, vib: true, len: .85, alt: { wave: 'p25', vol: .05, vib: true, len: .85, echo: true, double: { wave: 'triangle', iv: -12, vol: .045 } } },
      drums: { k: 'x.....x.x.....x.', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', fill: { s: '....x.......x.xx' }, v: { h: .014 } } } },
  endless2: { bpm: 140,
    chords: ['Eb', 'Bb', 'Cm', 'Ab', 'Eb', 'Bb', 'Ab', 'Bb'],
    lead: ['G5:2 Bb5:2 Eb6:4 G6:4 F6:2 Eb6:2', 'D6:4 F6:4 Bb6:8', 'C6:2 Eb6:2 G6:4 F6:2 Eb6:2 D6:2 C6:2', 'Eb6:8 C6:4 Ab5:4', 'Bb5:2 Eb6:2 G6:2 Bb6:2 Ab6:4 G6:4', 'F6:4 D6:2 Bb5:2 F6:4 Bb6:4', 'C7:4 Bb6:2 Ab6:2 G6:4 F6:4', 'F6:2 G6:2 Ab6:2 Bb6:2 D7:8'],
    layers: { bass: { pat: 'r..r..r.r..r..r.', len: 1.4, vol: .22 }, stab: { pat: '..x...x...x...x.', vol: .014 }, arp: { wave: 'p12', oct: 5, every: 2, seq: [0, 1, 2, 1], vol: .02, echo: true },
      lead: { wave: 'p50', vol: .045, vib: true, len: .85, alt: { wave: 'p25', vol: .05, vib: true, len: .9, double: { wave: 'p12', iv: -12, vol: .03 } } },
      drums: { k: 'x.......x.x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', o: '......x.......x.', fill: { t: '............xxxx' }, fillEvery: 8, v: { h: .014 } } } },
  pick1: { bpm: 90,
    chords: ['Cm7', 'Ab', 'Fm7', 'G'], lead: ['r:16', 'r:16', 'r:16', 'r:16'],
    layers: { bass: { wave: 'sine', pat: 'r.........r.....', len: 5, vol: .16 }, pad: { wave: 'triangle', oct: 4, vol: .015, att: .02 },
      drums: { k: 'x......x..x.....', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx', v: { h: .006, s: .06, k: .22 } } } },
  pick2: { bpm: 110,
    chords: ['F', 'G', 'Em', 'Am'], lead: ['r:16', 'r:16', 'r:16', 'r:16'],
    layers: { bass: { pat: 'r.......r...r...', len: 2, vol: .14 }, arp: { wave: 'sine', oct: 6, every: 4, seq: [0, 2, 1, 2], vol: .025, echo: true, len: 2 },
      drums: { k: 'x.......x.......', r: '....x.......x..x', h: '..x...x...x...x.', v: { h: .012 } } } },
};
for (const k in MORE_TRACKS) {
  const T = TRACKS[k] = MORE_TRACKS[k];
  T.bars = T.lead.map(parseBar); T.spb = T.spb || 16;
  // 8-bar melodies play twice: plain first, then the variation (alt lead)
  if (T.bars.length === 8 && !k.startsWith('pick')) T.bars = T.bars.concat(T.bars);
}
const DK = { k: 'kick', s: 'snare', h: 'hat', o: 'ohat', t: 'tom', c: 'clap', r: 'rim' };
const DV = { k: .3, s: .13, h: .018, o: .02, t: .2, c: .09, r: .08 };
function arrStep(T, bar, s, t, sd) {
  const L = T.layers, spb = T.spb, chord = T.chords[bar % T.chords.length], half = bar >= T.bars.length / 2;
  const bassNote = (ch, st, root) => st === 'f' ? root + 7 : st === 'o' ? root + 12 : st === 't' ? ch[1] : st === 'l' ? root - 12 : root;
  if (L.bass) {
    const b = L.bass, st = b.pat[s];
    if (st && st !== '.') {
      const ch = chordMidis(chord, b.oct ?? 2), m = bassNote(ch, st, ch[0]);
      inst(b.wave || 'triangle', hz(m), t, sd * (b.len || 1.6), b.vol ?? .2, { sus: b.sus ?? .55, rel: .04 });
      if (b.layer2) inst(b.layer2.wave, hz(m + (b.layer2.iv || 0)), t, sd * (b.len || 1.6) * .8, b.layer2.vol, { sus: .4, rel: .03 });
    }
  }
  if (L.stab && L.stab.pat[s] === 'x') { const c = chordMidis(chord, L.stab.oct ?? 4); for (const m of c.slice(0, 3)) inst(L.stab.wave || 'p25', hz(m), t, sd * (L.stab.len || .7), L.stab.vol ?? .016, { sus: .3, dec: .03, rel: .02 }); }
  if (L.arp && bar >= (L.arp.from || 0) && s % (L.arp.every || 1) === 0) {
    const c = chordMidis(chord, L.arp.oct ?? 5), seq = L.arp.seq || [0, 1, 2, 1], idx = seq[Math.floor(s / (L.arp.every || 1)) % seq.length];
    inst(L.arp.wave || 'p12', hz(c[idx % c.length] + 12 * Math.floor(idx / c.length)), t, sd * (L.arp.len || .8), L.arp.vol ?? .03, { echo: L.arp.echo, sus: .25, dec: .05, rel: .06 });
  }
  if (L.pad && s === 0 && bar >= (L.pad.from || 0)) for (const m of chordMidis(chord, L.pad.oct ?? 4)) inst(L.pad.wave || 'sine', hz(m), t, sd * spb * .95, L.pad.vol ?? .02, { att: L.pad.att ?? .2, sus: .9, rel: .3, vib: L.pad.vib });
  if (L.lead) {
    const ld = half && L.lead.alt ? L.lead.alt : L.lead;
    for (const e of T.bars[bar]) if (e.at === s) {
      inst(ld.wave, hz(e.m + (ld.oct || 0)), t, sd * e.len * (ld.len || .9), ld.vol, { vib: ld.vib && e.len >= 4, echo: ld.echo, sus: ld.sus ?? .7, dec: ld.dec ?? .08, att: ld.att ?? .01, rel: ld.rel ?? .06 });
      if (ld.double) inst(ld.double.wave, hz(e.m + (ld.oct || 0) + ld.double.iv), t, sd * e.len * (ld.len || .9), ld.double.vol, { sus: .6, rel: .05 });
    }
  }
  const D = L.drums;
  if (D && bar >= (D.from || 0)) {
    const fe = D.fillEvery || 4, fill = D.fill && bar % fe === fe - 1;
    for (const k in DK) { const pat = (fill && D.fill[k]) || D[k]; const ch = pat && pat[s]; if (ch && ch !== '.') drum(DK[k], t, ((D.v && D.v[k]) || DV[k]) * (ch === 'X' ? 1.4 : ch === 'x' ? 1 : .55)); }
  }
  if (T.extra) T.extra(bar, s, t, sd);
}
const BGM_POOL = {
  title: ['title', 'title1', 'title2'], battle: ['battle', 'battle1', 'battle2a'], battle2: ['battle2', 'battle21', 'battle22'],
  boss: ['boss', 'boss1', 'boss2'], endless: ['mix', 'endless1', 'endless2'], pick: ['pick', 'pick1', 'pick2'],
};
function rollBgm(only) { G.bgm = G.bgm || {}; for (const k in BGM_POOL) if (!only || k === only) G.bgm[k] = BGM_POOL[k][Math.floor(Math.random() * 3)]; }
rollBgm();

const BGM = { cur: null, bus: null, step: 0, next: 0, waves: null, music: null, echo: null, duck: 1 };
function bgmInit() {
  const ac = AU.ac; if (!ac || BGM.music) return;
  BGM.music = ac.createGain(); BGM.music.gain.value = .55; BGM.music.connect(AU.master);
  const d = ac.createDelay(1), fb = ac.createGain(), wet = ac.createGain();
  d.delayTime.value = .27; fb.gain.value = .32; wet.gain.value = .45;
  d.connect(fb); fb.connect(d); d.connect(wet); wet.connect(BGM.music);
  BGM.echo = d;
  const pulse = duty => { const n = 40, re = new Float32Array(n), im = new Float32Array(n); for (let i = 1; i < n; i++) re[i] = 2 / (i * Math.PI) * Math.sin(i * Math.PI * duty); return ac.createPeriodicWave(re, im); };
  BGM.waves = { p12: pulse(.125), p25: pulse(.25), p50: pulse(.5) };
}
function inst(kind, f, t, dur, vol, o = {}) {
  const ac = AU.ac, osc = ac.createOscillator(), g = ac.createGain();
  if (BGM.waves[kind]) osc.setPeriodicWave(BGM.waves[kind]); else osc.type = kind;
  osc.frequency.setValueAtTime(f, t);
  if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
  const att = o.att ?? .006, rel = o.rel ?? .04, sus = o.sus ?? .7;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + att);
  g.gain.setTargetAtTime(vol * sus, t + att, o.dec ?? .08);
  g.gain.setValueAtTime(vol * sus, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + rel);
  if (o.vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * .01, t + .25); l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + dur + rel + .05); }
  osc.connect(g); g.connect(o.dest || BGM.bus); if (o.echo) g.connect(BGM.echo);
  osc.start(t); osc.stop(t + dur + rel + .05);
}
function noise(t, vol, type, freq, len) {
  const ac = AU.ac, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = AU.nbuf; f.type = type; f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + len);
  s.connect(f); f.connect(g); g.connect(BGM.bus); s.start(t, Math.random() * .5); s.stop(t + len + .02);
}
function drum(kind, t, vol) {
  const ac = AU.ac;
  if (kind === 'clap') { noise(t, vol, 'bandpass', 1200, .05); noise(t + .012, vol * .8, 'bandpass', 1200, .09); return; }
  if (kind === 'rim') { noise(t, vol, 'highpass', 3000, .02); inst('square', 1700, t, .015, vol * .25, { rel: .01, sus: .1 }); return; }
  if (kind === 'kick') { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .14); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + .2); o.connect(g); g.connect(BGM.bus); o.start(t); o.stop(t + .22); return; }
  if (kind === 'tom') { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(90, t + .16); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + .18); o.connect(g); g.connect(BGM.bus); o.start(t); o.stop(t + .2); return; }
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = AU.nbuf; f.type = kind === 'snare' ? 'bandpass' : 'highpass'; f.frequency.value = kind === 'snare' ? 1900 : 7000;
  const len = kind === 'snare' ? .13 : kind === 'ohat' ? .12 : .035;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + len);
  s.connect(f); f.connect(g); g.connect(BGM.bus); s.start(t, Math.random() * .5); s.stop(t + len + .02);
  if (kind === 'snare') inst('triangle', 190, t, .05, vol * .6, { rel: .05, sus: .2, dec: .03 });
}
function playStep(name, step, t) {
  const T = TRACKS[name], spb = T.spb || 16, sd = 60 / T.bpm / 4, bar = Math.floor(step / spb) % T.bars.length, s = step % spb;
  if (T.layers) { arrStep(T, bar, s, t, sd); return; }
  const chord = T.chords[bar], lead = T.bars[bar];
  if (name === 'title') {
    const root = chordMidis(chord, 2)[0];
    if (s === 0) inst('triangle', hz(root), t, sd * 7, .2, { rel: .15 });
    if (s === 8) inst('triangle', hz(root + 7), t, sd * 6, .16, { rel: .15 });
    if (s % 2 === 0) { const c = chordMidis(chord, 5), seq = [0, 1, 2, 1, 0, 2, 1, 2]; inst('p12', hz(c[seq[s / 2]] ), t, sd * .9, .035, { echo: true, sus: .2, dec: .05, rel: .08 }); }
    for (const e of lead) if (e.at === s) inst('p25', hz(e.m), t, sd * e.len * .95, .055, { vib: e.len >= 4, att: .015, sus: .75, rel: .09 });
    if (bar >= 8 && s === 0) { const c = chordMidis(chord, 5); inst('sine', hz(c[1] + 12), t, sd * 14, .035, { att: .25, sus: .9, rel: .3 }); }
    if (bar >= 4 && s % 4 === 2) drum('hat', t, .018);
    if (bar >= 8 && s === 0) drum('kick', t, .2);
  } else if (name === 'battle') {
    const ch = chordMidis(chord, 2), root = ch[0];
    const bass = { 0: root, 4: root + 7, 8: root, 12: root + 7, 14: root + 12 };
    if (bass[s] !== undefined) inst('triangle', hz(bass[s]), t, sd * (s === 14 ? .9 : 1.6), .22, { sus: .5, rel: .03 });
    if (s % 4 === 2) { const c = chordMidis(chord, 4); for (const m of c.slice(0, 3)) inst('p25', hz(m), t, sd * .7, .016, { sus: .3, dec: .03, rel: .02 }); }
    const lk = bar < 8 ? 'p50' : 'triangle';
    for (const e of lead) if (e.at === s) inst(lk, hz(e.m), t, sd * e.len * (bar < 8 ? .7 : .55), bar < 8 ? .045 : .09, { sus: bar < 8 ? .6 : .15, dec: bar < 8 ? .08 : .05, rel: .05, echo: bar >= 8 });
    if (s === 0 || s === 8 || (s === 10 && bar % 2)) drum('kick', t, .32);
    if (s === 4 || s === 12) drum('snare', t, .14);
    if (bar >= 8 ? true : s % 2 === 0) drum(s % 4 === 2 ? 'ohat' : 'hat', t, s % 2 ? .012 : .022);
    if ((bar === 7 || bar === 15) && s === 12) inst('sine', hz(midiOf('C6')), t, sd * 3, .05, { slide: hz(midiOf('G6')), sus: .9, rel: .05 });
  } else if (name === 'battle2') {
    // tougher floors: minor key, driving bass, rolling arps, fills at the end of each phrase
    const ch = chordMidis(chord, 2), root = ch[0];
    if (s % 2 === 0) { inst('triangle', hz(s % 4 === 2 ? root + 12 : root), t, sd * 1.4, .2, { sus: .6, rel: .03 }); inst('p12', hz(root), t, sd * .9, .02, { sus: .3, rel: .02 }); }
    const c = chordMidis(chord, 4), seq = [0, 1, 2, 1];
    inst('p12', hz(c[seq[s % 4]] + 12), t, sd * .6, .016, { sus: .25, rel: .02 });
    for (const e of lead) if (e.at === s) inst('p25', hz(e.m), t, sd * e.len * .8, .05, { vib: e.len >= 4, sus: .7, rel: .05, echo: bar >= 8 });
    if (bar >= 8) for (const e of lead) if (e.at === s) inst('triangle', hz(e.m - 12), t, sd * e.len * .6, .05, { sus: .5, rel: .04 });
    if (s === 0 || s === 6 || s === 8 || s === 11) drum('kick', t, .3);
    if (s === 4 || s === 12) drum('snare', t, .14);
    if (bar % 4 === 3 && s >= 13) drum('snare', t, .08);
    drum(s % 4 === 2 ? 'ohat' : 'hat', t, s % 2 ? .01 : .018);
  } else if (name === 'pick') {
    // a light, magical groove while choosing runes
    if (s === 0 || s === 10) drum('kick', t, .2);
    if (s === 4 || s === 12) drum('snare', t, .05);
    if (s % 2 === 0) drum('hat', t, s % 4 === 0 ? .014 : .009);
    if (s === 14 && bar === 1) drum('ohat', t, .02);
    if (s === 0) inst('triangle', hz(midiOf(bar ? 'A1' : 'C2')), t, sd * 3, .12, { sus: .4, rel: .1 });
    if (s === 0 && bar === 0) inst('sine', hz(midiOf('E6')), t, sd * 2, .025, { echo: true, sus: .3, rel: .2 });
    if (s === 8 && bar === 1) inst('sine', hz(midiOf('G6')), t, sd * 2, .022, { echo: true, sus: .3, rel: .2 });
  } else {
    const ch = chordMidis(chord, 2), root = ch[0];
    if (s === 0) for (const m of chordMidis(chord, 3)) inst('p50', hz(m), t, sd * 15, .009, { att: .08, sus: .9, rel: .15 });
    if (bar >= 8) for (const e of lead) if (e.at === s) inst('triangle', hz(e.m - 12), t, sd * e.len * .8, .06, { sus: .6, rel: .05 });
    if (s % 2 === 0) inst('triangle', hz(s % 8 === 6 ? root + 12 : root), t, sd * 1.5, .22, { sus: .6, rel: .03 });
    if (s % 2 === 1) { const c = chordMidis(chord, 4), seq = [0, 1, 2, 1, 2, 0, 1, 2]; inst('p12', hz(c[seq[(s - 1) / 2]] + 12), t, sd * .8, .022, { sus: .3, rel: .02 }); }
    for (const e of lead) if (e.at === s) inst('p25', hz(e.m), t, sd * e.len * .85, .05, { vib: e.len >= 4, sus: .7, rel: .05 });
    if (s % 4 === 0) drum('kick', t, .3);
    if (s === 4 || s === 12) drum('snare', t, .14);
    drum('hat', t, s % 2 ? .01 : .016);
    if ((bar === 7 || bar === 15) && s >= 12) drum('tom', t, .2);
  }
}
function bgmPlay(name) {
  if (!AU.ac || BGM.cur === name) return;
  bgmInit();
  const ac = AU.ac, now = ac.currentTime;
  if (BGM.bus) { const old = BGM.bus; old.gain.cancelScheduledValues(now); old.gain.setValueAtTime(old.gain.value, now); old.gain.linearRampToValueAtTime(0, now + 1); setTimeout(() => old.disconnect(), 2500); }
  BGM.bus = ac.createGain(); BGM.bus.gain.setValueAtTime(0, now); BGM.bus.gain.linearRampToValueAtTime(1, now + .9); BGM.bus.connect(BGM.music);
  BGM.cur = name; BGM.step = 0; BGM.next = now + .15;
}
function bgmCut() {
  if (!BGM.cur || !AU.ac) return;
  const now = AU.ac.currentTime, old = BGM.bus;
  old.gain.cancelScheduledValues(now); old.gain.setValueAtTime(old.gain.value, now); old.gain.linearRampToValueAtTime(0, now + .2);
  setTimeout(() => old.disconnect(), 800);
  BGM.cur = null; BGM.bus = null;
}
// level cleared: a soft, sparkling "the magic answers" jingle in G major
function playClearJingle() {
  if (!AU.ac || AU.muted) return;
  bgmInit(); bgmCut();
  const ac = AU.ac, t0 = ac.currentTime + .05, dest = BGM.music;
  const up = ['G5', 'B5', 'D6', 'G6', 'B6', 'D7'];
  up.forEach((n, i) => { const t = t0 + i * .085; inst('sine', hz(midiOf(n)), t, .5, .06, { dest, echo: true, sus: .4, rel: .3 }); inst('p12', hz(midiOf(n)), t, .08, .02, { dest, sus: .2, rel: .05 }); });
  const pent = ['G6', 'A6', 'B6', 'D7', 'E7', 'G7'];
  for (let i = 0; i < 9; i++) inst('triangle', hz(midiOf(pent[(i * 4) % pent.length])), t0 + .55 + i * .11 + Math.random() * .03, .12, .025, { dest, echo: true, sus: .2, rel: .1 });
  for (const n of ['G4', 'B4', 'D5', 'G5']) inst('sine', hz(midiOf(n)), t0 + .5, 1.6, .045, { dest, att: .12, sus: .85, rel: .8, vib: true });
  inst('triangle', hz(midiOf('G3')), t0 + .5, 1.4, .06, { dest, att: .05, sus: .7, rel: .6 });
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = AU.nbuf; f.type = 'highpass'; f.frequency.setValueAtTime(3000, t0); f.frequency.exponentialRampToValueAtTime(11000, t0 + 1.4);
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.025, t0 + .4); g.gain.exponentialRampToValueAtTime(.001, t0 + 1.6);
  s.connect(f); f.connect(g); g.connect(dest); s.start(t0); s.stop(t0 + 1.7);
}
setInterval(() => {
  if (!AU.ac || !BGM.cur || AU.ac.state !== 'running') return;
  const ac = AU.ac, T = TRACKS[BGM.cur], sd = 60 / T.bpm / 4;
  if (BGM.next < ac.currentTime - .5) BGM.next = ac.currentTime + .05;
  while (BGM.next < ac.currentTime + .15) { playStep(BGM.cur, BGM.step, BGM.next); BGM.next += sd; BGM.step = (BGM.step + 1) % (T.bars.length * (T.spb || 16)); }
}, 25);
function bgmUpdate() {
  if (!AU.ac) return;
  let want;
  if (G.menuScene || G.state === 'over' || G.state === 'win') want = 'title';
  else if (G.state === 'comic') want = comic && comic.key === 'boss' ? 'boss' : comic && comic.key === 'finale' ? 'title' : 'pick';
  else if (G.state === 'pick') want = 'pick';
  else if (G.state === 'clear' || G.state === 'npc' || G.state === 'dead') want = null;
  else if (G.endless) want = curLevel().variant === 'elite' ? 'boss' : G.bgm.endless === 'mix' ? (G.loop <= 2 ? 'battle' : 'battle2') : 'endless';
  else if (G.level === LEVELS.length - 1) want = 'boss';
  else want = G.level >= 4 ? 'battle2' : 'battle';
  if (want) want = G.bgm[want];
  if (want) bgmPlay(want); else bgmCut();
  if (BGM.music) { const duck = G.paused ? .35 : 1; if (Math.abs(duck - BGM.duck) > .01) { BGM.duck = duck; BGM.music.gain.setTargetAtTime(.55 * duck, AU.ac.currentTime, .2); } }
}

/* ================= the kind ghost after floor 6 ================= */
const GHOST_PAL = { k: '#2a3a52', w: '#f0fcff', c: '#a8e8ff', x: '#ffffff', e: '#1d2a3a', q: '#ffb3c6' };
const GHOST_ROWS = [
  '....kkkkkk....',
  '...kwwwwwwk...',
  '..kwwwwwwwwk..',
  '.kwwwwwwwwwwk.',
  '.kwweewweewwk.',
  '.kwwexwwexwwk.',
  '.kwwwwwwwwwwk.',
  '.kwqwwewewqwk.',
  '.kwwwwweewwwk.',
  '.kcwwwwwwwwck.',
  '.kccwwwwwwcck.',
  '.kcccwwwwccck.',
  '..kcckcckcck..',
  '...kk.kk.kk...',
];
let GHOST_SPR = null;
const GHOST_LINES = [
  '哎呀，别紧张！我不是坏幽灵……只是在这片麦田里迷路了很久很久。',
  '我看了你一路的战斗，真了不起——就是放法术的时候表情有点凶。',
  '这些是我生前收集的遗物，送你一件吧。只能挑一件哦，贪心的人会被麦浪绊倒的。',
];
function startGhostEvent() {
  if (!GHOST_SPR) GHOST_SPR = spr(GHOST_ROWS, GHOST_PAL);
  G.state = 'npc'; G.cine = true;
  const x = clamp(player.x + 36, 20, arena.w - 20), y = clamp(player.y - 4, 30, arena.h - 20);
  G.npc = { x, y, z: 8, h: 18, t: 0, alpha: 0, leaving: false, talked: false };
  G.camFocus = { x: (player.x + x) / 2, y: player.y - 12 };
  AU.tone(660, .6, 'sine', .08, 990); AU.tone(990, .8, 'sine', .05, 1320, .2); AU.noise(.8, .04, 6000, 9000, 2);
  for (let i = 0; i < 24; i++) { const a = rand(TAU); addPart(x, y, 10, Math.cos(a) * 40, Math.sin(a) * 30, rand(10, 50), rand(.5, 1), ['#ffffff', '#a8e8ff'], 1, { add: true, drag: 2 }); }
}
function updateNpc(dt) {
  const n = G.npc; if (!n) return;
  n.t += dt; n.z = 8 + Math.sin(n.t * 2.2) * 2.5;
  n.alpha = n.leaving ? Math.max(0, n.alpha - dt * .8) : Math.min(1, n.alpha + dt * 1.5);
  if (Math.random() < dt * 8) addPart(n.x + rand(-6, 6), n.y, n.z + rand(0, 14), rand(-6, 6), 0, rand(10, 25), rand(.6, 1.2), ['#ffffff', '#a8e8ff'], 1, { add: true });
  if (!n.talked && n.t > 1.2) { n.talked = true; if (n.onTalk) n.onTalk(); else openDialog(GHOST_LINES, () => openPick('ghost')); }
  if (n.leaving && n.alpha <= 0) G.npc = null;
}
function drawGhostNpc() {
  const n = G.npc; if (!n) return;
  drawShadow(n.x, n.y, 12, n.z);
  ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = true;
  ctx.globalAlpha = .45 * n.alpha; ctx.drawImage(glowTex(n.glow || '#a8e8ff'), n.x - 22, n.y - n.z - 30, 44, 44);
  ctx.imageSmoothingEnabled = false; ctx.globalCompositeOperation = 'source-over';
  drawSpr(n.spr || GHOST_SPR, n.x, n.y - n.z, { alpha: n.alpha * (.85 + Math.sin(n.t * 3) * .1), flip: player.x > n.x, sx: 1 + Math.sin(n.t * 2.2) * .04, sy: 1 - Math.sin(n.t * 2.2) * .04 });
  ctx.globalAlpha = 1;
}
function ghostFarewell(done) {
  const n = G.npc;
  if (n) { say(n, '祝你好运，星尘法师！', { force: true, max: 2 }); setTimeout(() => { if (G.npc) G.npc.leaving = true; AU.tone(990, .6, 'sine', .06, 660); }, 1100); }
  setTimeout(() => { G.cine = false; G.camFocus = null; done(); }, n ? 2300 : 0);
}

/* ---- dialogue box ---- */
let dlg = null;
function openDialog(lines, onDone, who) {
  const c = $('dlg-face').getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, 24, 24); c.drawImage(((who && who.spr) || GHOST_SPR).c, 5, 5);
  const nm = document.querySelector('.dlg-name'); nm.textContent = (who && who.name) || '善良的亡魂'; nm.style.color = (who && who.col) || '#a8e8ff';
  dlg = { lines, i: 0, typed: 0, onDone, t: 0 };
  $('dlg-text').textContent = ''; $('dialog').hidden = false;
  setTimeout(() => $('dialog').classList.add('on'), 20);
}
function dialogInput() {
  if (!dlg || dlg.t < .25) return;
  const line = dlg.lines[dlg.i];
  if (dlg.typed < line.length) { dlg.typed = line.length; return; }
  dlg.i++; dlg.typed = 0; dlg.t = 0;
  AU.tone(880, .05, 'square', .03);
  if (dlg.i >= dlg.lines.length) {
    const cb = dlg.onDone; dlg = null;
    $('dialog').classList.remove('on'); setTimeout(() => { if (!dlg) $('dialog').hidden = true; }, 300);
    cb();
  }
}
function updateDialog(dt) {
  if (!dlg) return;
  dlg.t += dt;
  const line = dlg.lines[dlg.i], before = Math.floor(dlg.typed);
  dlg.typed = Math.min(line.length, dlg.typed + dt * 26);
  if (Math.floor(dlg.typed) > before && AU.gate('dlgtype', 55)) AU.tone(rand(700, 900), .03, 'triangle', .03);
  const shown = line.slice(0, Math.floor(dlg.typed));
  if ($('dlg-text').dataset.s !== shown) { $('dlg-text').dataset.s = shown; $('dlg-text').textContent = shown; }
  $('dialog').classList.toggle('done', dlg.typed >= line.length);
}
$('dialog').addEventListener('pointerdown', e => { e.preventDefault(); dialogInput(); });

try { AU.unlock(); } catch (e) {}
$('reroll-btn').addEventListener('click', () => { AU.unlock(); reroll(); });
