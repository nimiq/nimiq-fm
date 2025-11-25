import { batchAt } from '@nimiq/utils/albatross-policy'

export interface SongInfo {
  name: string
  fn: (digits: number[], batch: number, blockNumber: number) => any
}

export type SongName = 'milky-way' | 'acid' | 'desert-dune' | 'running-away' | 'qimin' | 'late-night'

const SONG_LIST: Array<{ name: string, key: SongName }> = [
  { name: 'Late Night', key: 'late-night' },
]

export function getSongCount() {
  return SONG_LIST.length
}

export function getSongNameByIndex(index: number): string {
  return SONG_LIST[index % SONG_LIST.length]!.name
}

export function getCurrentSongName(blockNumber: number, batchesPerSong = 3): string {
  const currentBatch = batchAt(blockNumber)
  const songCycleIndex = Math.floor(currentBatch / batchesPerSong)
  return SONG_LIST[songCycleIndex % SONG_LIST.length]!.name
}

export function getNextSongName(blockNumber: number, batchesPerSong = 3): string {
  const currentBatch = batchAt(blockNumber)
  const songCycleIndex = Math.floor(currentBatch / batchesPerSong)
  const nextIndex = (songCycleIndex + 1) % SONG_LIST.length
  return SONG_LIST[nextIndex]!.name
}

export async function loadSong(blockNumber: number, batchesPerSong = 3): Promise<SongInfo> {
  const currentBatch = batchAt(blockNumber)
  const songCycleIndex = Math.floor(currentBatch / batchesPerSong)
  const songIndex = songCycleIndex % SONG_LIST.length
  const song = SONG_LIST[songIndex]!

  switch (song.key) {
    case 'milky-way': {
      const { milkyWay } = await import('~/utils/songs/milky-way')
      return { name: song.name, fn: milkyWay }
    }
    case 'acid': {
      const { acid } = await import('~/utils/songs/acid')
      return { name: song.name, fn: acid }
    }
    case 'desert-dune': {
      const { desertDune } = await import('~/utils/songs/desert-dune')
      return { name: song.name, fn: desertDune }
    }
    case 'running-away': {
      const { runningAway } = await import('~/utils/songs/running-away')
      return { name: song.name, fn: runningAway }
    }
    case 'qimin': {
      const { qimin } = await import('~/utils/songs/qimin')
      return { name: song.name, fn: qimin }
    }
    case 'late-night': {
      const { lateNight } = await import('~/utils/songs/late-night')
      return { name: song.name, fn: lateNight }
    }
    default:
      throw new Error(`Unknown song: ${song.key}`)
  }
}
