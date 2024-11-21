<script setup lang="ts">
import { BlockType } from 'nimiq-rpc-client-ts'
import * as Tone from 'tone'

const { block } = storeToRefs(useBlocks())
const { playNotes } = useTone()

const pentatonic = ['C', 'D', 'E', 'G', 'A']
const octaveNumber = [2, 3, 4, 5]

watch(block, (_block) => {
  if (_block.type === BlockType.Macro)
    return
  const hash = makeHash(_block?.producer.validator || '')
  console.log(_block?.producer.validator)
  const notes = []
  for (let i = 0; i < hash.length - 2; i += 2) {
    const note = pentatonic[Number(hash[i + 1]) % pentatonic.length]
    const octave = octaveNumber[Number(hash[i + 2]) % octaveNumber.length]
    notes.push(`${note}${octave}`)
  }
  // console.log(notes)
  playNotes(notes)
})

const clicked = ref(false)
function onClick() {
  clicked.value = !clicked.value
  Tone.start()
}
</script>

<template>
  <div flex="~ items-center justify-center" h-full>
    <!-- <button @click="onClick" nq-pill-blue v-if="!clicked">Click me</button> -->
    <MainScene />
  </div>
</template>
