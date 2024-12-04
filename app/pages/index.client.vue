<script setup lang="ts">
import { BlockType } from 'nimiq-rpc-client-ts'

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
  if (_block.type === BlockType.Macro) {
    playMacroBlock()
    return
  }
  const hash = makeHash(_block?.producer.validator || '')
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
  <div flex="~ items-center justify-center col" size-screen>
    <h1 text="center 3xl" w-full>
      Nimiq Song
    </h1>
    <p nq-subline>
      Each block is produced by a validator and each validator has their own "identisound"
    </p>
    <button v-if="!clicked" nq-pill-blue @click="onClick">
      Tune in!
    </button>
    <MainScene v-else />
  </div>
</template>
