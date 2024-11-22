import * as Tone from 'tone'

export default function useTone() {
  const maxNotes = 8
  const synth = ref()
  function init() {
    synth.value = new Tone.Synth({
      oscillator: {
        type: 'fmsine4',
        modulationType: 'square',
      },
    }).toDestination()
  }

  function playNotes(notes: string[]) {
    if (!synth.value)
      return
    const now = Tone.now()
    for (let i = 0; i < maxNotes; i++) {
      synth.value!.triggerAttackRelease(notes[i]!, '16n', now + i * 0.125)
    }
  }

  return { playNotes, init, ready: computed(() => !!synth.value) }
}
