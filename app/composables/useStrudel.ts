let scheduler: any = null
let isInitialized = false
let initPromise: Promise<void> | null = null

export function useStrudel() {
  const init = async () => {
    if (!import.meta.client)
      return

    if (initPromise)
      return initPromise

    if (isInitialized)
      return

    initPromise = (async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { getAudioContext, initAudioOnFirstClick, initStrudel, repl, webaudioOutput, samples } = await import('@strudel/web')

        const ds = 'https://raw.githubusercontent.com/felixroos/dough-samples/main/'
        await initStrudel({
          prebake: () => [
            samples('github:tidalcycles/dirt-samples'),
            samples('github:bubobubobubobubo/dough-waveforms'),
            samples('github:tidalcycles/uzu-wavetables'),
            samples(`${ds}/tidal-drum-machines.json`),
            samples(`${ds}/piano.json`),
            samples(`${ds}/Dirt-Samples.json`),
            samples(`${ds}/EmuSP12.json`),
            samples(`${ds}/vcsl.json`),
            samples(`${ds}/mridangam.json`),
            samples('https://sound.intercrap.com/strudel/mellotron/strudel.json'),
            samples('github:yaxu/spicule'),
          ],
        })

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

  const start = async () => {
    if (!import.meta.client)
      return

    try {
      if (initPromise)
        await initPromise

      if (!scheduler)
        return

      const { getAudioContext } = await import('@strudel/web')
      const ctx = getAudioContext()

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
      const { desertDune } = await import('~/songs/desert-dune')
      const { milkyWay } = await import('~/songs/milky-way')
      const { acid } = await import('~/songs/acid')
      const { qimin } = await import('~/songs/qimin')
      const { runningAway } = await import('~/songs/running-away')

      const { makeHash } = await import('identicons-esm/core')

      const hashStr = makeHash(validatorAddress || '')
      const digits = hashStr.split('').map(Number).map(n => n + 32)

      // Play each pattern for 3 batches
      const patternIndex = Math.floor(batch / 3) % 5

      let pattern
      switch (patternIndex) {
        case 0:
          console.log('Playing Desert Dune')
          pattern = desertDune(digits, batch, blockNumber)
          break
        case 1:
          console.log('Playing Milky Way')
          pattern = milkyWay(digits, batch, blockNumber)
          break
        case 2:
          console.log('Playing Acid')
          pattern = acid(digits, batch, blockNumber)
          break
        case 3:
          console.log('Playing Qimin')
          pattern = qimin(digits, batch, blockNumber)
          break
        case 4:
          console.log('Playing Running Away')
          pattern = runningAway(digits, batch, blockNumber)
          break
        default:
          console.log('Playing Desert Dune (default)')
          pattern = desertDune(digits, batch, blockNumber)
      }

      const bNum = blockNumber % 60
      if (bNum < 4) {
        const lpfCutoff = 100 + (bNum / 4) * 3900
        const hpfCutoff = 4000 - (bNum / 4) * 3900
        pattern = pattern.lpf(lpfCutoff).hpf(hpfCutoff)
      }

      if (bNum >= 56) {
        const hpfCutoff = 100 + ((bNum - 55) / 4) * 3900
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
