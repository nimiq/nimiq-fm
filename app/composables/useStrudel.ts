let scheduler: any = null
let isInitialized = false
let initPromise: Promise<void> | null = null

export function useStrudel() {
  // Initialize Strudel library and create patterns (client-side only)
  // This will wait for first user interaction to load AudioWorklet modules
  const init = async () => {
    if (!import.meta.client)
      return

    // Return existing promise if initialization is in progress
    if (initPromise)
      return initPromise

    if (isInitialized)
      return

    initPromise = (async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { getAudioContext, initAudioOnFirstClick, initStrudel, repl, webaudioOutput, samples } = await import('@strudel/web')

        // Initialize Strudel core
        await initStrudel({
          prebake: () => [
            samples('github:tidalcycles/dirt-samples'),
            // samples('github:bubobubobubobubo/dough-waveforms'),
            samples('github:tidalcycles/uzu-wavetables'),
          ],
        })

        // Wait for first user click to initialize audio and load AudioWorklet modules
        // This sets up a listener and resolves on first interaction
        await initAudioOnFirstClick()

        const ctx = getAudioContext()

        const { scheduler: replScheduler } = repl({
          defaultOutput: webaudioOutput,
          getTime: () => ctx.currentTime,
        })
        scheduler = replScheduler
        scheduler.setCps(140 / 60 / 4) // 140 BPM, 4 beats per measure
        isInitialized = true
      }
      catch (error) {
        console.error('Strudel init failed:', error)
        throw error
      }
    })()

    return initPromise
  }

  // Start playback (resumes audio context on first user interaction)
  const start = async () => {
    if (!import.meta.client)
      return

    try {
      // Wait for initialization to complete
      if (initPromise)
        await initPromise

      if (!scheduler)
        return

      const { getAudioContext } = await import('@strudel/web')
      const ctx = getAudioContext()

      // Resume audio context if suspended (requires user gesture)
      if (ctx.state === 'suspended')
        await ctx.resume()

      scheduler.start()
    }
    catch (error) {
      console.error('Failed to start playback:', error)
    }
  }

  const playBlockSound = async ({ validatorAddress, batch, blockNumber }: { validatorAddress?: string, epoch: number, batch: number, blockNumber: number }) => {
    if (!scheduler || !import.meta.client)
      return

    try {
      const { note, stack, sound, rev } = await import('@strudel/web')
      const { makeHash } = await import('identicons-esm/core')

      // 1. DATA PREPARATION
      // We take the first 8 digits for melody to keep it catchy, rather than a long stream
      const hashStr = makeHash(validatorAddress || '')
      const digits = hashStr.split('').map(Number).map(n => n + 32)
      const seedSequence = digits.slice(0, 8).join(' ')

      console.log(`Playing block ${blockNumber} sound with seed sequence:`, seedSequence)

      const transposeAmount = 20 + (batch % 4) * 2
      console.log('Transpose amount based on batch:', transposeAmount)

      // 2. THE MELODY (The "Data Stream")
      // Improvements:
      // - Uses scale degrees (0-9) instead of raw MIDI numbers for harmony.
      // - 'jux' creates a stereo delay effect.
      const melody = note(seedSequence)
        .scale('e:phrygian') // Phrygian mode for that trance feel
        .transpose(transposeAmount) // Move up one octave
        .s('wt_vgame:4') // Classic trance waveform
        .lpf(2000)
        .lpq(5) // Resonant low pass filter
        .hpf(500)
        .dec(0.3)
        .sus(0)
        .rel(0.1) // Plucky envelope
        .delay(0.5)
        .jux(rev) // Stereo width
        .room(0.8)
        .gain(0.2)

      // 3. THE BASS (The "Block Foundation")
      // Improvements:
      // - Uses a sub-bass sound.
      // - Anchors the random melody to a root note (0).
      const base = note('0 [0 7] ~ ~') // A simple ostinato pattern
        .scale('e:minor')
        .s('triangle')
        .transpose(40) // Drop to bass register
        .cut(0.5) // Staccato feel
        .shape(0.5) // Add distortion/saturation
        .gain(0.8)

      // 4. THE DRUMS (The "Timer")
      // Improvements:
      // - Uses the 'gm' (General MIDI) bank for punchier sounds.
      // - Uses Euclidean rhythms 'euclid(3,8)' for a more modern, less "marching" feel.
      let drums = note('~')
      const bNum = blockNumber % 60

      if (bNum === 0) {
        // The "Block Mined" moment - a crash or sweep
        drums = sound('crash').slow(2).room(0.8)
      }
      else if (bNum < 15) {
        drums = sound('bd(3,8)') // Simple kick groove
      }
      else if (bNum < 30) {
        drums = stack(
          sound('bd(3,8)'),
          sound('hh*4').pan(0.2), // Add hi-hats
        )
      }
      else if (bNum < 50) {
        drums = stack(
          sound('bd(5,8)'), // More active kick
          sound('hh*8').pan('<0.2 0.2>'), // Faster hats, stereo
          sound('sd(3,8,2)'), // Add snare
        )
      }
      else {
        // Final countdown tension
        drums = stack(
          sound('bd*4'),
          sound('hh*16'),
          sound('cp*2'), // Glitchy clap
        )
      }

      // 5. FINAL MIX
      let pattern = stack(melody, base, drums).gain(0.6)

      if (bNum < 10) {
        // Low-pass filter only for the first 10 blocks (opening up)
        const lpfCutoff = 500 + (bNum / 10) * 5000
        pattern = pattern.lpf(lpfCutoff)
      }

      if (bNum > 52) {
        // High-pass filter for the last few blocks (thinning out)
        const hpfCutoff = (bNum - 52) * 200
        pattern = pattern.hpf(hpfCutoff)
      }

      scheduler.setPattern(pattern, true)
    }
    catch (error) {
      console.error('Failed to play sound:', error)
    }
  }

  return { init, start, playBlockSound, stop: () => scheduler?.stop() }
}
