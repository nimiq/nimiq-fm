<script setup lang="ts">
import { Environment, OrbitControls, Sparkles, Stars } from '@tresjs/cientos'
import { TresCanvas } from '@tresjs/core'
import { BloomPmndrs, EffectComposer, VignettePmndrs } from '@tresjs/post-processing'
import OrbMesh from './OrbMesh.vue'

defineProps<{
  audioData: number
}>()
</script>

<template>
  <TresCanvas
    :dpr="[1, 1.5]"
    :gl="{ antialias: false, alpha: true, toneMappingExposure: 1.0, powerPreference: 'high-performance' }"
    :clear-alpha="0"
  >
    <Suspense>
      <template #default>
        <TresGroup>
          <TresPerspectiveCamera :position="[0, 0, 30]" :fov="60" make-default />
          <!-- High-contrast studio environment -->
          <!-- @vue-ignore -->
          <Environment preset="studio" :blur="0.6" :background="false" />

          <TresAmbientLight :intensity="0.4" color="#ffffff" />

          <TresPointLight :position="[20, 10, 20]" :intensity="4" color="#ffffff" :distance="100" />
          <TresPointLight :position="[-20, -10, -10]" :intensity="2" color="#cbd5e1" :distance="100" />
          <TresPointLight :position="[0, 20, 0]" :intensity="2" color="#f8fafc" :distance="50" />

          <Sparkles :count="60" :scale="35" :size="2" :speed="0.2" :opacity="0.15" color="#ffffff" />
          <Stars :radius="100" :depth="50" :count="800" :factor="4" :saturation="0" fade :speed="0.05" />

          <OrbMesh :audio-data="audioData" />

          <EffectComposer :enable-normal-pass="false">
            <BloomPmndrs
              :luminance-threshold="1.2"
              mipmap-blur
              :intensity="0.4"
              :radius="0.2"
              :levels="4"
            />
            <VignettePmndrs :eskil="false" :offset="0.1" :darkness="0.5" />
          </EffectComposer>

          <OrbitControls
            :enable-pan="false"
            :enable-zoom="true"
            :enable-rotate="true"
            :min-distance="15"
            :max-distance="100"
            auto-rotate
            :auto-rotate-speed="0.1"
          />
        </TresGroup>
      </template>
    </Suspense>
  </TresCanvas>
</template>
