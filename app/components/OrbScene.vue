<script setup lang="ts">
import { Environment, OrbitControls, Sparkles, Stars } from '@tresjs/cientos'
import { TresCanvas } from '@tresjs/core'
import { BloomPmndrs, EffectComposer, VignettePmndrs } from '@tresjs/post-processing'
import * as THREE from 'three'
import OrbMesh from './OrbMesh.vue'

defineProps<{ audioData: number }>()

const { config } = useOrbConfig()

// Background sphere geometry (inverted for inside view)
const bgSphereGeometry = new THREE.SphereGeometry(200, 32, 32)
bgSphereGeometry.scale(-1, 1, 1)

// Lazy load environment for better initial performance
const showEnvironment = ref(false)
onMounted(() => {
  // Delay environment loading to prioritize initial render
  setTimeout(() => {
    showEnvironment.value = true
  }, 150)
})
</script>

<template>
  <TresCanvas :dpr="[1, 1.5]" :gl="{ antialias: false, alpha: true, toneMappingExposure: 1.3, powerPreference: 'high-performance' }" :clear-alpha="0">
    <Suspense>
      <template #default>
        <TresGroup>
          <TresPerspectiveCamera :position="[0, 0, config.cameraPositionZ]" :fov="config.cameraFov" make-default />
          <Environment v-if="showEnvironment" preset="studio" :background="false" />

          <TresAmbientLight :intensity="config.ambientLightIntensity" color="#ffffff" />
          <TresPointLight :position="[20, 10, 20]" :intensity="config.mainLightIntensity" color="#ffffff" :distance="100" />
          <TresPointLight :position="[-20, -10, -10]" :intensity="config.fillLightIntensity" color="#cbd5e1" :distance="100" />
          <TresPointLight :position="[0, 20, 0]" :intensity="config.topLightIntensity" color="#f8fafc" :distance="50" />

          <TresMesh :geometry="bgSphereGeometry">
            <TresMeshBasicMaterial :color="config.colorBg" :side="THREE.BackSide" />
          </TresMesh>

          <Sparkles :count="config.sparklesCount" :scale="config.sparklesScale" :size="config.sparklesSize" :speed="config.sparklesSpeed" :opacity="config.sparklesOpacity" color="#ffffff" />
          <Stars :radius="config.starsRadius" :depth="config.starsDepth" :count="config.starsCount" :factor="4" :saturation="0" fade :speed="config.starsSpeed" />

          <OrbMesh :audio-data="audioData" />

          <EffectComposer :enable-normal-pass="false">
            <BloomPmndrs :luminance-threshold="config.bloom.threshold" mipmap-blur :intensity="config.bloom.intensity" :radius="config.bloom.radius" :levels="6" />
            <VignettePmndrs :eskil="false" :offset="config.vignette.offset" :darkness="config.vignette.darkness" />
          </EffectComposer>

          <OrbitControls :enable-pan="false" :enable-zoom="true" :enable-rotate="true" :min-distance="config.orbitMinDistance" :max-distance="config.orbitMaxDistance" auto-rotate :auto-rotate-speed="config.autoRotateSpeed" />
        </TresGroup>
      </template>
    </Suspense>
  </TresCanvas>
</template>
