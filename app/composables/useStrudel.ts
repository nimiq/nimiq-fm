let scheduler: any = null
let isInitialized = false
let initPromise: Promise<void> | null = null

export function useStrudel() {
  const nowPlaying = ref('')
  const selectedValidator = ref<string | null>(null)

  async function init() {
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
        console.error('[Strudel] Initialization failed. This may be due to audio context restrictions or failed sample loading:', error)
        throw error
      }
    })()

    return initPromise
  }

  async function start() {
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
      console.error('[Strudel] Failed to start audio playback. Check that audio context is not suspended:', error)
    }
  }

  const playBlockSound = async ({ validatorAddress, batch, blockNumber }: { validatorAddress?: string, epoch: number, batch: number, blockNumber: number }) => {
    if (!scheduler || !import.meta.client)
      return

    try {
      // Use selected validator address if one is manually chosen, otherwise use block producer
      const addressToPlay = selectedValidator.value || validatorAddress

      const { makeHash } = await import('identicons-esm/core')
      const hashStr = makeHash(addressToPlay || '')
      const digits = hashStr.split('').map(Number).map(n => n + 32)

      const songInfo = await loadSong(blockNumber)
      nowPlaying.value = songInfo.name
      let pattern = songInfo.fn(digits, batch, blockNumber)

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
      console.error('[Strudel] Failed to play block sound for block', blockNumber, ':', error)
    }
  }

  const setSelectedValidator = (address: string | null) => {
    selectedValidator.value = address
  }

  return {
    init,
    start,
    playBlockSound,
    stop: () => scheduler?.stop(),
    nowPlaying,
    setSelectedValidator,
    selectedValidator: readonly(selectedValidator),
  }
}
