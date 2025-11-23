<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { OrbitControls, Stars, Sparkles } from '@tresjs/cientos'
import { EffectComposerPmndrs, BloomPmndrs, NoisePmndrs, VignettePmndrs } from '@tresjs/post-processing'
import * as THREE from 'three'
import type { ValidatorNode, PeerNode, LinkData, Beam } from '~/types/orb'

const props = defineProps<{
  nodes: Array<ValidatorNode | PeerNode>
  links: LinkData[]
  validatorMap: Map<string, number>
  beams: Beam[]
  validatorCount: number
}>()

const glowMaterial = new THREE.ShaderMaterial({
  uniforms: {
    color: { value: new THREE.Color('#C0D0E0') },
  },
  vertexShader: `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    varying vec3 vNormal;
    void main() {
      float intensity = pow(abs(vNormal.z), 3.0);
      gl_FragColor = vec4(color, intensity * 0.8);
    }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  side: THREE.BackSide,
})
</script>

<template>
  <TresCanvas
    :clear-color="'#000000'"
    :tone-mapping="THREE.ACESFilmicToneMapping"
    :tone-mapping-exposure="1.2"
  >
    <!-- Central solid sphere -->
    <TresMesh :position="[0, 0, 0]">
      <TresSphereGeometry :args="[5, 32, 32]" />
      <TresMeshStandardMaterial 
        color="#607080" 
        :roughness="0.7" 
        :metalness="0.3"
        :emissive="'#304050'"
        :emissive-intensity="0.3"
      />
    </TresMesh>

    <!-- Glow layer -->
    <TresMesh :position="[0, 0, 0]">
      <TresSphereGeometry :args="[8, 32, 32]" />
      <primitive :object="glowMaterial" />
    </TresMesh>

    <TresPerspectiveCamera :position="[0, 0, 32]" :fov="35" />

    <TresAmbientLight :intensity="0.3" color="#101025" />
    <TresPointLight :position="[0, 0, 0]" :intensity="2" color="#00E5FF" :distance="20" :decay="2" />
    <TresPointLight :position="[30, 10, 20]" :intensity="15" color="#00E5FF" :distance="100" :decay="1" />
    <TresPointLight :position="[-30, -10, -10]" :intensity="15" color="#7C4DFF" :distance="100" :decay="1" />

    <Sparkles :count="100" :scale="25" :size="4" :speed="0.4" :opacity="0.5" color="#00E5FF" />
    <Sparkles :count="100" :scale="35" :size="6" :speed="0.2" :opacity="0.4" color="#00E5FF" />
    <Stars :position="[0, 0, -40]" :radius="100" :depth="50" :count="1000" :factor="4" :saturation="0.5" :fade="true" :speed="0.2" />

    <OrbMesh :nodes="nodes" :links="links" :validator-map="validatorMap" :beams="beams" :validator-count="validatorCount" />

    <Suspense>
      <EffectComposerPmndrs>
        <BloomPmndrs :luminance-threshold="0.2" :intensity="1.0" :radius="0.5" :levels="8" :mipmapBlur="true" />
        <!-- <NoisePmndrs :opacity="0.05" /> -->
        <VignettePmndrs :offset="0.1" :darkness="0.6" />
      </EffectComposerPmndrs>
    </Suspense>

    <OrbitControls :enable-pan="false" :enable-zoom="true" :min-distance="15" :max-distance="70" :auto-rotate="true" :auto-rotate-speed="0.3" />
  </TresCanvas>
</template>
