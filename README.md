<p align="center">
  <a href="https://nimiq.fm" target="_blank">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset=".github/logo-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset=".github/logo-light.svg">
      <img alt="Nimiq" src=".github/logo-light.svg" width="186" height="32" style="max-width: 100%;">
    </picture>
  </a>
</p>

<p align="center">
  Generative music driven by the Nimiq blockchain<br>
  <a href="https://nimiq.fm">nimiq.fm</a>
</p>

---

## How It Works

The app listens to Nimiq blockchain events via SSE. Each new block triggers a musical pattern generated from the block producer's validator address.

1. **Block events** - SSE stream from `/blocks` delivers real-time block data
2. **Address hashing** - Validator address is hashed into digits using `identicons-esm`
3. **Pattern generation** - Digits feed into [Strudel](https://strudel.cc/) patterns that define melody, bass, and drums
4. **Song rotation** - Songs cycle every 3 batches (5 songs total: Milky Way, Acid, Desert Dune, Running Away, Qimin)
5. **Dynamic transitions** - Filter sweeps on batch boundaries create smooth song transitions

## Adding Songs

Create a new file in `app/utils/songs/`:

```ts
// app/utils/songs/my-song.ts
import { note, sound, stack } from '@strudel/web'

export function mySong(digits: number[], batch: number, blockNumber: number) {
  const seedSequence = digits.join(' ')

  const melody = note(seedSequence).transpose(20).scale('c:major').seg(8).s('sawtooth')
  const bass = note('<c0 g0>/2').seg(8).s('triangle')
  const drums = sound('bd(3,8)')

  return stack(melody, bass, drums)
}
```

Then register it in `app/utils/song.ts`:

1. Add to `SongName` type
2. Add to `SONG_LIST` array
3. Add import case in `loadSong()`

## Development

```bash
pnpm install
pnpm dev
```

## Tech Stack

- **Nuxt 4** - Vue framework
- **Strudel** - Live coding music patterns
- **TresJS** - Three.js for Vue (orb visualization)
- **NuxtHub** - Deployment
