import { note, rand, sound, stack } from '@strudel/web'

export function nightRain(digits: number[], batch: number, blockNumber: number) {
  const seedSequence = digits.slice(0, 8).join(' ')
  const bNum = blockNumber % 60

  // Mellotron flute melody - ethereal and floaty
  const melody = note(seedSequence)
    .scale('a:minor')
    .transpose(batch % 3 === 0 ? 36 : batch % 3 === 1 ? 38 : 37)
    .s('MkIIFlute')
    .room(0.8)
    .roomsize(8)
    .delay(0.5)
    .dec(0.6)
    .gain(0.4)
    .pan(rand)

  // Mellotron strings - warm pad
  const stringsPattern = batch % 3 === 0 ? '<a2 e3 c3 ~>/2' : batch % 3 === 1 ? '<a2 ~ d3 e3>/2' : '<c3 ~ a2 ~>/2'
  const strings = note(stringsPattern)
    .s('MkIIViolins')
    .room(0.7)
    .roomsize(6)
    .lpf(3000)
    .gain(0.35)
    .pan(0.4)

  // Mellotron choir - distant, haunting
  const choirPattern = bNum > 20 && bNum < 50 ? '<a3 ~ ~ e3>/4' : '~'
  const choir = note(choirPattern)
    .s('8Choir')
    .room(0.9)
    .roomsize(10)
    .lpf(2500)
    .gain(0.25)
    .pan(0.6)

  // Soft bass - cello-like
  const bassPattern = batch % 3 === 0 ? '<a2 ~ e2 ~>/2' : batch % 3 === 1 ? '<a2 ~ c3 ~>/2' : '<e2 ~ a2 ~>/2'
  const bass = note(bassPattern).s('Cello').lpf(800).gain(0.4).room(0.5)

  // Vinyl texture
  const vinyl = sound('white').lpf(4000).hpf(1000).gain(0.015).pan(rand)

  // Gentle gong - rare, atmospheric
  const gongPattern = bNum === 0 || bNum === 30 ? 'Gong' : '~'
  const gong = sound(gongPattern).gain(0.2).room(0.9).roomsize(10).lpf(2000)

  // Minimal percussion - vibes
  let perc = sound('~')
  if (bNum > 15) {
    perc = note('e4').s('Vibes').gain(0.2).room(0.6).delay(0.3)
  }

  // Very soft kick - heartbeat
  const kick = sound('bd:3(2,8)').lpf(400).gain(0.25)

  return stack(melody, strings, choir, bass, vinyl, gong, perc, kick)
}
