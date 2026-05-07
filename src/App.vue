<script setup lang="ts">
import AppLayout from './components/AppLayout.vue'
import SummerGlow from './components/SummerGlow.vue'
import WaterRipples from './components/WaterRipples.vue'
import LyricsFalling from './components/LyricsFalling.vue'
</script>

<template>
  <SummerGlow />
  <WaterRipples />
  <LyricsFalling />
  <AppLayout>
    <router-view />
  </AppLayout>
</template>
