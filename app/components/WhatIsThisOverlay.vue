<script setup lang="ts">
import { AnimatePresence, Motion } from 'motion-v'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function closeModal() {
  emit('update:modelValue', false)
}

// ESC key handler
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.modelValue) {
      closeModal()
    }
  }
  window.addEventListener('keydown', handleEscape)
  onUnmounted(() => window.removeEventListener('keydown', handleEscape))
})

// Body scroll lock
watch(() => props.modelValue, (isOpen) => {
  if (process.client) {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  }
})
</script>

<template>
  <div>
    <AnimatePresence>
      <!-- Overlay -->
      <Motion
        v-if="modelValue"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        :transition="{ duration: 0.2 }"
        class="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        @click="closeModal"
      />

      <!-- Modal Content -->
      <Motion
        v-if="modelValue"
        :initial="{ opacity: 0, scale: 0.95, y: 20 }"
        :animate="{ opacity: 1, scale: 1, y: 0 }"
        :exit="{ opacity: 0, scale: 0.95, y: 20 }"
        :transition="{ duration: 0.3, ease: 'easeOut' }"
        class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl flex flex-col"
        @click.stop
      >
      <!-- Header -->
      <div class="shrink-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-4 sm:p-6 flex items-center justify-between">
        <h2 class="text-xl sm:text-2xl font-semibold text-white">
          What is Nimiq Song?
        </h2>
        <UButton
          icon="i-heroicons-x-mark"
          size="sm"
          color="neutral"
          variant="ghost"
          class="cursor-pointer"
          @click="closeModal"
        />
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-sm sm:text-base">
        <!-- Introduction -->
        <section>
          <p class="text-white/70 leading-relaxed">
            Nimiq Song is an interactive audiovisual experience that transforms the Nimiq blockchain into music and art. Watch validators produce blocks in real-time while unique generative music patterns play based on blockchain data.
          </p>
        </section>

        <!-- How It Works -->
        <section>
          <h3 class="text-lg font-semibold text-white mb-3">
            How It Works
          </h3>
          <div class="space-y-2 text-white/70 leading-relaxed">
            <p>
              Nimiq Song connects to the Nimiq blockchain in real-time and monitors validator activity. Each block produced triggers a unique sound pattern generated using the Strudel live coding library.
            </p>
            <p>
              The app cycles through 5 different songs—Milky Way, Acid, Desert Dune, Running Away, and Qimin—rotating every 3 batches based on the blockchain's epoch system. <strong class="text-white/90 cursor-default">Turn on audio to hear the blockchain sing!</strong>
            </p>
          </div>
        </section>

        <!-- Understanding the UI -->
        <section>
          <h3 class="text-lg font-semibold text-white mb-3">
            Understanding the UI
          </h3>
          <div class="space-y-4 text-white/70 leading-relaxed">
            <div>
              <h4 class="text-white/90 font-medium mb-1">
                The Orb (3D Visualization)
              </h4>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li><strong class="text-white/90">Nodes:</strong> Each node represents a real validator from the Nimiq network</li>
                <li><strong class="text-white/90">Beams:</strong> When you see a beam shoot from a node, that validator just produced a block (this is real data!)</li>
                <li><strong class="text-white/90">Links between nodes:</strong> These connections represent the network interconnection between validators and web clients (artistic visualization)</li>
              </ul>
            </div>

            <div>
              <h4 class="text-white/90 font-medium mb-1">
                Validators Panel
              </h4>
              <p>
                Shows the top validators with their logos. When a validator produces a block, their logo glows orange. Click the panel to expand and see all validators.
              </p>
            </div>

            <div>
              <h4 class="text-white/90 font-medium mb-1">
                Blockchain Viewer
              </h4>
              <p>
                Displays batches and blocks in a grid. Gray blocks haven't been played yet, white blocks have been played, and orange blocks are currently being processed.
              </p>
            </div>

            <div>
              <h4 class="text-white/90 font-medium mb-1">
                Now Playing Section
              </h4>
              <p>
                Shows the current song, epoch number, and what's coming up next.
              </p>
            </div>
          </div>
        </section>

        <!-- About Nimiq -->
        <section>
          <h3 class="text-lg font-semibold text-white mb-3">
            About Nimiq
          </h3>
          <p class="text-white/70 leading-relaxed">
            Nimiq is a blockchain designed to be easy to use and accessible to everyone. With its browser-first approach and proof-of-stake consensus, Nimiq makes blockchain technology more approachable.
            <a href="https://nimiq.com" target="_blank" rel="noopener noreferrer" class="text-[#0582CA] hover:text-[#265DD7] transition-colors cursor-pointer ml-1">
              Learn more at nimiq.com →
            </a>
          </p>
        </section>

        <!-- Credits -->
        <section>
          <h3 class="text-lg font-semibold text-white mb-3">
            Credits & Acknowledgments
          </h3>
          <div class="space-y-2 text-white/70">
            <p>
              <strong class="text-white/90">Created by:</strong> Team Nimiq
            </p>
            <div>
              <strong class="text-white/90">Built with:</strong>
              <ul class="list-disc list-inside ml-2 mt-1 space-y-1">
                <li>
                  <a href="https://strudel.cc" target="_blank" rel="noopener noreferrer" class="text-[#0582CA] hover:text-[#265DD7] transition-colors cursor-pointer">
                    Strudel
                  </a>
                  for generative music (special thanks to
                  <a href="https://www.youtube.com/@Switch-Angel" target="_blank" rel="noopener noreferrer" class="text-[#0582CA] hover:text-[#265DD7] transition-colors cursor-pointer">
                    Switch Angel tutorials
                  </a>)
                </li>
                <li>
                  <a href="https://threejs.org" target="_blank" rel="noopener noreferrer" class="text-[#0582CA] hover:text-[#265DD7] transition-colors cursor-pointer">
                    Three.js
                  </a>
                  for 3D visualization
                </li>
                <li>Nuxt + Vue + TypeScript</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Links -->
        <section>
          <h3 class="text-lg font-semibold text-white mb-3">
            Links
          </h3>
          <div class="flex flex-wrap gap-2">
            <a
              href="https://github.com/onmax/nimiq-song"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/90 text-sm transition-colors cursor-pointer"
            >
              <UIcon name="i-heroicons-code-bracket" class="size-4" />
              GitHub
            </a>
            <a
              href="https://x.com/nimiq"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/90 text-sm transition-colors cursor-pointer"
            >
              <UIcon name="i-heroicons-at-symbol" class="size-4" />
              X (Twitter)
            </a>
            <a
              href="https://discord.gg/nimiq"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/90 text-sm transition-colors cursor-pointer"
            >
              <UIcon name="i-heroicons-chat-bubble-left-right" class="size-4" />
              Discord
            </a>
            <a
              href="https://t.me/nimiq"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/90 text-sm transition-colors cursor-pointer"
            >
              <UIcon name="i-heroicons-paper-airplane" class="size-4" />
              Telegram
            </a>
          </div>
        </section>
      </div>

      <!-- Footer CTAs -->
      <div class="shrink-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 p-4 sm:p-6">
        <div class="flex flex-col sm:flex-row gap-3">
          <a
            href="https://nimiq.com"
            target="_blank"
            rel="noopener noreferrer"
            class="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-all nimiq-btn-primary cursor-pointer"
          >
            Visit Nimiq.com
            <UIcon name="i-heroicons-arrow-top-right-on-square" class="size-4" />
          </a>
          <button
            class="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-semibold text-white transition-colors cursor-pointer"
            @click="closeModal"
          >
            <UIcon name="i-heroicons-speaker-wave" class="size-4" />
            Let's go to the radio!
          </button>
        </div>
      </div>
      </Motion>
    </AnimatePresence>
  </div>
</template>

<style scoped>
.nimiq-btn-primary {
  background: var(--radial-gradient-light-blue);
}

.nimiq-btn-primary:hover {
  filter: brightness(1.1);
}
</style>
