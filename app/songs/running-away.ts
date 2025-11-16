// https://strudel.cc/#c2V0Y3BzKDE0MC82MC80KQoKa2ljazogbm90ZSgiZzEqNCIpLnMoInNiZCIpLmRpc3QoLjQpLmdhaW4oLjUpCi5zb21ldGltZXNCeSguNSwgeT0%2BeS53aGVuKCI8IDAgWzAhMyAxXT4iLCB4PT54LmNsaXAoLjc1KS5wbHkoIjJ8MnwyfDQiKSkpCi5vcmJpdCgyKS5kdWNrb3JiaXQoMSkKCmhhdDogcygiW34gW29oOjI6LjV8fnx%2BfH5dIG9oOjIgfl0qNCIpLmRlYyguMikKLm9yYml0KDIpLmF0dCgiWy4xNSAwXSo0IikudmVsb2NpdHkoMS4yKS5wYW4oLjYpCgpzbmFyZTE6IG5vdGUoIlt%2BIFtnM11dKjIiKS5zKCJzYmQiKS5wZW52KDYpLmRlYyguNCkKLm9yYml0KDIpCgpzbmFyZTI6IHMoIlt%2BIHdoaXRlXSoyIikuZGVjKC4zKS5icGYoMzAwMCkuYnBxKC41KQoub3JiaXQoMikKCmNyYXNoOiBzKCI8Y3IgfiE2IFtjciEzIFtjciEyXV0%2BIikub3JiaXQoMikuZ2FpbigxLjIpLmNsaXAoLjUpCnRvcDogbihpcmFuZCg1KS5zdHJ1Y3QoIngqMTYiKSkucygiaGgiKQogIC5vcmJpdCgyKQoucmliYm9uKDI1NSwyKS5nYWluKC42KQoKYmFzc2xlYWQ6IG5vdGUoIltnMXxnMXxnIzF8ZDJ8ZzJ8ZyMyfGQzfGczXSo4IikKLnMoInNhdyIpCi5wYXR0KC4xKQogIC8vIDI3OTI3ODI0IDA2ODY1ODczCi8vIC5wZW52KCJbMHwwfDF8NXwtMXwtNXwxMnwtMTJdKjgiKQovLyAucGVudigiWzJ8N3w5fDJ8LTd8LTh8MnwtNF0qOCIpCi5wZW52KCJbMHw2fDh8NnwtNXwtOHw3fC0zXSo4IikKLnJlbCgwKQouZ2FpbiguNykKLndoZW4oIlswIFswfDFdXSo0IiwgeD0%2BeC5scGYoNjAwKS5scGVudig2KS5scGQoLjIyKQogICAgIC5yYXJlbHkoeD0%2BeC5jbGlwKC43KS5wbHkoIjJ8MnwyfDJ8MyIpKSkKLnN1cGVyaW1wb3NlKHg9Pngucygic3VwZXJzYXciKS50cmFucygyNCkubXVsKGdhaW4oLjkpKSkKCmFsbCh4PT54LnJlc2V0KCI8MSE3IFsxITIgW1sxXXxbMSEyXV0gW1sxITJdfFsxITJdfFsxITRdXV0%2BIikKICAgLndoZW4oIjwwITcgWzAhMyAxXT4iLCB4PT54LmNsaXAoLjUpCiAgICAgICAgLnNvbWVDeWNsZXNCeSguMix4PT54LnRyYW5zKHNhdy5mYXN0KDQpLnJhbmdlKDAsNCkpLnNwZWVkKHNhdy5mYXN0KDQpLnJhbmdlKDEsMS4zKSkpKSk%3D
import { gain, irand, note, saw, sound, stack } from '@strudel/web'

export function runningAway(digits: number[], batch: number, blockNumber: number) {
  const seedSequence = digits.map(n => n - 32).slice(0, 8).join('|')

  const basslead = note('[g1|g1|g#1|d2|g2|g#2|d3|g3]*8')
    .s('saw')
    .patt(0.1)
    .penv(`[${seedSequence}]*8`)
    .rel(0)
    .gain(0.7)
    .when('[0 [0|1]]*4', x => x.lpf(600).lpenv(6).lpd(0.22).rarely(x => x.clip(0.7).ply('2|2|2|2|3')))
    .superimpose(x => x.s('supersaw').trans(24).mul(gain(0.9)))

  const kick = note('g1*4')
    .sound('sbd')
    .dist(0.4)
    .gain(0.5)
    .sometimesBy(0.5, y => y.when('< 0 [0!3 1]>', x => x.clip(0.75).ply('2|2|2|4')))
    .orbit(2)
    .duckorbit(1)

  const hat = sound('[~ [oh:2:.5|~|~|~] oh:2 ~]*4')
    .dec(0.2)
    .orbit(2)
    .att('[.15 0]*4')
    .velocity(1.2)
    .pan(0.6)

  const snare1 = note('[~ [g3]]*2').sound('sbd').penv(6).dec(0.4).orbit(2)
  const snare2 = sound('[~ white]*2').dec(0.3).bpf(3000).bpq(0.5).orbit(2)

  const crash = sound('<cr ~!6 [cr!3 [cr!2]]>').orbit(2).gain(0.5).clip(0.5)
  const top = note(irand(5).struct('x*16')).transpose(32).s('hh').orbit(2).ribbon(255, 2).gain(0.6)

  return stack(
    basslead,
    kick,
    hat,
    snare1,
    snare2,
    crash,
    top,
  ).reset('<1!7 [1!2 [[1]|[1!2]] [[1!2]|[1!2]|[1!4]]]>').when('<0!7 [0!3 1]>', x => x.clip(0.5)
    .someCyclesBy(0.2, x => x.trans(saw.fast(4).range(0, 4)).speed(saw.fast(4).range(1, 1.3))))
}
