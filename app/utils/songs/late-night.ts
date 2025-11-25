import { note, rand, sound, stack } from '@strudel/web'

export function lateNight(digits: number[], batch: number, blockNumber: number) {
  const seedSequence = digits.slice(0, 8).join(' ')
  const bNum = blockNumber % 60

  // Slow, dreamy piano melody
  const lpfValue = 600 + (bNum * 8)
  const melody = note(seedSequence)
    .scale('d:major')
    .transpose(batch % 3 === 0 ? 24 : batch % 3 === 1 ? 26 : 25)
    .s('piano')
    .lpf(lpfValue)
    .lpq(1.5)
    .room(0.7)
    .roomsize(6)
    .delay(0.4)
    .dec(0.5)
    .gain(0.35)
    .pan(rand)

  // Soft warm bass - slower
  const bassPattern = batch % 3 === 0
    ? '<d1 ~ f#1 ~>/2'
    : batch % 3 === 1
      ? '<d1 ~ g1 ~>/2'
      : '<d1 ~ a1 ~>/2'

  const bass = note(bassPattern).s('triangle').lpf(350).gain(0.4).room(0.4)

  // Rain - gentle pink noise
  const rain = sound('pink').lpf(2000).hpf(300).gain(0.05).pan(rand).room(0.5)

  // Vinyl crackle - subtle
  const crackle = sound('white').lpf(3500).hpf(1000).gain(0.02).pan(rand)

  // Lo-fi texture - tape wobble simulation
  const tape = sound('brown').lpf(150).hpf(40).gain(0.04).room(0.3)

  // Minimal boom bap drums - very laid back
  let drums = sound('~')

  if (bNum < 20) {
    drums = sound('bd:3(2,8)').lpf(600).gain(0.35)
  }
  else if (bNum < 40) {
    drums = stack(
      sound('bd:3(2,8)').lpf(600).gain(0.35),
      sound('hh:2*2').lpf(3000).gain(0.12).pan(0.3),
    )
  }
  else {
    drums = stack(
      sound('bd:3(2,8)').lpf(600).gain(0.35),
      sound('hh:2*2').lpf(3000).gain(0.12).pan(0.3),
      sound('[~ sd:1]/2').lpf(1500).gain(0.2),
    )
  }

  return stack(melody, bass, rain, crackle, tape, drums)
}
