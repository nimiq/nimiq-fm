<script setup lang="ts">
// Uses exact colors from useOrbConfig
const validatorColor = '#0095FF' // nodeEmissiveColor
const peerColor = '#CBD5E1' // from nodePalette
</script>

<template>
  <div class="w-full h-full">
    <!-- Validator node (larger, bright blue with glow) -->
    <div class="absolute top-0 right-0 floating-slow flex items-center gap-2">
      <span class="text-xs text-white/70">Validator</span>
      <div class="relative">
        <div class="absolute -inset-2 rounded-full blur-md opacity-60" :style="{ background: validatorColor }" />
        <div class="absolute -inset-1 rounded-full opacity-30" :style="{ background: validatorColor }" />
        <div 
          class="relative size-5 rounded-full"
          :style="{ 
            background: `radial-gradient(circle at 30% 30%, #e0f0ff 0%, ${validatorColor} 60%, #0066aa 100%)`,
            boxShadow: `0 0 20px ${validatorColor}, 0 0 40px ${validatorColor}50`
          }"
        />
      </div>
    </div>

    <!-- Peer node (smaller, dimmer white) -->
    <div class="absolute bottom-0 left-0 floating-fast flex items-center gap-2">
      <div class="relative">
        <div class="absolute -inset-1 rounded-full blur-sm opacity-30" style="background: white" />
        <div 
          class="relative size-3 rounded-full"
          :style="{ 
            background: `radial-gradient(circle at 30% 30%, #ffffff 0%, ${peerColor} 70%, #94A3B8 100%)`,
            boxShadow: '0 0 8px rgba(255,255,255,0.3)'
          }"
        />
      </div>
      <span class="text-xs text-white/50">Peer</span>
    </div>
  </div>
</template>

<style scoped>
.floating-slow {
  animation: float-slow 4s ease-in-out infinite;
}

.floating-fast {
  animation: float-fast 3s ease-in-out infinite;
  animation-delay: -1.5s;
}

@keyframes float-slow {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-4px, -6px); }
}

@keyframes float-fast {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(5px, -4px); }
}
</style>
