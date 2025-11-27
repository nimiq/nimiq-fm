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
  Generative music driven by the Nimiq blockchain
</p>

<p align="center">
  <strong>⚠️ This is the 2024 version. Check the <a href="https://github.com/nimiq/nimiq-fm/tree/main">main branch</a> for the latest version.</strong>
</p>

---

## How It Works

The app listens to Nimiq blockchain events via SSE. Each new block triggers a musical pattern generated from the block data.

1. **Block events** - SSE stream delivers real-time block data
2. **Pattern generation** - Block data feeds into [Strudel](https://strudel.cc/) patterns that define melody, bass, and drums
3. **Dynamic music** - Each block produces unique generative music

## Development

```bash
pnpm install
pnpm dev
```

## Tech Stack

- **Nuxt** - Vue framework
- **Strudel** - Live coding music patterns
- **NuxtHub** - Deployment
