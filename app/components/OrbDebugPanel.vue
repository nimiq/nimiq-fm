<script setup lang="ts">
const { config, metrics, reset, resetGroup, regenerateGraph } = useOrbConfig()
const { connectionState, lastBlockTimestamp, peerCount } = useBlockchain()
const isOpen = ref(false)
const showResetAlert = ref(false)

const timeSinceLastBlock = computed(() => {
  if (!lastBlockTimestamp.value)
    return 0
  return Math.floor((Date.now() - lastBlockTimestamp.value) / 1000)
})

async function copyConfigAsJson() {
  await navigator.clipboard.writeText(JSON.stringify(config.value, null, 2))
}

function confirmReset() {
  localStorage.removeItem('orb-debug-config')
  reset()
  showResetAlert.value = false
  window.location.reload()
}
</script>

<template>
  <div v-if="isOpen" class="w-96 max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl text-white text-sm">
    <!-- Header with stats -->
    <div class="flex items-center gap-3 p-3 border-b border-white/10">
      <UIcon name="i-heroicons-cog-6-tooth" class="size-4 shrink-0" />
      <span class="font-semibold shrink-0">Orb Debug</span>
      <div class="flex-1 flex items-center justify-end gap-4 text-xs font-mono text-white/70">
        <span>{{ metrics.fps.toFixed(0) }} fps</span>
        <span>{{ metrics.activeNodes }} nodes</span>
        <span>{{ metrics.connectedLinks }} links</span>
      </div>
      <UButton icon="i-heroicons-x-mark" size="xs" color="neutral" variant="ghost" @click="isOpen = false" />
    </div>

    <div class="p-2 space-y-2">
      <!-- Performance -->
      <UCollapsible default-open>
        <UButton block color="neutral" variant="ghost" class="justify-between">
          <span class="flex items-center gap-2"><UIcon name="i-heroicons-cpu-chip" class="size-4" /> Performance</span>
          <template #trailing>
            <UIcon name="i-heroicons-chevron-down" class="size-4 transition-transform group-data-[state=open]:rotate-180" />
          </template>
        </UButton>
        <template #content>
          <div class="space-y-2 pt-2 pb-2 text-xs font-mono text-white/80">
            <div class="flex justify-between">
              <span>FPS</span><span>{{ metrics.fps.toFixed(1) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Frame Time</span><span>{{ metrics.totalFrameTime.toFixed(2) }} ms</span>
            </div>
            <div class="flex justify-between pl-2 border-l border-white/10">
              <span>Nodes Update</span><span>{{ metrics.nodeUpdateTime.toFixed(2) }} ms</span>
            </div>
            <div class="flex justify-between pl-2 border-l border-white/10">
              <span>Links Update</span><span>{{ metrics.linkUpdateTime.toFixed(2) }} ms</span>
            </div>
            <div class="flex justify-between">
              <span>Heap Used</span><span>{{ metrics.heapUsed.toFixed(1) }} MB</span>
            </div>
            <div class="flex justify-between pl-2 border-l border-white/10">
              <span>Mobile</span><span :class="metrics.isMobile ? 'text-green-400' : 'text-white/50'">{{ metrics.isMobile ? 'Yes' : 'No' }}</span>
            </div>
            <div class="flex justify-between pl-2 border-l border-white/10">
              <span>RAM</span><span>{{ metrics.deviceMemory }} GB</span>
            </div>
          </div>
        </template>
      </UCollapsible>

      <!-- Connection -->
      <UCollapsible>
        <UButton block color="neutral" variant="ghost" class="justify-between">
          <span class="flex items-center gap-2"><UIcon name="i-heroicons-signal" class="size-4" /> Connection</span>
          <template #trailing>
            <UIcon name="i-heroicons-chevron-down" class="size-4 transition-transform group-data-[state=open]:rotate-180" />
          </template>
        </UButton>
        <template #content>
          <div class="space-y-2 pt-2 pb-2 text-xs font-mono text-white/80">
            <div class="flex justify-between">
              <span>State</span>
              <span
                :class="{
                  'text-gray-400': connectionState === 'loading-wasm',
                  'text-red-400': connectionState === 'wasm-failed' || connectionState === 'disconnected',
                  'text-yellow-400': connectionState === 'connecting',
                  'text-blue-400': connectionState === 'syncing',
                  'text-green-400': connectionState === 'established',
                }"
              >{{ connectionState }}</span>
            </div>
            <div class="flex justify-between">
              <span>Last Block</span><span>{{ timeSinceLastBlock }}s ago</span>
            </div>
            <div class="flex justify-between">
              <span>Peer Count</span><span>{{ peerCount }}</span>
            </div>
          </div>
        </template>
      </UCollapsible>

      <!-- Mobile Optimization -->
      <UCollapsible>
        <UButton block color="neutral" variant="ghost" class="justify-between">
          <span class="flex items-center gap-2"><UIcon name="i-heroicons-device-phone-mobile" class="size-4" /> Mobile Optimization</span>
          <template #trailing>
            <UIcon name="i-heroicons-chevron-down" class="size-4 transition-transform group-data-[state=open]:rotate-180" />
          </template>
        </UButton>
        <template #content>
          <div class="space-y-3 pt-2">
            <div class="flex items-center justify-between">
              <label class="text-xs text-white/60">Enabled</label>
              <USwitch v-model="config.mobile.enabled" size="sm" />
            </div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Max Nodes</span><span class="font-mono">{{ config.mobile.maxNodes }}</span></label><USlider v-model="config.mobile.maxNodes" :min="50" :max="500" :step="10" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Curve Segments</span><span class="font-mono">{{ config.mobile.curveSegments }}</span></label><USlider v-model="config.mobile.curveSegments" :min="1" :max="4" :step="1" class="mt-1" /></div>
            <div class="flex items-center justify-between">
              <label class="text-xs text-white/60">Disable Bloom</label>
              <USwitch v-model="config.mobile.disableBloom" size="sm" />
            </div>
            <div class="flex items-center justify-between">
              <label class="text-xs text-white/60">Disable Sparkles</label>
              <USwitch v-model="config.mobile.disableSparkles" size="sm" />
            </div>
            <div class="flex items-center justify-between">
              <label class="text-xs text-white/60">Simp. Lighting</label>
              <USwitch v-model="config.mobile.simplifiedLighting" size="sm" />
            </div>
            <UButton size="xs" color="neutral" variant="ghost" @click="resetGroup('mobile')">
              Reset
            </UButton>
          </div>
        </template>
      </UCollapsible>

      <!-- Geometry -->
      <UCollapsible>
        <UButton block color="neutral" variant="ghost" class="justify-between">
          <span class="flex items-center gap-2"><UIcon name="i-heroicons-cube" class="size-4" /> Geometry</span>
          <template #trailing>
            <UIcon name="i-heroicons-chevron-down" class="size-4 transition-transform group-data-[state=open]:rotate-180" />
          </template>
        </UButton>
        <template #content>
          <div class="space-y-3 pt-2">
            <div><label class="text-xs text-white/60 flex justify-between"><span>Orb Radius</span><span class="font-mono">{{ config.orbRadius }}</span></label><USlider v-model="config.orbRadius" :min="5" :max="30" :step="1" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Node Count</span><span class="font-mono">{{ config.nodeCount }}</span></label><USlider v-model="config.nodeCount" :min="100" :max="2000" :step="50" class="mt-1" /></div>
            <div class="flex gap-2">
              <UButton size="xs" color="primary" @click="regenerateGraph">
                Regenerate
              </UButton>
              <UButton size="xs" color="neutral" variant="ghost" @click="resetGroup('geometry')">
                Reset
              </UButton>
            </div>
          </div>
        </template>
      </UCollapsible>

      <!-- Node Appearance -->
      <UCollapsible>
        <UButton block color="neutral" variant="ghost" class="justify-between">
          <span class="flex items-center gap-2"><UIcon name="i-heroicons-cube-transparent" class="size-4" /> Node Appearance</span>
          <template #trailing>
            <UIcon name="i-heroicons-chevron-down" class="size-4 transition-transform group-data-[state=open]:rotate-180" />
          </template>
        </UButton>
        <template #content>
          <div class="space-y-3 pt-2">
            <div><label class="text-xs text-white/60 flex justify-between"><span>Peer Scale</span><span class="font-mono">{{ config.peerNodeScale.toFixed(2) }}</span></label><USlider v-model="config.peerNodeScale" :min="0.1" :max="1" :step="0.01" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Validator Scale</span><span class="font-mono">{{ config.validatorNodeScale.toFixed(2) }}</span></label><USlider v-model="config.validatorNodeScale" :min="0.1" :max="2" :step="0.01" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Halo Scale</span><span class="font-mono">{{ config.nodeHaloScale.toFixed(1) }}</span></label><USlider v-model="config.nodeHaloScale" :min="1" :max="5" :step="0.1" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Noise Amplitude</span><span class="font-mono">{{ config.nodeNoiseAmplitude.toFixed(2) }}</span></label><USlider v-model="config.nodeNoiseAmplitude" :min="0" :max="0.2" :step="0.01" class="mt-1" /></div>
            <UButton size="xs" color="neutral" variant="ghost" @click="resetGroup('nodeAppearance')">
              Reset
            </UButton>
          </div>
        </template>
      </UCollapsible>

      <!-- Timing -->
      <UCollapsible>
        <UButton block color="neutral" variant="ghost" class="justify-between">
          <span class="flex items-center gap-2"><UIcon name="i-heroicons-clock" class="size-4" /> Timing</span>
          <template #trailing>
            <UIcon name="i-heroicons-chevron-down" class="size-4 transition-transform group-data-[state=open]:rotate-180" />
          </template>
        </UButton>
        <template #content>
          <div class="space-y-3 pt-2">
            <div><label class="text-xs text-white/60 flex justify-between"><span>Beam Propagation (ms)</span><span class="font-mono">{{ config.beamPropagationTimeMs }}</span></label><USlider v-model="config.beamPropagationTimeMs" :min="200" :max="3000" :step="100" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Peer Lifetime (ms)</span><span class="font-mono">{{ config.peerLifetimeMs }}</span></label><USlider v-model="config.peerLifetimeMs" :min="5000" :max="60000" :step="1000" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Peer Transition (ms)</span><span class="font-mono">{{ config.peerTransitionMs }}</span></label><USlider v-model="config.peerTransitionMs" :min="500" :max="5000" :step="100" class="mt-1" /></div>
            <UButton size="xs" color="neutral" variant="ghost" @click="resetGroup('timing')">
              Reset
            </UButton>
          </div>
        </template>
      </UCollapsible>

      <!-- Animation -->
      <UCollapsible>
        <UButton block color="neutral" variant="ghost" class="justify-between">
          <span class="flex items-center gap-2"><UIcon name="i-heroicons-play" class="size-4" /> Animation</span>
          <template #trailing>
            <UIcon name="i-heroicons-chevron-down" class="size-4 transition-transform group-data-[state=open]:rotate-180" />
          </template>
        </UButton>
        <template #content>
          <div class="space-y-3 pt-2">
            <div><label class="text-xs text-white/60 flex justify-between"><span>Validator Rotation</span><span class="font-mono">{{ config.validatorRotationSpeed.toFixed(2) }}</span></label><USlider v-model="config.validatorRotationSpeed" :min="0" :max="1" :step="0.01" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Group Rotation</span><span class="font-mono">{{ config.groupRotationSpeed.toFixed(3) }}</span></label><USlider v-model="config.groupRotationSpeed" :min="0" :max="0.1" :step="0.001" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Rotation X Amplitude</span><span class="font-mono">{{ config.groupRotationXAmplitude.toFixed(2) }}</span></label><USlider v-model="config.groupRotationXAmplitude" :min="0" :max="0.2" :step="0.01" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Rotation Z Amplitude</span><span class="font-mono">{{ config.groupRotationZAmplitude.toFixed(2) }}</span></label><USlider v-model="config.groupRotationZAmplitude" :min="0" :max="0.1" :step="0.005" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Auto Rotate Speed</span><span class="font-mono">{{ config.autoRotateSpeed.toFixed(2) }}</span></label><USlider v-model="config.autoRotateSpeed" :min="0" :max="1" :step="0.01" class="mt-1" /></div>
            <UButton size="xs" color="neutral" variant="ghost" @click="resetGroup('animation')">
              Reset
            </UButton>
          </div>
        </template>
      </UCollapsible>

      <!-- Beam Effects -->
      <UCollapsible>
        <UButton block color="neutral" variant="ghost" class="justify-between">
          <span class="flex items-center gap-2"><UIcon name="i-heroicons-bolt" class="size-4" /> Beam Effects</span>
          <template #trailing>
            <UIcon name="i-heroicons-chevron-down" class="size-4 transition-transform group-data-[state=open]:rotate-180" />
          </template>
        </UButton>
        <template #content>
          <div class="space-y-3 pt-2">
            <div><label class="text-xs text-white/60 flex justify-between"><span>Wave Width</span><span class="font-mono">{{ config.beamWaveWidth.toFixed(1) }}</span></label><USlider v-model="config.beamWaveWidth" :min="1" :max="20" :step="0.5" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Intensity Multiplier</span><span class="font-mono">{{ config.beamIntensityMultiplier.toFixed(2) }}</span></label><USlider v-model="config.beamIntensityMultiplier" :min="0" :max="2" :step="0.05" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Scale Multiplier</span><span class="font-mono">{{ config.beamScaleMultiplier.toFixed(2) }}</span></label><USlider v-model="config.beamScaleMultiplier" :min="0" :max="3" :step="0.1" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Max Distance Mult</span><span class="font-mono">{{ config.beamMaxDistanceMultiplier.toFixed(1) }}</span></label><USlider v-model="config.beamMaxDistanceMultiplier" :min="1" :max="5" :step="0.1" class="mt-1" /></div>
            <UButton size="xs" color="neutral" variant="ghost" @click="resetGroup('beamEffects')">
              Reset
            </UButton>
          </div>
        </template>
      </UCollapsible>

      <!-- Validator Flash -->
      <UCollapsible>
        <UButton block color="neutral" variant="ghost" class="justify-between">
          <span class="flex items-center gap-2"><UIcon name="i-heroicons-light-bulb" class="size-4" /> Validator Flash</span>
          <template #trailing>
            <UIcon name="i-heroicons-chevron-down" class="size-4 transition-transform group-data-[state=open]:rotate-180" />
          </template>
        </UButton>
        <template #content>
          <div class="space-y-3 pt-2">
            <div><label class="text-xs text-white/60 flex justify-between"><span>Flash Duration (s)</span><span class="font-mono">{{ config.flashDuration.toFixed(1) }}</span></label><USlider v-model="config.flashDuration" :min="0.5" :max="5" :step="0.1" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Grow Time (s)</span><span class="font-mono">{{ config.flashGrowTime.toFixed(1) }}</span></label><USlider v-model="config.flashGrowTime" :min="0.1" :max="2" :step="0.1" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Scale Multiplier</span><span class="font-mono">{{ config.flashScaleMultiplier.toFixed(2) }}</span></label><USlider v-model="config.flashScaleMultiplier" :min="0" :max="1" :step="0.05" class="mt-1" /></div>
            <UButton size="xs" color="neutral" variant="ghost" @click="resetGroup('validatorFlash')">
              Reset
            </UButton>
          </div>
        </template>
      </UCollapsible>

      <!-- Links -->
      <UCollapsible>
        <UButton block color="neutral" variant="ghost" class="justify-between">
          <span class="flex items-center gap-2"><UIcon name="i-heroicons-link" class="size-4" /> Links</span>
          <template #trailing>
            <UIcon name="i-heroicons-chevron-down" class="size-4 transition-transform group-data-[state=open]:rotate-180" />
          </template>
        </UButton>
        <template #content>
          <div class="space-y-3 pt-2">
            <div><label class="text-xs text-white/60 flex justify-between"><span>Rewire Distance</span><span class="font-mono">{{ config.linkRewireDistance.toFixed(1) }}</span></label><USlider v-model="config.linkRewireDistance" :min="1" :max="15" :step="0.5" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Arch Height</span><span class="font-mono">{{ config.linkArchHeight.toFixed(2) }}</span></label><USlider v-model="config.linkArchHeight" :min="0" :max="0.5" :step="0.01" class="mt-1" /></div>
            <UButton size="xs" color="neutral" variant="ghost" @click="resetGroup('links')">
              Reset
            </UButton>
          </div>
        </template>
      </UCollapsible>

      <!-- Colors -->
      <UCollapsible>
        <UButton block color="neutral" variant="ghost" class="justify-between">
          <span class="flex items-center gap-2"><UIcon name="i-heroicons-swatch" class="size-4" /> Colors</span>
          <template #trailing>
            <UIcon name="i-heroicons-chevron-down" class="size-4 transition-transform group-data-[state=open]:rotate-180" />
          </template>
        </UButton>
        <template #content>
          <div class="space-y-3 pt-2">
            <div class="flex items-center justify-between">
              <label class="text-xs text-white/60">Background</label><input v-model="config.colorBg" type="color" class="size-6 rounded cursor-pointer border-0">
            </div>
            <div class="flex items-center justify-between">
              <label class="text-xs text-white/60">Link</label><input v-model="config.colorLink" type="color" class="size-6 rounded cursor-pointer border-0">
            </div>
            <div class="flex items-center justify-between">
              <label class="text-xs text-white/60">Beam</label><input v-model="config.beamColor" type="color" class="size-6 rounded cursor-pointer border-0">
            </div>
            <div class="flex items-center justify-between">
              <label class="text-xs text-white/60">Validator</label><input v-model="config.validatorColor" type="color" class="size-6 rounded cursor-pointer border-0">
            </div>
            <div class="flex items-center justify-between">
              <label class="text-xs text-white/60">Edge</label><input v-model="config.edgeColor" type="color" class="size-6 rounded cursor-pointer border-0">
            </div>
            <div class="flex items-center justify-between">
              <label class="text-xs text-white/60">Node Emissive</label><input v-model="config.nodeEmissiveColor" type="color" class="size-6 rounded cursor-pointer border-0">
            </div>
            <div class="flex items-center justify-between">
              <label class="text-xs text-white/60">Halo</label><input v-model="config.haloColor" type="color" class="size-6 rounded cursor-pointer border-0">
            </div>
            <div>
              <label class="text-xs text-white/60 mb-1 block">Node Palette</label>
              <div class="flex gap-1">
                <input v-for="(_, i) in config.nodePalette" :key="i" v-model="config.nodePalette[i]" type="color" class="size-6 rounded cursor-pointer border-0">
              </div>
            </div>
            <UButton size="xs" color="neutral" variant="ghost" @click="resetGroup('colors')">
              Reset
            </UButton>
          </div>
        </template>
      </UCollapsible>

      <!-- Lighting -->
      <UCollapsible>
        <UButton block color="neutral" variant="ghost" class="justify-between">
          <span class="flex items-center gap-2"><UIcon name="i-heroicons-sun" class="size-4" /> Lighting</span>
          <template #trailing>
            <UIcon name="i-heroicons-chevron-down" class="size-4 transition-transform group-data-[state=open]:rotate-180" />
          </template>
        </UButton>
        <template #content>
          <div class="space-y-3 pt-2">
            <div><label class="text-xs text-white/60 flex justify-between"><span>Ambient</span><span class="font-mono">{{ config.ambientLightIntensity.toFixed(1) }}</span></label><USlider v-model="config.ambientLightIntensity" :min="0" :max="2" :step="0.1" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Main Light</span><span class="font-mono">{{ config.mainLightIntensity }}</span></label><USlider v-model="config.mainLightIntensity" :min="0" :max="20" :step="1" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Fill Light</span><span class="font-mono">{{ config.fillLightIntensity }}</span></label><USlider v-model="config.fillLightIntensity" :min="0" :max="10" :step="1" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Top Light</span><span class="font-mono">{{ config.topLightIntensity }}</span></label><USlider v-model="config.topLightIntensity" :min="0" :max="10" :step="1" class="mt-1" /></div>
            <UButton size="xs" color="neutral" variant="ghost" @click="resetGroup('lighting')">
              Reset
            </UButton>
          </div>
        </template>
      </UCollapsible>

      <!-- Camera -->
      <UCollapsible>
        <UButton block color="neutral" variant="ghost" class="justify-between">
          <span class="flex items-center gap-2"><UIcon name="i-heroicons-camera" class="size-4" /> Camera</span>
          <template #trailing>
            <UIcon name="i-heroicons-chevron-down" class="size-4 transition-transform group-data-[state=open]:rotate-180" />
          </template>
        </UButton>
        <template #content>
          <div class="space-y-3 pt-2">
            <div><label class="text-xs text-white/60 flex justify-between"><span>Position Z</span><span class="font-mono">{{ config.cameraPositionZ }}</span></label><USlider v-model="config.cameraPositionZ" :min="20" :max="100" :step="1" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>FOV</span><span class="font-mono">{{ config.cameraFov }}</span></label><USlider v-model="config.cameraFov" :min="30" :max="120" :step="1" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Min Distance</span><span class="font-mono">{{ config.orbitMinDistance }}</span></label><USlider v-model="config.orbitMinDistance" :min="5" :max="50" :step="1" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Max Distance</span><span class="font-mono">{{ config.orbitMaxDistance }}</span></label><USlider v-model="config.orbitMaxDistance" :min="50" :max="200" :step="5" class="mt-1" /></div>
            <UButton size="xs" color="neutral" variant="ghost" @click="resetGroup('camera')">
              Reset
            </UButton>
          </div>
        </template>
      </UCollapsible>

      <!-- Post-processing -->
      <UCollapsible>
        <UButton block color="neutral" variant="ghost" class="justify-between">
          <span class="flex items-center gap-2"><UIcon name="i-heroicons-sparkles" class="size-4" /> Post-processing</span>
          <template #trailing>
            <UIcon name="i-heroicons-chevron-down" class="size-4 transition-transform group-data-[state=open]:rotate-180" />
          </template>
        </UButton>
        <template #content>
          <div class="space-y-3 pt-2">
            <div class="text-xs text-white/40 font-medium">
              Bloom
            </div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Threshold</span><span class="font-mono">{{ config.bloom.threshold.toFixed(2) }}</span></label><USlider v-model="config.bloom.threshold" :min="0" :max="1" :step="0.01" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Intensity</span><span class="font-mono">{{ config.bloom.intensity.toFixed(1) }}</span></label><USlider v-model="config.bloom.intensity" :min="0" :max="10" :step="0.1" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Radius</span><span class="font-mono">{{ config.bloom.radius.toFixed(2) }}</span></label><USlider v-model="config.bloom.radius" :min="0" :max="2" :step="0.01" class="mt-1" /></div>
            <div class="text-xs text-white/40 font-medium mt-4">
              Vignette
            </div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Offset</span><span class="font-mono">{{ config.vignette.offset.toFixed(2) }}</span></label><USlider v-model="config.vignette.offset" :min="0" :max="1" :step="0.01" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Darkness</span><span class="font-mono">{{ config.vignette.darkness.toFixed(2) }}</span></label><USlider v-model="config.vignette.darkness" :min="0" :max="1" :step="0.01" class="mt-1" /></div>
            <UButton size="xs" color="neutral" variant="ghost" @click="resetGroup('postProcessing')">
              Reset
            </UButton>
          </div>
        </template>
      </UCollapsible>

      <!-- Background Effects -->
      <UCollapsible>
        <UButton block color="neutral" variant="ghost" class="justify-between">
          <span class="flex items-center gap-2"><UIcon name="i-heroicons-star" class="size-4" /> Background</span>
          <template #trailing>
            <UIcon name="i-heroicons-chevron-down" class="size-4 transition-transform group-data-[state=open]:rotate-180" />
          </template>
        </UButton>
        <template #content>
          <div class="space-y-3 pt-2">
            <div class="text-xs text-white/40 font-medium">
              Sparkles
            </div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Count</span><span class="font-mono">{{ config.sparklesCount }}</span></label><USlider v-model="config.sparklesCount" :min="0" :max="200" :step="10" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Scale</span><span class="font-mono">{{ config.sparklesScale }}</span></label><USlider v-model="config.sparklesScale" :min="10" :max="100" :step="5" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Size</span><span class="font-mono">{{ config.sparklesSize }}</span></label><USlider v-model="config.sparklesSize" :min="1" :max="10" :step="0.5" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Speed</span><span class="font-mono">{{ config.sparklesSpeed.toFixed(2) }}</span></label><USlider v-model="config.sparklesSpeed" :min="0" :max="1" :step="0.05" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Opacity</span><span class="font-mono">{{ config.sparklesOpacity.toFixed(2) }}</span></label><USlider v-model="config.sparklesOpacity" :min="0" :max="1" :step="0.05" class="mt-1" /></div>
            <div class="text-xs text-white/40 font-medium mt-4">
              Stars
            </div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Count</span><span class="font-mono">{{ config.starsCount }}</span></label><USlider v-model="config.starsCount" :min="0" :max="2000" :step="100" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Radius</span><span class="font-mono">{{ config.starsRadius }}</span></label><USlider v-model="config.starsRadius" :min="50" :max="200" :step="10" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Depth</span><span class="font-mono">{{ config.starsDepth }}</span></label><USlider v-model="config.starsDepth" :min="10" :max="100" :step="5" class="mt-1" /></div>
            <div><label class="text-xs text-white/60 flex justify-between"><span>Speed</span><span class="font-mono">{{ config.starsSpeed.toFixed(2) }}</span></label><USlider v-model="config.starsSpeed" :min="0" :max="0.5" :step="0.01" class="mt-1" /></div>
            <UButton size="xs" color="neutral" variant="ghost" @click="resetGroup('background')">
              Reset
            </UButton>
          </div>
        </template>
      </UCollapsible>
    </div>

    <!-- Footer actions -->
    <div class="p-3 border-t border-white/10 space-y-2">
      <div class="flex gap-2">
        <UButton block size="sm" color="neutral" variant="soft" icon="i-heroicons-clipboard-document" @click="copyConfigAsJson">
          Copy JSON
        </UButton>
        <UButton block size="sm" color="error" variant="soft" @click="showResetAlert = true">
          Reset All
        </UButton>
      </div>

      <UAlert v-if="showResetAlert" color="error" variant="soft" title="Reset all settings?" description="This will clear localStorage and reload the page.">
        <template #actions>
          <UButton size="xs" color="error" @click="confirmReset">
            Confirm
          </UButton>
          <UButton size="xs" color="neutral" variant="ghost" @click="showResetAlert = false">
            Cancel
          </UButton>
        </template>
      </UAlert>
    </div>
  </div>

  <UButton v-else icon="i-heroicons-cog-6-tooth" size="sm" color="neutral" variant="soft" class="opacity-50 hover:opacity-100" @click="isOpen = true" />
</template>
