import { note, pure, rand, sound, stack } from '@strudel/web'

export function qimin(digits: number[], batch: number, blockNumber: number) {
  const seedSequence = digits.slice(0, 16).join(' ')

  // From 0 to 9 based on block number % 60
  // If batch % 3 === 0, increase lpenv, else between 4 and 6 slowly
  const lpenvMelody = batch % 3 === 0 ? Math.min(9, (blockNumber % 60) * (9 / 60)) : 4 + ((blockNumber % 60) * (2 / 60))

  const melody = note(seedSequence)
    .scale('g:minor')
    .transpose(12)
    .orbit(3)
    .sound('sawtooth')
    .delay(0.4)
    .lpf(pure(0.25).mul(12).pow(4))
    .lpenv(lpenvMelody)
    .lps(0.2)
    .lpd(0.15)
    .gain(0.6)

  const lpenvBass = batch % 3 === 1 ? Math.min(8, 4 + (blockNumber % 60) * (4 / 60)) : 6

  const bass = note('<7 _ _ 6 5 _ <5 3> <6 4>>*2')
    .scale('g:minor')
    .transpose(32)
    .detune(rand)
    .orbit(4)
    .sound('supersaw')
    .lpf(pure(0.25).mul(12).pow(4))
    .lpenv(lpenvBass)
    .lps(0.2)
    .lpd(0.15)

  const clap = sound('cp:0!4').orbit(8).gain(0.15)

  const whiteNoise = sound('white!4').att(0.4).orbit(6).gain(0.05).pan(rand)

  const drums = sound('bd9:8!4').duck('3:4:6').duckdepth(0.8).duckattack(0.16).gain(0.6)

  return stack(melody, bass, clap, whiteNoise, drums)
}
