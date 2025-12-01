import { batchAt } from '@nimiq/utils/albatross-policy'

export interface SongInfo {
  name: string
  fn: (digits: number[], batch: number, blockNumber: number) => any
}

export type SongName = 'milky-way' | 'acid' | 'desert-dune' | 'running-away' | 'qimin'

const SONG_LIST: Array<{ name: string, key: SongName, author: string }> = [
  { name: 'Milky Way', key: 'milky-way', author: 'Albermonte' },
  { name: 'Acid', key: 'acid', author: 'Albermonte' },
  { name: 'Desert Dune', key: 'desert-dune', author: 'Albermonte' },
  { name: 'Running Away', key: 'running-away', author: 'Albermonte' },
  { name: 'Qimin', key: 'qimin', author: 'Albermonte' },
]

export function getSongNameByIndex(index: number): string {
  const len = SONG_LIST.length
  return SONG_LIST[((index % len) + len) % len]!.name
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

export function getCurrentSongAuthor(blockNumber: number, batchesPerSong = 3): string {
  const currentBatch = batchAt(blockNumber)
  const songCycleIndex = Math.floor(currentBatch / batchesPerSong)
  return SONG_LIST[songCycleIndex % SONG_LIST.length]!.author
}

export function getNextSongAuthor(blockNumber: number, batchesPerSong = 3): string {
  const currentBatch = batchAt(blockNumber)
  const songCycleIndex = Math.floor(currentBatch / batchesPerSong)
  const nextIndex = (songCycleIndex + 1) % SONG_LIST.length
  return SONG_LIST[nextIndex]!.author
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
    default:
      throw new Error(`Unknown song: ${song.key}`)
  }
}
