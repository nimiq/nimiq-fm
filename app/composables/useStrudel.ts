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

        const ds = 'https://raw.githubusercontent.com/felixroos/dough-samples/main/'
        // Initialize Strudel core
        await initStrudel({
          prebake: () => [
            samples('github:tidalcycles/dirt-samples'),
            // samples('github:bubobubobubobubo/dough-waveforms'),
            samples('github:tidalcycles/uzu-wavetables'),
            samples(`${ds}/tidal-drum-machines.json`),
            samples(`${ds}/piano.json`),
            samples(`${ds}/Dirt-Samples.json`),
            samples(`${ds}/EmuSP12.json`),
            samples(`${ds}/vcsl.json`),
            samples(`${ds}/mridangam.json`),
            samples('https://sound.intercrap.com/strudel/mellotron/strudel.json'),
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
        scheduler.setCps(180 / 60 / 4) // 140 BPM, 4 beats per measure
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

      const clave = sound('clave')
        .struct('<[x ~ ~ x ~ ~ x ~] [~ ~ x ~ x ~ ~ ~]>')
        .gain(4)
        .pan(0.6)

      const timbales = note('16 26 16 ~ 16 26 16 16')
        .sound('RolandCompurhythm1000_perc:1')
        .velocity('<0.7 0.9 0.6 0.95>')
        .pan(0.3)
        .gain(0.4)

      const congas = note('~ 24 ~ 23 24 23 23 23')
        .transpose(12)
        .sound('conga:1')
        .velocity('<0.9 1 0.8 1.1>')
        .gain(1.1)

      const cowbell = sound('cowbell')
        .struct('x ~ x x x ~ x x')
        .gain(1.85)

      const guiro = note('4 3 3 4 3 3 4 3')
        .transpose(40)
        .sound('guiro:0')
        .velocity(0.6)
        .pan(0.8)

      const maracas = note('40')
        .struct('x*8')
        .sound('shaker_large')
        .velocity(0.4)
        .gain(1.1)

      const piano = note('c4 g4 c5 eb5 ~ c5 g4 eb4')
        .every(2, x => x.note('f4 c5 f5 ab5 ~ f5 c5 ab4'))
        .every(3, x => x.note('g4 d5 g5 b5 ~ g5 d5 b4'))
        .sound('piano')
        .velocity('<0.9 0.7 0.95 0.8>')
        .sustain(0.2)
        .jux(x => x.transpose(12).velocity(0.6)) // Right hand octave

      const trumpets = note(`<[${digits[0]} ~ ${digits[1]} ${digits[2]} ~ ${digits[3]} ${digits[4]} ~] [~ ${digits[5]} ${digits[6]} ${digits[7]} ~ ${digits[0]} ${digits[1]} ~] [${digits[2]} ~ ${digits[3]} ~ ${digits[4]} ${digits[5]} ${digits[6]} ${digits[7]}] [~ ${digits[0]} ${digits[1]} ${digits[2]} ${digits[3]} ${digits[4]} ~ ~]>`)
        .scale('c5:pentatonic') // Pentatonic scale fits great for salsa-style trumpet lines
        .sound('Trumpet')
        .transpose(36)
        .cut(1) // Cut off previous sample to prevent overlap
        .legato(0.8) // Control note length (0.8 = 80% of step duration)
        .room(0.5)
        .pan(0.4)
        .gain(0.6)

      const pattern = stack(clave, timbales, congas, cowbell, guiro, maracas, piano, trumpets)

      scheduler.setPattern(pattern, true)
    }
    catch (error) {
      console.error('Failed to play sound:', error)
    }
  }

  return { init, start, playBlockSound, stop: () => scheduler?.stop() }
}
