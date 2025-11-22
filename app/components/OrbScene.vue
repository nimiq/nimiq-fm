<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { OrbitControls, Stars, Sparkles } from '@tresjs/cientos'
import { EffectComposer, Bloom, Noise, Vignette } from '@tresjs/post-processing'
import * as THREE from 'three'
import type { ValidatorNode, PeerNode, LinkData, Beam } from '~/types/orb'
import { THEME_PALETTES } from '~/utils/orb-constants'

const props = defineProps<{
  nodes: Array<ValidatorNode | PeerNode>
  links: LinkData[]
  validatorMap: Map<string, number>
  beams: Beam[]
  theme: 'dunesOfDessert' | 'qinim'
  validatorCount: number
}>()

const themeColors = computed(() => THEME_PALETTES[props.theme])
</script>

<template>
  <TresCanvas
    :clear-color="'#000000'"
    :tone-mapping="THREE.ACESFilmicToneMapping"
    :tone-mapping-exposure="1.2"
  >
    <TresPerspectiveCamera :position="[0, 0, 32]" :fov="35" />

    <TresAmbientLight :intensity="0.3" :color="themeColors.ambient" />
    <TresPointLight :position="[0, 0, 0]" :intensity="2" :color="themeColors.beam" :distance="20" :decay="2" />
    <TresPointLight :position="[30, 10, 20]" :intensity="15" :color="themeColors.pointLight1" :distance="100" :decay="1" />
    <TresPointLight :position="[-30, -10, -10]" :intensity="15" :color="themeColors.pointLight2" :distance="100" :decay="1" />

    <Sparkles :count="100" :scale="25" :size="4" :speed="0.4" :opacity="0.5" :color="themeColors.pointLight1" />
    <Sparkles :count="100" :scale="35" :size="6" :speed="0.2" :opacity="0.4" :color="themeColors.beam" />
    <Stars :radius="100" :depth="50" :count="1000" :factor="4" :saturation="0.5" :fade="true" :speed="0.2" />

    <OrbMesh :nodes="nodes" :links="links" :validator-map="validatorMap" :beams="beams" :theme="theme" :validator-count="validatorCount" />

    <Suspense>
      <EffectComposer>
        <Bloom :luminance-threshold="0.2" :intensity="1.0" :radius="0.5" :levels="8" mipmapBlur />
        <Noise :opacity="0.05" />
        <Vignette :offset="0.1" :darkness="0.6" />
      </EffectComposer>
    </Suspense>

    <OrbitControls :enable-pan="false" :enable-zoom="true" :min-distance="15" :max-distance="70" :auto-rotate="true" :auto-rotate-speed="0.3" />
  </TresCanvas>
</template>
