import { note, sound, stack, time } from '@strudel/web'

export function acid(digits: number[], batch: number, blockNumber: number) {
  const seedSequence = digits.slice(0, 16).join(' ')

  const drums = sound('sbd!4').distort('3:.3').duck('2:3:4').duckattack(0.2).duckdepth(0.8)

  // From 0 to 3 bases on block number % 60
  const lpenvValue = Math.min(3, (blockNumber % 60) * (3 / 60))

  const melody = note(seedSequence)
    .transpose(12)
    .scale('c:minor')
    .rib(46, 1)
    .distort('2.2:.3')
    .sound('sawtooth')
    .lpf(200)
    .lpenv(lpenvValue)
    .lpq(12)
    .orbit(2)

  const bass = sound('supersaw').detune(1).rel(5).beat(2, 32).slow(2).orbit(3).fm('2').fmh(2.04).room(1).roomsize(6).gain(0.6)

  // Play pulse only in batch 3
  const pulse = batch % 3 === 0 ? sound('pulse').orbit(4).seg(16).dec(0.1).fm(time).fmh(time) : sound('~')

  return stack(drums, melody, bass, pulse)
}
