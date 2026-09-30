<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, useId } from 'vue';
import CivIcon from './CivIcon.vue';
defineProps<{ label: string; text: string }>();
const id=useId(), open=ref(false), ready=ref(false), pinned=ref(false), trigger=ref<HTMLButtonElement|null>(null), popup=ref<HTMLElement|null>(null);
const position=ref({left:'0px',top:'0px'});
let timer:ReturnType<typeof setTimeout>|undefined;
function cancelLeave() {clearTimeout(timer);}
function close() {clearTimeout(timer);open.value=false;ready.value=false;pinned.value=false;}
async function show() {
  clearTimeout(timer);if(!open.value)ready.value=false;open.value=true;
  await nextTick();
  if (!trigger.value || !popup.value) return;
  const anchor=trigger.value.getBoundingClientRect(),box=popup.value.getBoundingClientRect();
  position.value={left:`${Math.max(12,Math.min(anchor.right-box.width,window.innerWidth-box.width-12))}px`,top:`${anchor.bottom+box.height+10>window.innerHeight ? Math.max(12,anchor.top-box.height-6) : anchor.bottom+6}px`};
  ready.value=true;
}
function leave() {if(!pinned.value)timer=setTimeout(close,120);}
function toggle() {if(pinned.value)close();else{pinned.value=true;void show();}}
function outside(event:PointerEvent) {if(!trigger.value?.contains(event.target as Node) && !popup.value?.contains(event.target as Node))close();}
function scroll(event:Event) {
  if(!open.value || popup.value?.contains(event.target as Node))return;
  const anchor=trigger.value?.getBoundingClientRect();
  if(!anchor || anchor.bottom<0 || anchor.top>window.innerHeight)close();
  else void show();
}
function escape(event:KeyboardEvent) {if(event.key==='Escape' && open.value){event.stopPropagation();close();}else if(event.key==='Tab')close();}
onMounted(()=>{document.addEventListener('pointerdown',outside);window.addEventListener('keydown',escape);window.addEventListener('scroll',scroll,true);window.addEventListener('resize',close);});
onUnmounted(()=>{clearTimeout(timer);document.removeEventListener('pointerdown',outside);window.removeEventListener('keydown',escape);window.removeEventListener('scroll',scroll,true);window.removeEventListener('resize',close);});
</script>
<template>
  <button ref="trigger" type="button" class="civ-help-button" :aria-label="label" :aria-expanded="open" :aria-describedby="open?id:undefined"
    @pointerenter="event=>{if(event.pointerType==='mouse')void show()}" @pointerleave="leave" @focus="show" @blur="leave" @click.stop.prevent="toggle">
    <CivIcon name="help" :size="18" />
  </button>
  <Teleport to="body">
    <div v-if="open" :id="id" ref="popup" role="tooltip" class="civ-help-popup" :style="{...position,visibility:ready?'visible':'hidden'}" @pointerenter="cancelLeave" @pointerleave="leave">{{ text }}</div>
  </Teleport>
</template>
<style scoped>
.civ-help-button {width:44px;height:44px;min-height:44px;padding:0;background:transparent;border-color:transparent;color:#cfccaa;flex-shrink:0;}
.civ-help-button:hover,.civ-help-button[aria-expanded="true"] {background:#3d5141;border-color:#84916d;}
.civ-help-popup {position:fixed;z-index:100;width:min(320px,calc(100vw - 24px));box-sizing:border-box;padding:12px 14px;background:#142821;border:1px solid #a59f73;border-radius:7px;box-shadow:0 6px 24px #0007;color:#eee9d5;font:14px/1.6 system-ui,"PingFang SC",sans-serif;white-space:pre-line;overflow-wrap:anywhere;max-height:calc(100dvh - 24px);overflow:auto;}
@media(max-width:600px){.civ-help-popup{font-size:16px;}}
</style>
