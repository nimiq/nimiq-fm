<script setup lang="ts">
import { Environment, OrbitControls, Sparkles, Stars } from '@tresjs/cientos'
import { TresCanvas } from '@tresjs/core'
import { BloomPmndrs, EffectComposer, VignettePmndrs } from '@tresjs/post-processing'
import * as THREE from 'three'
import OrbMesh from './OrbMesh.vue'

defineProps<{
  audioData: number
}>()

// Background sphere geometry (inverted for inside view)
const bgSphereGeometry = new THREE.SphereGeometry(200, 32, 32)
// Flip normals to render inside
bgSphereGeometry.scale(-1, 1, 1)
</script>

<template>
  <TresCanvas
    :dpr="[1, 1.5]"
    :gl="{ antialias: false, alpha: true, toneMappingExposure: 1.3, powerPreference: 'high-performance' }"
    :clear-alpha="0"
  >
    <Suspense>
      <template #default>
        <TresGroup>
          <TresPerspectiveCamera :position="[0, 0, 40]" :fov="60" make-default />
          <!-- High-contrast studio environment -->
          <!-- @vue-ignore -->
          <Environment preset="studio" :blur="0.6" :background="false" />

          <TresAmbientLight :intensity="0.8" color="#ffffff" />

          <TresPointLight :position="[20, 10, 20]" :intensity="8" color="#ffffff" :distance="100" />
          <TresPointLight :position="[-20, -10, -10]" :intensity="4" color="#cbd5e1" :distance="100" />
          <TresPointLight :position="[0, 20, 0]" :intensity="4" color="#f8fafc" :distance="50" />

          <!-- Background sphere for deep navy gradient -->
          <TresMesh :geometry="bgSphereGeometry">
            <TresMeshBasicMaterial color="#0f1e3d" :side="THREE.BackSide" />
          </TresMesh>

          <Sparkles :count="80" :scale="45" :size="3" :speed="0.15" :opacity="0.2" color="#ffffff" />
          <Stars :radius="100" :depth="50" :count="800" :factor="4" :saturation="0" fade :speed="0.05" />

          <OrbMesh :audio-data="audioData" />

          <EffectComposer :enable-normal-pass="false">
            <BloomPmndrs
              :luminance-threshold="0.2"
              mipmap-blur
              :intensity="2.5"
              :radius="0.85"
              :levels="6"
            />
            <VignettePmndrs :eskil="false" :offset="0.15" :darkness="0.6" />
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
