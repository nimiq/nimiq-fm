import { note, rand, saw, sound, stack } from '@strudel/web'

export function milkyWay(digits: number[], batch: number, blockNumber: number) {
  const seedSequence = digits.join(' ')

  let melody
  let bass

  if (batch % 3 === 0) {
    melody = note(seedSequence).transpose(20).scale('c:major:pentatonic').seg(8).s('wt_vgame:4').rel(1).pan(rand).delay(0.6).dec(0.2)
    bass = note('<f0 a0 g0 [g0 a0]>/2').seg(8).s('wt_digital:0').warp(saw.fast(4)).warpmode(6).unison(3).att(0.03).wtenv(0.5).wtdec(0.3).gain(0.5)
  }
  else if (batch % 3 === 1) {
    melody = note(seedSequence).transpose(24).scale('e:minor').seg(8).s('sawtooth').lpf(2000).lpq(5).rel(0.5).pan(rand).delay(0.5).dec(0.3)
    bass = note('<e0 g0 b0 [b0 e0]>/2').seg(8).s('square').lpf(800).gain(0.4)
  }
  else {
    melody = note(seedSequence).transpose(20).scale('a:minor').seg(8).s('wt_piano').rel(2).pan(rand).delay(0.4).dec(0.25).gain(1.2)
    bass = note('<a0 c0 e0 [e0 a0]>/2').seg(8).s('triangle').lpf(600).gain(0.8)
  }

  let drums = note('~')
  const bNum = blockNumber % 60

  if (bNum < 15) {
    drums = sound('bd(3,8)')
  }
  else if (bNum < 30) {
    drums = stack(
      sound('bd(3,8)'),
      sound('hh*4').pan(0.2),
    )
  }
  else if (bNum < 50) {
    drums = stack(
      sound('bd(5,8)'),
      sound('hh*8').pan('<0.2 0.2>'),
      sound('sd(3,8,2)'),
    )
  }
  else {
    drums = stack(
      sound('bd*4'),
      sound('hh*16'),
      sound('cp*2'),
    )
  }

  return stack(melody, bass, drums)
}
