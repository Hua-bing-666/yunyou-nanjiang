<template>
  <div class="experience-art" :class="`art-${kind}`" aria-hidden="true">
    <svg viewBox="0 0 420 260" fill="none">
      <defs>
        <pattern :id="`grain-${uid}`" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="4" r=".65" fill="currentColor" opacity=".13" />
          <circle cx="13" cy="16" r=".45" fill="currentColor" opacity=".13" />
        </pattern>
      </defs>
      <rect width="420" height="260" :fill="`url(#grain-${uid})`" />
      <path d="M26 236H394" stroke="currentColor" stroke-width="1" opacity=".35" />
      <circle cx="332" cy="54" r="22" fill="currentColor" opacity=".12" />
      <g v-if="kind === 'pottery'" stroke="currentColor" stroke-width="2.4">
        <path
          d="M179 70h60v19c0 21 47 37 47 85s-29 60-77 60-77-18-77-60 47-64 47-85V70Z"
          fill="currentColor"
          fill-opacity=".12"
        />
        <ellipse cx="209" cy="70" rx="31" ry="7" />
        <path
          d="M146 151c26 12 97 12 126 0m-137 25c39 16 109 16 149 0m-129 29 18-18 18 18 18-18 18 18 18-18 18 18M92 177h34v55H72v-42c0-8 9-13 20-13Zm208-29h32l13 84h-57l12-84Z"
        />
        <path d="M93 178v-27h13v27m197-29 8-24h9l9 24" />
      </g>
      <g v-else-if="kind === 'tea'" stroke="currentColor" stroke-width="2.5">
        <path
          d="M136 124h131c0 62-22 92-65 92s-66-30-66-92Z"
          fill="currentColor"
          fill-opacity=".12"
        />
        <path
          d="M267 137h20c40 0 35 55-27 55M117 220h177M171 96c-22-23 22-29 0-55m39 55c-22-23 22-29 0-55m38 55c-22-23 22-29 0-55"
        />
        <ellipse cx="201" cy="123" rx="66" ry="10" />
        <path d="m150 156 18 10 18-10 18 10 18-10 18 10 18-10" />
      </g>
      <g v-else-if="kind === 'museum'" stroke="currentColor" stroke-width="2.2">
        <path d="M91 99h238L210 38 91 99Z" fill="currentColor" fill-opacity=".13" />
        <path
          d="M83 109h254v11H83Zm13 111h228v13H96Zm18-89h27v78h-27Zm68 0h27v78h-27Zm69 0h27v78h-27Z"
          fill="currentColor"
          fill-opacity=".1"
        />
        <path d="M127 134v71m68-71v71m69-71v71" />
      </g>
      <g v-else-if="kind === 'performance'" stroke="currentColor" stroke-width="2.4">
        <path
          d="M92 232V80c26-9 52-32 118-52 66 20 92 43 118 52v152"
          fill="currentColor"
          fill-opacity=".08"
        />
        <path
          d="M112 232V92c41 17 53 66 15 91m180 49V92c-41 17-53 66-15 91M112 97c24 0 48 1 98 1s74-1 98-1"
        />
        <path
          d="m210 132 9 20 22 3-16 15 4 22-19-10-19 10 4-22-16-15 22-3 9-20Z"
          fill="currentColor"
          fill-opacity=".14"
        />
        <path d="M158 224h104m-91-14h78" />
      </g>
      <g v-else stroke="currentColor" stroke-width="2.2">
        <path d="M79 233V106h104V62h88v72h70v99" fill="currentColor" fill-opacity=".1" />
        <path
          d="M95 106V84h69v22m36-44V44h54v18m-154 59h26v37h-26Zm43 0h25v37h-25Zm57-42h27v39h-27Zm43 0h14v39h-14Zm-43 52h57v40h-57Zm86 22h36v38h-36Z"
        />
        <path d="M117 233v-43a22 22 0 0 1 44 0v43m47 0v-25a18 18 0 0 1 36 0v25m-67-63h92m0-43h72" />
        <path d="m95 90 4-7m15 7 4-7m15 7 4-7m15 7 4-7" />
      </g>
      <path d="m37 44 5-9 5 9 9 5-9 5-5 9-5-9-9-5 9-5Z" stroke="currentColor" opacity=".5" /></svg
    ><span class="art-caption">{{ label }}</span
    ><span class="art-note">主题插画</span>
  </div>
</template>
<script setup>
import { useId } from 'vue'
defineProps({
  kind: { type: String, default: 'architecture' },
  label: { type: String, default: '喀什 · 文化体验' },
})
const uid = useId()
</script>
