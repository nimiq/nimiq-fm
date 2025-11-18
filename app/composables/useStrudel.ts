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
      const { note, stack, sound, time, rand, saw } = await import('@strudel/web')
      const { makeHash } = await import('identicons-esm/core')

      const hashStr = makeHash(validatorAddress || '')
      const digits = hashStr.split('').map(Number)
      const notes = digits.map((n, i) => {
        return n + 40
      }).join(' ')

      const melody = note(notes).scale('c:major:pentatonic').seg(8).s('wt_vgame:4').rel(1).pan(rand).delay(0.6).dec(0.2)
      const base = note('<f0 a0 g0 [g0 a0]>/2').seg(8).s('wt_digital:0').warp(saw.fast(4)).warpmode(6).unison(3).att(0.03).wtenv(0.5).wtdec(0.3).gain(0.5)
      let drums = note('~')

      if (blockNumber % 60 < 20) {
        drums = sound('bd!2')
      }

      const pattern = stack(melody, base, drums)

      // Set the pattern with smooth transition
      scheduler.setPattern(pattern, true)
    }
    catch (error) {
      console.error('Failed to play sound:', error)
    }
  }

  return { init, start, playBlockSound, stop: () => scheduler?.stop() }
}
