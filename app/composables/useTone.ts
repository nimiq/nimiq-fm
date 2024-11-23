export default function useTone() {
  const maxNotes = 8
  const synth = ref()
  async function init() {
    const { Synth, start } = await import('tone')
    synth.value = new Synth({
      oscillator: {
        type: 'fmsine4',
        modulationType: 'square',
      },
    }).toDestination()

    start()
  }

  async function playNotes(notes: string[]) {
    const { now } = await import('tone')
    if (!synth.value)
      return
    const noww = now()
    for (let i = 0; i < maxNotes; i++) {
      synth.value!.triggerAttackRelease(notes[i]!, '16n', noww + i * 0.125)
    }
  }

  return { playNotes, init, ready: computed(() => !!synth.value) }
}
