# Neural Nexus — Audio Assets

This folder holds the five Ogg Vorbis buffers the Neural View's `useAudio`
hook preloads on the first user gesture. The files currently in this
directory are **empty placeholders** — the hook detects that and falls
back to **procedural synthesis** (Web Audio `OfflineAudioContext`) so
every sound has audible output out of the box. Drop real OGG files in
with the exact same filenames and a hard reload is all that's needed —
the fetch path takes precedence over the synth fallback.

## Files

| Filename               | Length       | Loop? | Purpose                                                      | Target peak  |
| ---------------------- | ------------ | :---: | ------------------------------------------------------------ | ------------ |
| `ambient-drone.ogg`    | 8 s seamless | Yes   | Deep sub + breathy upper harmonics. Crossfades over 600 ms.  | -18 dBFS RMS |
| `hover-blip.ogg`       | ~80 ms       | No    | Single short 1200 Hz ping / tick. Fires on neuron hover.     | -10 dBFS     |
| `select-chime.ogg`     | ~220 ms      | No    | Two-note downward chord. Fires on neuron click.              | -8 dBFS      |
| `fire-whoosh.ogg`      | ~350 ms      | No    | Fast air-rush + short tail. Fires alongside `select-chime`.  | -8 dBFS      |
| `unlock-chord.ogg`     | ~900 ms      | No    | Rich 5-note rising arpeggio. Fires on hidden-neuron unlock.  | -6 dBFS      |

All files should be:

- **Format**: Ogg Vorbis, mono or stereo (mono preferred for `hover-blip`)
- **Sample rate**: 44.1 kHz or 48 kHz
- **Size budget**: ≤ 40 KB each (≤ 100 KB for `ambient-drone`) — total under ~200 KB
- **Headroom**: Normalised to the peak listed above (so the hook's gain
  structure doesn't clip)
- **Silence handling**: `ambient-drone` must loop seamlessly — trim any
  leading/trailing silence and ensure the last sample matches the first

## Routing in the hook

```
ambient-drone → droneGain ─┐
                            ├─► masterGain ► destination
FX (up to 5 voices) ────────┘
```

- `masterGain` = 0 when the user toggles mute OR `prefers-reduced-motion`
  is set. Smooth 200 ms ramp.
- `droneGain` holds at 0.5, dips to 0.22 for ~250 ms whenever an FX
  plays (ducking), then ramps back. Gives the FX air to cut through.

## Generating silent placeholders manually

If you want non-zero placeholder files (e.g. to verify routing without
supplying real audio), the simplest path is `ffmpeg`:

```bash
for name in ambient-drone hover-blip select-chime fire-whoosh unlock-chord; do
  ffmpeg -f lavfi -i "anullsrc=r=44100:cl=mono" -t 0.1 \
         -c:a libvorbis -q:a 2 -y "$name.ogg"
done
```

Any of those replaced with a real OGG of the same name will Just Work on
next page load — `useAudio` does a shallow `fetch` + `decodeAudioData`
and caches the resulting `AudioBuffer`.
