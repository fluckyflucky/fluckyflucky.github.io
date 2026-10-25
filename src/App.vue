<script setup lang="ts">
import { useRoute } from 'vue-router'
import AppLayout from './components/AppLayout.vue'
import LiquidWater from './components/LiquidWater.vue'
import LyricsFalling from './components/LyricsFalling.vue'
const route = useRoute()
</script>

<template>
  <LiquidWater :home="route.path === '/'" />
  <LyricsFalling />
  <AppLayout>
    <router-view />
  </AppLayout>
</template>
