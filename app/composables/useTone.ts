import * as T from 'tone'

export default function useTone() {
  const maxNotes = 8
  const synth = ref()
  const ready = ref(false)
  function init() {
    synth.value = new T.Synth({
      oscillator: {
        type: 'fmsine4',
        modulationType: 'square',
      },
    }).toDestination()

    T.start()
    ready.value = true
  }

  function playNotes(notes: string[]) {
    if (!synth.value)
      return
    const noww = T.now()
    for (let i = 0; i < maxNotes; i++) {
      synth.value!.triggerAttackRelease(notes[i]!, '16n', noww + i * 0.125)
    }
  }

  return { playNotes, init, ready }
}
