<script setup lang="ts">
import { useBlocks } from '~/stores/blocks'

const { block } = storeToRefs(useBlocks())
const { playNotes, playBass, playMacroBlock, start, addEffects, removeEffects } = useTone()

const pentatonic = ['C', 'D', 'E', 'G', 'A']
const octaveNumber = [3, 4, 5]
const pentatonicBass = ['C', 'E', 'G']
const bassOctaveNumber = [1, 2, 3]
const clicked = ref(false)

watch(block, (_block) => {
  if (!clicked.value || !_block)
    return
  if (_block.type === 'macro') {
    playMacroBlock()
    return
  }
  const hash = makeHash(_block?.validator || '')
  const notes = []
  for (let i = 0; i < hash.length - 2; i += 2) {
    const note = pentatonic[Number(hash[i + 1]) % pentatonic.length]
    const octave = octaveNumber[Number(hash[i + 2]) % octaveNumber.length]
    notes.push(`${note}${octave}`)
  }

  const bassNote = pentatonicBass[Number(hash[0]) % pentatonicBass.length]
  const bassOctave = bassOctaveNumber[Number(hash[1]) % bassOctaveNumber.length]

  playNotes(notes)
  playBass(`${bassNote}${bassOctave}`)

  if (_block.batch % 4 === 0)
    addEffects()
  else
    removeEffects()
})

function onClick() {
  start()
  clicked.value = !clicked.value
}
</script>

<template>
  <div class="flex flex-col items-center justify-center w-screen h-screen">
    <h1 class="text-center text-3xl w-full">
      Nimiq Song
    </h1>
    <p class="text-center w-full mb-32 text-xl text-gray-400 font-semibold">
      Each block is produced by a validator and each validator has their own "identisound"
    </p>
    <button v-if="!clicked" class="bg-[#0582CA] text-white rounded-full px-8 py-3 font-bold hover:bg-[#0466a0] transition-colors" @click="onClick">
      Tune in!
    </button>
    <MainScene v-else />
  </div>
</template>
