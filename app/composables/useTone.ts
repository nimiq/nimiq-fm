import * as Tone from 'tone'

export default function useTone() {
  const maxNotes = 4
  const synth = new Tone.Synth({
    oscillator: {
      type: 'fmsine4',
      modulationType: 'square',
    },
  }).toDestination()

  function playNotes(notes: string[]) {
    const now = Tone.now()
    for (let i = 0; i < maxNotes; i++) {
      synth.triggerAttackRelease(notes[i]!, '16n', now + i * 0.25)
    }
  }

  return { playNotes }
}
