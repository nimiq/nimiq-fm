<script setup lang="ts">
defineProps({
  address: { type: String, required: true },
})
</script>

<template>
  <div class="flex items-center gap-x-4">
    <div class="uppercase address flex items-center gap-x-1">
      <!-- First 4 characters -->
      <span>{{ address.slice(0, 4) }}</span>
      <!-- Ellipsis -->
      <svg class="w-4" viewBox="0 0 16 4" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="1.93903" cy="2" r="1.3125" fill="currentColor" />
        <circle cx="8.06403" cy="2" r="1.3125" fill="currentColor" />
        <circle cx="14.189" cy="2" r="1.3125" fill="currentColor" />
      </svg>

      <!-- Last 4 characters -->
      <span>{{ address.slice(-4) }}</span>
    </div>
  </div>
</template>
