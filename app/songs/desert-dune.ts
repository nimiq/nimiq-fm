import { note, rev, sound, stack } from '@strudel/web'

export function desertDune(digits: number[], batch: number, blockNumber: number) {
  const seedSequence = digits.slice(0, 8).join(' ')

  const transposeAmount = 20 + (batch % 3) * 2

  const melody = note(seedSequence)
    .scale('e:minor')
    .transpose(transposeAmount)
    .s('wt_vgame:4')
    .lpf(2000)
    .lpq(5)
    .hpf(500)
    .dec(0.3)
    .sus(0)
    .rel(0.1)
    .delay(0.5)
    .jux(rev)
    .room(0.8)
    .gain(0.2)

  const bass = note('0 [0 7] ~ ~')
    .scale('e:minor')
    .s('triangle')
    .transpose(40)
    .cut(0.5)
    .shape(0.5)
    .gain(0.8)

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
