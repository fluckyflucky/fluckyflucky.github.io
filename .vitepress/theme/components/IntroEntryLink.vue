<script setup lang="ts">
const ripplePoints = [
  { x: '18%', y: '42%', size: '2.8rem', delay: '0s', duration: '1.2s' },
  { x: '34%', y: '68%', size: '3.6rem', delay: '0.1s', duration: '1.35s' },
  { x: '52%', y: '34%', size: '2.4rem', delay: '0.22s', duration: '1.05s' },
  { x: '71%', y: '59%', size: '3.2rem', delay: '0.16s', duration: '1.28s' },
  { x: '84%', y: '41%', size: '2.6rem', delay: '0.3s', duration: '1.12s' },
] as const

defineProps<{
  href: string
  label?: string
}>()
</script>

<template>
  <div class="intro-entry-link">
    <a class="link" :href="href" :aria-label="label">
      <span class="label"><slot>{{ label ?? '开始 >>' }}</slot></span>

      <span class="surface" aria-hidden="true">
        <span
          v-for="(point, index) in ripplePoints"
          :key="index"
          class="ripple-point"
          :style="{
            '--point-x': point.x,
            '--point-y': point.y,
            '--point-size': point.size,
            '--point-delay': point.delay,
            '--point-duration': point.duration,
          }"
        >
          <span class="ring ring-1"></span>
          <span class="ring ring-2"></span>
        </span>
      </span>
    </a>
  </div>
</template>

<style scoped>
.intro-entry-link {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2rem;
  padding-block: 1.35rem;
}

.link {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: min(14rem, 78vw);
  padding: var(--mobile-cta-padding-block) var(--mobile-cta-padding-inline);
  border: 1px solid rgba(74, 200, 222, 0.24);
  border-radius: var(--mobile-cta-radius);
  background: rgba(255, 255, 255, 0.72);
  color: var(--vp-c-text-1);
  font-size: clamp(1rem, 2.8vw, 1.1rem);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.06em;
  text-decoration: none;
  box-shadow: 0 0.6rem 1.5rem rgba(74, 200, 222, 0.08);
  overflow: hidden;
  isolation: isolate;
  transition: border-color 0.22s ease, box-shadow 0.22s ease, background-color 0.22s ease;
}

.label {
  position: relative;
  z-index: 2;
}

.surface {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.ripple-point {
  position: absolute;
  left: var(--point-x);
  top: var(--point-y);
  width: var(--point-size);
  height: var(--point-size);
  transform: translate(-50%, -50%);
}

.ring {
  position: absolute;
  inset: 50% auto auto 50%;
  width: 100%;
  height: 100%;
  border: 1.6px solid rgba(74, 200, 222, 0.28);
  border-radius: 999px;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.22);
}

.ring-2 {
  border-color: rgba(74, 200, 222, 0.14);
}

.link:hover .ring-1,
.link:focus-visible .ring-1,
.link:focus-within .ring-1 {
  animation: ripple-scatter var(--point-duration) ease-out var(--point-delay);
}

.link:hover .ring-2,
.link:focus-visible .ring-2,
.link:focus-within .ring-2 {
  animation: ripple-scatter calc(var(--point-duration) + 0.14s) ease-out calc(var(--point-delay) + 0.08s);
}

.link:hover {
  color: var(--vp-c-text-1);
  border-color: rgba(74, 200, 222, 0.42);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 0.8rem 1.8rem rgba(74, 200, 222, 0.12);
}

.link:focus-visible {
  outline: 2px solid rgba(74, 200, 222, 0.36);
  outline-offset: 3px;
}

.dark .link {
  border-color: rgba(30, 185, 209, 0.24);
  background: rgba(30, 41, 59, 0.78);
  color: var(--vp-c-text-1);
  box-shadow: 0 0.75rem 1.8rem rgba(2, 8, 23, 0.22);
}

.dark .ring {
  border-color: rgba(30, 185, 209, 0.3);
}

.dark .ring-2 {
  border-color: rgba(30, 185, 209, 0.16);
}

.dark .link:hover {
  border-color: rgba(30, 185, 209, 0.4);
  background: rgba(30, 41, 59, 0.9);
  box-shadow: 0 0.95rem 2rem rgba(2, 8, 23, 0.28);
}

@keyframes ripple-scatter {
  0% {
    opacity: 0.52;
    transform: translate(-50%, -50%) scale(0.22);
  }

  60% {
    opacity: 0.18;
    transform: translate(-50%, -50%) scale(1.2);
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.65);
  }
}

@media (max-width: 767px) {
  .intro-entry-link {
    margin-top: 1.75rem;
    padding-block: 1.15rem;
  }

  .link {
    width: min(100%, 18rem);
  }

  .ripple-point {
    width: clamp(2.2rem, 10vw, var(--point-size));
    height: clamp(2.2rem, 10vw, var(--point-size));
  }
}
</style>
