<script setup lang="ts">
import { BlockType } from 'nimiq-rpc-client-ts'
import * as Tone from 'tone'

const { block } = storeToRefs(useBlocks())
const { playNotes, init, ready } = useTone()

const pentatonic = ['C', 'D', 'E', 'G', 'A']
// const octaveNumber = [2, 3, 4, 5]
const octaveNumber = [1, 2, 3]
const clicked = ref(false)

watch(block, (_block) => {
  if (!ready.value)
    return
  if (_block.type === BlockType.Macro)
    return
  const hash = makeHash(_block?.producer.validator || '')
  const notes = []
  for (let i = 0; i < hash.length - 2; i += 2) {
    const note = pentatonic[Number(hash[i + 1]) % pentatonic.length]
    const octave = octaveNumber[Number(hash[i + 2]) % octaveNumber.length]
    notes.push(`${note}${octave}`)
  }
  // console.log(notes)
  playNotes(notes)
})

function onClick() {
  clicked.value = !clicked.value
  init()
  Tone.start()
}
</script>

<template>
  <div flex="~ items-center justify-center col" size-screen>
    <h1 text-3xl text="neutral-0 center">
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
