<script setup lang="ts">
defineProps<{
  href: string
  label?: string
}>()
</script>

<template>
  <div class="intro-entry-link">
    <a class="link" :href="href" :aria-label="label">
      <span class="text"><slot>{{ label ?? '开始 >>' }}</slot></span>
      <span class="line" aria-hidden="true"></span>
    </a>
  </div>
</template>

<style scoped>
.intro-entry-link {
  display: flex;
  justify-content: center;
  margin-top: 2.4rem;
  padding-block: 1rem;
}

.link {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0;
  color: var(--vp-c-text-2);
  font-size: 1.05rem;
  font-weight: 400;
  letter-spacing: 0.12em;
  text-decoration: none;
  transition: color 0.3s ease;
}

.text {
  position: relative;
}

.line {
  display: block;
  width: 0;
  height: 1px;
  background: currentColor;
  opacity: 0.35;
  transition: width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease;
}

.link:hover {
  color: var(--vp-c-text-1);
}

.link:hover .line {
  width: 100%;
  opacity: 0.5;
}

.link:focus-visible {
  outline: 1px solid currentColor;
  outline-offset: 0.375rem;
  border-radius: 2px;
}

.dark .link {
  color: rgba(255, 255, 255, 0.45);
}

.dark .link:hover {
  color: rgba(255, 255, 255, 0.72);
}

@media (max-width: 47.9375rem) {
  .intro-entry-link {
    margin-top: 1.75rem;
  }
}
</style>
