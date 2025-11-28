<script setup lang="ts">
// SVG animation of signal propagation, synchronized with the blockchain
const { onBlockEvent } = useBlockchain()
const trigger = ref(0)
const lastBlockTime = ref(0)

// Listen to block events to trigger the animation
// Using a key-changing technique to restart CSS animations
onMounted(() => {
  const cleanup = onBlockEvent(() => {
    trigger.value++
    lastBlockTime.value = Date.now()
  })

  // Fallback: If no blocks detected for > 2 seconds (e.g. disconnected), auto-pulse slowly
  // or just let the idle animation take over.
  // For now, we'll just rely on the heartbeat of the producer.
  
  onUnmounted(cleanup)
})
</script>

<template>
  <div class="propagation-demo relative select-none pointer-events-none w-full h-full flex items-center justify-center">
    <!-- Glow behind the producer -->
    <div class="absolute inset-0 bg-orange-500/10 blur-xl rounded-full scale-50 producer-glow" />

    <svg viewBox="0 0 160 100" class="w-full h-full overflow-visible drop-shadow-sm">
      <!-- Network connections (Static Background) -->
      <g stroke="rgba(255,255,255,0.08)" stroke-width="1" fill="none">
        <!-- Main Hub -->
        <path d="M80,50 L40,30" />
        <path d="M80,50 L120,30" />
        <path d="M80,50 L50,80" />
        <path d="M80,50 L110,75" />
        <path d="M80,50 L60,20" />
        <path d="M80,50 L100,20" />
        
        <!-- Secondary Connections -->
        <path d="M40,30 L20,50" />
        <path d="M120,30 L140,50" />
        <path d="M50,80 L30,70" />
        <path d="M110,75 L130,70" />
        
        <!-- Micro Interconnections -->
        <path d="M40,30 L60,20" />
        <path d="M120,30 L100,20" />
        <path d="M50,80 L60,90" />
        <path d="M110,75 L100,90" />
        <path d="M20,50 L30,70" />
        <path d="M140,50 L130,70" />
      </g>

      <!-- Active Animation Group: Re-rendered on block trigger -->
      <g :key="trigger">
        <!-- Propagating signals (Bright Orange) -->
        <g stroke="#F97316" stroke-width="2" stroke-linecap="round" fill="none">
          <path d="M80,50 L40,30" class="signal signal-1" />
          <path d="M80,50 L120,30" class="signal signal-2" />
          <path d="M80,50 L50,80" class="signal signal-3" />
          <path d="M80,50 L110,75" class="signal signal-4" />
          <path d="M80,50 L60,20" class="signal signal-5" />
          <path d="M80,50 L100,20" class="signal signal-6" />
        </g>

        <!-- Producer Flash -->
        <circle cx="80" cy="50" r="5" fill="#F97316" class="producer-flash" />

        <!-- Peer Hits (Flash when signal arrives) -->
        <g fill="#94A3B8">
          <!-- Tier 1 -->
          <circle cx="40" cy="30" r="3" class="peer peer-1" />
          <circle cx="120" cy="30" r="3" class="peer peer-2" />
          <circle cx="50" cy="80" r="3" class="peer peer-3" />
          <circle cx="110" cy="75" r="3" class="peer peer-4" />
          <circle cx="60" cy="20" r="2.5" class="peer peer-5" />
          <circle cx="100" cy="20" r="2.5" class="peer peer-6" />
          
          <!-- Tier 2 (Micro nodes) -->
          <circle cx="20" cy="50" r="2" class="peer peer-7" />
          <circle cx="140" cy="50" r="2" class="peer peer-8" />
          <circle cx="30" cy="70" r="2" class="peer peer-9" />
          <circle cx="130" cy="70" r="2" class="peer peer-10" />
          <circle cx="60" cy="90" r="1.5" class="peer peer-11" />
          <circle cx="100" cy="90" r="1.5" class="peer peer-12" />
        </g>
      </g>

      <!-- Static nodes (Base layer to prevent flickering when replacing key) -->
      <g fill="#475569">
         <circle cx="80" cy="50" r="5" fill="#EA580C" /> <!-- Producer Base -->
         <!-- Tier 1 -->
         <circle cx="40" cy="30" r="3" />
         <circle cx="120" cy="30" r="3" />
         <circle cx="50" cy="80" r="3" />
         <circle cx="110" cy="75" r="3" />
         <circle cx="60" cy="20" r="2.5" />
         <circle cx="100" cy="20" r="2.5" />
         <!-- Tier 2 -->
         <circle cx="20" cy="50" r="2" />
         <circle cx="140" cy="50" r="2" />
         <circle cx="30" cy="70" r="2" />
         <circle cx="130" cy="70" r="2" />
         <circle cx="60" cy="90" r="1.5" />
         <circle cx="100" cy="90" r="1.5" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
/* Producer Idle Glow */
.producer-glow {
  animation: glow-pulse 3s infinite ease-in-out;
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.1; transform: scale(0.5); }
  50% { opacity: 0.2; transform: scale(0.7); }
}

/* One-shot Animations triggered by key change */

.producer-flash {
  animation: flash-producer 0.5s ease-out forwards;
  transform-origin: center;
}

@keyframes flash-producer {
  0% { fill: #fff; transform: scale(1.5); }
  100% { fill: #F97316; transform: scale(1); }
}

.signal {
  stroke-dasharray: 12 100;
  stroke-dashoffset: 12;
  opacity: 0;
  animation: signal-travel 1s linear forwards;
}

/* Staggered delays for signals */
.signal-1 { animation-delay: 0.05s; }
.signal-2 { animation-delay: 0.08s; }
.signal-3 { animation-delay: 0.1s; }
.signal-4 { animation-delay: 0.12s; }
.signal-5 { animation-delay: 0.15s; }
.signal-6 { animation-delay: 0.18s; }

@keyframes signal-travel {
  0% { stroke-dashoffset: 12; opacity: 0; }
  10% { opacity: 1; }
  50% { opacity: 1; }
  100% { stroke-dashoffset: -60; opacity: 0; }
}

.peer {
  animation: peer-hit 0.6s ease-out forwards;
  transform-origin: center;
  fill: #475569; /* Start invisible/base color */
}

/* Staggered peer hits matching signal arrival */
.peer-1 { animation-delay: 0.2s; }
.peer-2 { animation-delay: 0.25s; }
.peer-3 { animation-delay: 0.3s; }
.peer-4 { animation-delay: 0.35s; }
.peer-5 { animation-delay: 0.3s; }
.peer-6 { animation-delay: 0.35s; }

/* Micro nodes hit later (simulated 2nd hop) */
.peer-7 { animation-delay: 0.4s; }
.peer-8 { animation-delay: 0.45s; }
.peer-9 { animation-delay: 0.5s; }
.peer-10 { animation-delay: 0.55s; }
.peer-11 { animation-delay: 0.5s; }
.peer-12 { animation-delay: 0.6s; }

@keyframes peer-hit {
  0% { fill: #475569; transform: scale(1); }
  20% { fill: #F97316; transform: scale(1.4); } /* Flash orange */
  100% { fill: #475569; transform: scale(1); }
}

circle {
  transform-box: fill-box;
}
</style>