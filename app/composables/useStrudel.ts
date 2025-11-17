let scheduler: any = null
let isInitialized = false
let initPromise: Promise<void> | null = null
let lastPatternType: string | null = null

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
          prebake: () => samples('github:tidalcycles/dirt-samples'),
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
        scheduler.setCps(120 / 60 / 4) // 140 BPM, 4 beats per measure
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
      const { note, stack, sound, time } = await import('@strudel/web')
      const { makeHash } = await import('identicons-esm/core')

      // Calculate position within 60-second cycle (0-59)
      const cyclePosition = blockNumber % 60
      // Normalize to 0-1 range for intensity calculations
      const intensity = cyclePosition / 60

      // Base drums pattern (present in all patterns)
      const drums = sound('sbd!4').distort('3:.3').duck('2:3:4').duckattack(0.2).duckdepth(0.8)

      // Pattern 1: Macro blocks (no validator, every 60 seconds)
      // Dramatic transition marker with building riser and minimal melody
      const createMacroPattern = () => {
        // Fixed ambient notes for macro blocks
        const macroNotes = 'c3 eb3 g3 bb3'

        const ambientPad = note(macroNotes)
          .scale('c:minor')
          .slow(4)
          .s('sawtooth')
          .lpf(150)
          .lpenv(2)
          .lpq(4)
          .gain(0.4)
          .room(2)
          .roomsize(6)
          .orbit(1)

        // Dramatic riser that builds throughout the macro block cycle
        const macroRiser = sound('pulse')
          .orbit(4)
          .seg(16)
          .dec(0.1)
          .fm(time.mul(2))
          .fmh(time.mul(1.5))
          .gain(0.6)
          .lpf(time.mul(500).add(200))

        // Impact sound at the end of macro block
        const impact = sound('bd')
          .distort('4:.5')
          .gain(1.2)
          .orbit(5)

        return stack(ambientPad, macroRiser, impact, drums)
      }

      // Pattern 2: Even batch micro blocks (validator present, even batches)
      // Melodic, sustained pattern with progressive intensity
      const createEvenBatchPattern = (notes: string) => {
        // Base melodic pattern with dynamic filtering based on cycle position
        // Take the last 2 notes and use as base
        const melody = note(`${notes}, [${notes.split(' ').slice(-2).join(' ')}]*2`)
          .scale('c:minor')
          .rib(46, 1)
          .distort('2.2:.3')
          .s('sawtooth')
          .lpf(200 + (intensity * 100)) // Filter opens from 200 to 600 Hz
          .lpenv(0.8 + (intensity * 0.8)) // Envelope lengthens
          .lpq(8 + (intensity * 2)) // Resonance increases
          .gain(4 + intensity) // Volume gradually increases
          .orbit(2)

        // Supersaw layer that intensifies in second half of cycle
        const supersaw = sound('supersaw')
          .detune(1)
          .rel(5)
          .beat(2, 32)
          .slow(2)
          .fm('2')
          .fmh(2.04)
          .room(1)
          .roomsize(4)
          .gain(cyclePosition >= 30 ? 0.6 : 0.2) // Louder in second half
          .orbit(3)

        return stack(melody, supersaw, drums)
      }

      // Pattern 3: Odd batch micro blocks (validator present, odd batches)
      // Rhythmic, punchy pattern with variation
      const createOddBatchPattern = (notes: string) => {
        // More aggressive melodic pattern
        // Take the last 2 notes and use as base
        const melody = note(`${notes}, [${notes.split(' ').slice(-2).join(' ')}]*2`)
          .scale('c:minor')
          .rib(46, 1)
          .distort('2.2:.3')
          .s('sawtooth')
          .lpf(300 + (intensity * 100)) // Filter range 300-600 Hz
          .lpenv(0.8)
          .lpq(12)
          .gain(4)
          .orbit(2)

        // Riser in first half, release in second half
        const dynamicRiser = sound('pulse')
          .orbit(4)
          .seg(16)
          .dec(0.1)
          .fm(time)
          .fmh(time)
          .gain(cyclePosition < 30 ? 0.4 : 0.2) // Louder in first half

        return stack(melody, dynamicRiser, drums)
      }

      // Track previous pattern type to detect changes
      const currentPatternType = !validatorAddress ? 'macro' : (batch % 3 === 0 ? 'drums' : (batch % 2 === 0 ? 'even' : 'odd'))

      // Detect pattern change (store in module-level variable)
      if (!lastPatternType) {
        lastPatternType = currentPatternType
      }

      const patternChanged = lastPatternType !== currentPatternType

      // Select pattern based on validator presence and batch parity
      let finalPattern

      if (!validatorAddress) {
        // Macro block: no validator (every 60 seconds)
        finalPattern = createMacroPattern()
      }
      else if (batch % 3 === 0) {
        // Every 3rd batch: drums with percussive fills based on batch number
        const fillSpeed = 2 + (batch % 8) // Speed varies from 2 to 9
        const fill = sound('cp, oh').fast(fillSpeed).gain(0.5).orbit(6)

        // Bass note based on batch number
        const bass = note(batch.toString().split('').map(Number).map(n => n + 32).join(' ')).s('sawtooth').lpf(100 + (batch % 4) * 50).lpq(2).gain(3).orbit(7)

        finalPattern = stack(drums, fill, bass)
      }
      else {
        // Micro block: validator present
        // Generate notes from validator address hash
        const hashStr = makeHash(validatorAddress)
        const digits = hashStr.split('').map(Number)

        // Create base (low) notes - octave 2-3
        const baseNotes = digits.map((n, i) => {
          const next1 = digits[i + 1] ?? 0
          const next2 = digits[i + 2] ?? 0
          return n + next1 + next2 + 32 // Lower octave
        }).join(' ')

        // Create high pitch notes - octave 4-5
        const highNotes = digits.map((n, i) => {
          const next1 = digits[i + 1] ?? 0
          const next2 = digits[i + 2] ?? 0
          return n + next1 + next2 + 40 // Higher octave
        }).join(' ')

        if (batch % 2 === 0) {
          // Even batch: sustained, melodic pattern
          finalPattern = createEvenBatchPattern(baseNotes)
        }
        else {
          // Odd batch: rhythmic, punchy pattern
          finalPattern = createOddBatchPattern(highNotes)
        }
      }

      // Handle pattern transitions
      if (patternChanged) {
        console.warn(`Pattern changing from ${lastPatternType} to ${currentPatternType}`)
        lastPatternType = currentPatternType
      }

      // Set the pattern with smooth transition
      scheduler.setPattern(finalPattern, true)
    }
    catch (error) {
      console.error('Failed to play sound:', error)
    }
  }

  return { init, start, playBlockSound, stop: () => scheduler?.stop() }
}
