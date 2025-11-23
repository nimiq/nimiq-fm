<script setup lang="ts">
import * as THREE from 'three'
import { TresCanvas } from '@tresjs/core'
import { Environment, OrbitControls, Sparkles, Stars } from '@tresjs/cientos'
import { BloomPmndrs, EffectComposer, NoisePmndrs, VignettePmndrs } from '@tresjs/post-processing'
import OrbMesh from './OrbMesh.vue'

defineProps<{
  audioData: number
}>()
</script>

<template>
  <TresCanvas
    :dpr="[1, 2]"
    :gl="{ antialias: false, alpha: true, toneMappingExposure: 1.0 }"
  >
    <Suspense>
      <template #default>
        <TresGroup>
          <TresPerspectiveCamera :position="[0, 0, 32]" :fov="35" make-default />
          <!-- High-contrast studio environment -->
          <Environment preset="warehouse" :blur="0.6" />

          <TresAmbientLight :intensity="0.4" color="#ffffff" />

          <TresPointLight :position="[20, 10, 20]" :intensity="4" color="#ffffff" :distance="100" />
          <TresPointLight :position="[-20, -10, -10]" :intensity="2" color="#cbd5e1" :distance="100" />
          <TresPointLight :position="[0, 20, 0]" :intensity="2" color="#f8fafc" :distance="50" />

          <Sparkles :count="60" :scale="35" :size="2" :speed="0.2" :opacity="0.15" color="#ffffff" />
          <Stars :radius="100" :depth="50" :count="800" :factor="4" :saturation="0" fade :speed="0.05" />

          <OrbMesh :audio-data="audioData" />

          <EffectComposer :enable-normal-pass="false">
            <BloomPmndrs
              :luminance-threshold="1.1"
              mipmap-blur
              :intensity="0.5"
              :radius="0.3"
            />
            <NoisePmndrs :opacity="0.04" />
            <VignettePmndrs :eskil="false" :offset="0.1" :darkness="0.6" />
          </EffectComposer>

          <OrbitControls
            :enable-pan="false"
            :enable-zoom="true"
            :min-distance="15"
            :max-distance="70"
            auto-rotate
            :auto-rotate-speed="0.1"
          />
        </TresGroup>
      </template>
    </Suspense>
  </TresCanvas>
</template>
