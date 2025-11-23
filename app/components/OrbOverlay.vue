<script setup lang="ts">
defineProps<{
  blockHeight: number
}>()
</script>

<template>
  <div class="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between">
    <!-- Header -->
    <div class="flex justify-between items-start p-8">
      <div>
        <!-- Title: Platinum/Silver Gradient -->
        <h1 class="text-4xl md:text-6xl font-bold text-white font-['Orbitron'] tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500 drop-shadow-lg">
          NIMIQ
        </h1>
        <h2 class="text-xl text-slate-400 font-['Rajdhani'] tracking-widest opacity-90">
          NETWORK VISUALIZER
        </h2>
      </div>
      <div class="text-right">
        <div class="text-xs text-slate-500 uppercase tracking-widest mb-1">
          Current Block
        </div>
        <div class="text-4xl font-['Orbitron'] text-white tabular-nums">
          #{{ blockHeight.toLocaleString() }}
        </div>
        <div class="flex items-center justify-end gap-2 mt-2">
          <span class="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_#ffffff]" />
          <span class="text-xs text-slate-300 font-mono">LIVE</span>
        </div>
      </div>
    </div>

    <!-- Blockchain Viewer -->
    <div class="w-full bg-gradient-to-t from-[#020617] via-[#020617]/80 to-transparent pt-12 pb-4">
      <BlockchainViewer :current-block-height="blockHeight" />
    </div>
  </div>
</template>