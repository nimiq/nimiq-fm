import { now, start, Synth } from 'tone'

export default function useTone() {
  const maxNotes = 8
  const synth = ref()
  function init() {
    synth.value = new Synth({
      oscillator: {
        type: 'fmsine4',
        modulationType: 'square',
      },
    }).toDestination()

    start()
  }

  function playNotes(notes: string[]) {
    if (!synth.value)
      return
    const noww = now()
    for (let i = 0; i < maxNotes; i++) {
      synth.value!.triggerAttackRelease(notes[i]!, '16n', noww + i * 0.125)
    }
  }

  return { playNotes, init, ready: computed(() => !!synth.value) }
}
