import * as Tone from 'tone'

const synthA = new Tone.Synth({
  oscillator: {
    type: 'fatsawtooth',
    count: 3,
    spread: 30,
  },
  envelope: {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.5,
    release: 0.4,
    attackCurve: 'sine',
  },
}).toDestination()
const fatOsc = new Tone.Synth({
  oscillator: {
    type: 'fatsawtooth',
    count: 3,
    spread: 10,
    volume: -5,
  },
  envelope: {
    attack: 1,
    decay: 0.1,
    sustain: 0.5,
    release: 0.4,
    attackCurve: 'sine',
  },
}).toDestination()

const jumpSynth = new Tone.PolySynth(Tone.Synth, {
  oscillator: {
    type: 'fatsawtooth',
    count: 3,
    spread: 30,
  },
  envelope: {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.5,
    release: 0.4,
    attackCurve: 'exponential',
  },
}).toDestination()

// Effects
const reverbGlass = new Tone.Freeverb().set({
  roomSize: 0.7,
  dampening: 4300,
  wet: 0.5,
})
fatOsc.connect(reverbGlass)

const pitchShift = new Tone.PitchShift().set({
  pitch: 7,
  windowSize: 0.1,
  delayTime: 0,
  feedback: 0,
  wet: 0.5,
})

export default function useTone() {
  const maxNotes = 4
  const isPitchShift = ref(false)

  function playNotes(notes: string[]) {
    const notesToPlay = notes.slice(0, maxNotes)
    console.log('Notes:', notesToPlay)
    const seq = new Tone.Sequence((time, note) => {
      synthA.triggerAttackRelease(note, `${maxNotes * 4}}n`, time)
    }, notesToPlay).start(0)
  }

  function playMacroBlock() {
    const part = new Tone.Part(
      (time, note) => {
        jumpSynth.triggerAttackRelease(
          note.noteName,
          note.duration,
          time,
          note.velocity,
        )
      },
      [
        {
          time: '192i',
          noteName: 'G4',
          velocity: 0.8110236220472441,
          duration: '104i',
        },
        {
          time: '192i',
          noteName: 'B4',
          velocity: 0.7874015748031497,
          duration: '104i',
        },
        {
          time: '192i',
          noteName: 'D5',
          velocity: 0.8031496062992126,
          duration: '104i',
        },
        {
          time: '480i',
          noteName: 'G4',
          velocity: 0.7559055118110236,
          duration: '104i',
        },
        {
          time: '480i',
          noteName: 'C5',
          velocity: 0.6850393700787402,
          duration: '104i',
        },
        {
          time: '480i',
          noteName: 'E5',
          velocity: 0.6771653543307087,
          duration: '104i',
        },
        {
          time: '768i',
          noteName: 'F4',
          velocity: 0.8661417322834646,
          duration: '104i',
        },
        {
          time: '768i',
          noteName: 'A4',
          velocity: 0.8346456692913385,
          duration: '104i',
        },
        {
          time: '768i',
          noteName: 'C5',
          velocity: 0.8188976377952756,
          duration: '104i',
        },
        {
          time: '1056i',
          noteName: 'F4',
          velocity: 0.7007874015748031,
          duration: '104i',
        },
        {
          time: '1056i',
          noteName: 'A4',
          velocity: 0.6850393700787402,
          duration: '104i',
        },
        {
          time: '1056i',
          noteName: 'C5',
          velocity: 0.6614173228346457,
          duration: '104i',
        },
        {
          time: '1248i',
          noteName: 'G4',
          velocity: 0.6771653543307087,
          duration: '104i',
        },
        {
          time: '1248i',
          noteName: 'B4',
          velocity: 0.6771653543307087,
          duration: '104i',
        },
        {
          time: '1248i',
          noteName: 'D5',
          velocity: 0.7165354330708661,
          duration: '104i',
        },
        {
          time: '1440i',
          noteName: 'G4',
          velocity: 0.8818897637795275,
          duration: '248i',
        },
        {
          time: '1440i',
          noteName: 'B4',
          velocity: 0.84251968503937,
          duration: '248i',
        },
        {
          time: '1440i',
          noteName: 'D5',
          velocity: 0.8818897637795275,
          duration: '248i',
        },
        {
          time: '1728i',
          noteName: 'G4',
          velocity: 0.8267716535433071,
          duration: '104i',
        },
        {
          time: '1728i',
          noteName: 'C5',
          velocity: 0.8031496062992126,
          duration: '104i',
        },
        {
          time: '1728i',
          noteName: 'E5',
          velocity: 0.8188976377952756,
          duration: '104i',
        },
        {
          time: '2016i',
          noteName: 'F4',
          velocity: 0.7086614173228346,
          duration: '104i',
        },
        {
          time: '2016i',
          noteName: 'A4',
          velocity: 0.7244094488188977,
          duration: '104i',
        },
        {
          time: '2016i',
          noteName: 'C5',
          velocity: 0.7007874015748031,
          duration: '104i',
        },
        {
          time: '2208i',
          noteName: 'C4',
          velocity: 0.9921259842519685,
          duration: '296i',
        },
        {
          time: '2208i',
          noteName: 'F4',
          velocity: 0.968503937007874,
          duration: '200i',
        },
        {
          time: '2208i',
          noteName: 'A4',
          velocity: 0.9606299212598425,
          duration: '208i',
        },
        {
          time: '2400i',
          noteName: 'E4',
          velocity: 0.7559055118110236,
          duration: '104i',
        },
        {
          time: '2400i',
          noteName: 'G4',
          velocity: 0.7007874015748031,
          duration: '104i',
        },
        {
          time: '2592i',
          noteName: 'C4',
          velocity: 0.968503937007874,
          duration: '488i',
        },
        {
          time: '2592i',
          noteName: 'D4',
          velocity: 0.9448818897637795,
          duration: '488i',
        },
        {
          time: '2592i',
          noteName: 'G4',
          velocity: 0.937007874015748,
          duration: '488i',
        },
      ],
    ).start(0)
    Tone.getTransport().bpm.value = 132
  }

  function playBass(note: string) {
    console.log('Bass:', note)
    Tone.getTransport().bpm.value = 120
    fatOsc.triggerAttackRelease(note, '2n')
  }

  function addEffects() {
    if (!isPitchShift.value) {
      synthA.connect(pitchShift)
    }
  }

  function removeEffects() {
    if (isPitchShift.value) {
      synthA.disconnect(pitchShift)
    }
  }

  function start() {
    // all loops start when the Transport is started
    Tone.getTransport().start()
  }

  return {
    playNotes,
    playBass,
    start,
    addEffects,
    removeEffects,
    playMacroBlock,
  }
}
