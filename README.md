# Nimiq Song

[![CI](https://github.com/nimiq/song/actions/workflows/ci.yml/badge.svg)](https://github.com/nimiq/song/actions/workflows/ci.yml)

**Blockchain-driven audio-visual experience.**
Real-time music and 3D visualizations generated from Nimiq blockchain data.

## What is this?

Each block on the Nimiq blockchain creates unique audio patterns and 3D orb visualizations. Block data becomes music through algorithmic composition - transactions, validators, and block numbers drive melody, rhythm, and visual effects.

## How it works

- **Audio**: [Strudel](https://strudel.cc/) synthesizes music from blockchain data. Block digits generate melodies, batch numbers select harmonic patterns, and block numbers drive drum progression.
- **Visuals (The Orb)**: [TresJS](https://tresjs.org/) renders a live 3D visualization of the Nimiq network. The "Orb" is composed of two distinct node types representing the network topology:
    - **Validators** (Large Nodes): The backbone of the network. They generate blocks approximately every second, visible as **energy beams** shooting out when a block is produced.
    - **Web Clients** (Small Nodes): Transient peers that join and leave the network. They appear and disappear continuously, simulating the organic activity of clients **connecting and disconnecting**.
    
    The entire structure pulses with the music, with the graph geometry reacting to audio frequencies.
- **Data**: Nimiq RPC client fetches blocks in real-time, transforming them into digits and patterns for the audio/visual engines.

## Tech Stack

- **Framework**: [Nuxt 4](https://nuxt.com/) (Vue 3)
- **Language**: TypeScript
- **Audio Synthesis**: [Strudel](https://strudel.cc/)
- **3D Rendering**: [TresJS](https://tresjs.org/) + [Three.js](https://threejs.org/)
- **Blockchain Data**: [Nimiq RPC Client](https://github.com/nimiq/rpc-client-ts)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + [Nuxt UI](https://ui.nuxt.com/)
- **Deployment**: [NuxtHub](https://hub.nuxt.com/)

## Project Structure

```bash
app/
├── components/   # Vue components (Visuals, UI overlay, etc.)
├── composables/  # Shared logic (Blockchain state, Audio engine)
├── songs/        # Algorithmic song definitions
├── pages/        # Application routes
├── types/        # TypeScript interfaces
└── utils/        # Helper functions (Audio simulation, graph gen)
server/
└── routes/       # Server-side API endpoints
```

## Development

### Prerequisites

- Node.js (v24 recommended)
- pnpm

### Setup

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

### Quality Assurance

Run linter:

```bash
pnpm lint
```

Run type checking:

```bash
pnpm typecheck
```

## Create your own song

Songs are functions in `app/songs/` that receive blockchain data and return Strudel patterns.

1.  Create a new file in `app/songs/` (e.g., `mysong.ts`).
2.  Export a function that accepts `digits`, `batch`, and `blockNumber`.

```typescript
import { note, sound, stack } from '@strudel/web'

export function mySong(digits: number[], batch: number, blockNumber: number) {
  // digits: array of numbers from block data
  // batch: current batch number
  // blockNumber: current block number

  // Use digits to create a seed for melody
  const seedSequence = digits.join(' ')

  const melody = note(seedSequence)
    .transpose(20)
    .scale('c:major')
    .s('sawtooth')

  // Use block info for rhythm
  const drums = sound('bd*4, hh*8')

  return stack(melody, drums)
}
```

3.  Add your song to the song selector (currently manual registration may be required in `app/composables/useStrudel.ts` or the UI component).

**Strudel Documentation**: [https://strudel.cc/learn/](https://strudel.cc/learn/)

## Contributing

Contributions are welcome! Feel free to submit PRs to create new songs, improve visualizations, or optimize performance.