// makeHash converts any string to consistent numeric hash for generating identicons
import { makeHash } from 'identicons-esm/core'

let scheduler: any = null
let isInitialized = false
let analyser: AnalyserNode | null = null
let audioContext: AudioContext | null = null

export function useStrudel() {
  const audioData = ref<Float32Array>(new Float32Array(512))

  const init = async () => {
    if (isInitialized || !import.meta.client) return

    try {
      const { repl } = await import('@strudel/core')
      const { webaudioOutput, initAudioOnFirstClick, getAudioContext, samples } = await import('@strudel/webaudio')

      await initAudioOnFirstClick()
      const ctx = getAudioContext()
      audioContext = ctx

      if (ctx.state === 'suspended') await ctx.resume()

      await samples('github:tidalcycles/dirt-samples')

      const replInstance = repl({ defaultOutput: webaudioOutput, getTime: () => ctx.currentTime })
      scheduler = replInstance.scheduler

      // Setup analyser for audio visualization
      analyser = ctx.createAnalyser()
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.8

      // Connect destination to analyser
      if (ctx.destination) {
        const source = ctx.createMediaStreamDestination()
        analyser.connect(ctx.destination)
      }

      // Start audio analysis loop
      const updateAudioData = () => {
        if (!analyser) return
        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(dataArray)
        audioData.value = new Float32Array(dataArray)
        requestAnimationFrame(updateAudioData)
      }
      updateAudioData()

      isInitialized = true
    }
    catch (error) {
      console.error('Strudel init failed:', error)
    }
  }

  const playBlockSound = async ({ validatorAddress }: { validatorAddress: string }) => {
    if (!scheduler || !import.meta.client) return

    try {
      const { note } = await import('@strudel/core')

      // Map validator address to note
      const hashStr = makeHash(validatorAddress)
      const hash = Number.parseInt(hashStr, 10)
      const notes = ['c3', 'd3', 'e3', 'f3', 'g3', 'a3', 'b3', 'c4']
      const selectedNote = notes[Math.abs(hash) % notes.length]

      const pattern = note(selectedNote).s('triangle').gain(0.7).supradough()

      scheduler.setPattern(pattern, false)
    }
    catch (error) {
      console.error('Failed to play sound:', error)
    }
  }

  return { init, playBlockSound, audioData: readonly(audioData) }
}
