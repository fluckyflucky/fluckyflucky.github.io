<script setup lang="ts">
import AppLayout from './components/AppLayout.vue'
import LiquidWater from './components/LiquidWater.vue'
import LyricsFalling from './components/LyricsFalling.vue'
</script>

<template>
  <LiquidWater home />
  <LyricsFalling />
  <AppLayout>
    <router-view />
  </AppLayout>
</template>
