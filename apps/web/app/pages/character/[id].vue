<script setup lang="ts">
import { ROLE_LABELS } from '~/constants/character'

const route = useRoute()
const api = useApi()

const characterId = computed(() => Number(route.params.id))

const { data: character } = await useAsyncData<PatchCharacterDetail | null>(
  () => `character-${characterId.value}`,
  async () => {
    const res = await api.get<PatchCharacterDetail>(
      `/character/${characterId.value}`
    )
    return res.code === 0 ? res.data : null
  }
)

const displayName = computed(() =>
  character.value ? getPreferredLanguageText(character.value.name) : ''
)

useKunSeoMeta({
  title: displayName.value || `角色 ${characterId.value}`,
  description: character.value
    ? getPreferredLanguageText(character.value.description)
    : ''
})
</script>

<template>
  <div v-if="character" class="container mx-auto my-4 space-y-6">
    <div class="flex flex-col gap-6 sm:flex-row">
      <img
        v-if="character.image"
        :src="character.image"
        :alt="displayName"
        class="size-40 rounded-xl object-cover"
      />
      <div class="flex-1 space-y-3">
        <h1 class="text-3xl font-bold">{{ displayName }}</h1>
        <div class="flex flex-wrap gap-2">
          <KunBadge
            v-if="character.role"
            variant="flat"
            color="secondary"
          >
            {{ ROLE_LABELS[character.role] ?? character.role }}
          </KunBadge>
          <KunBadge v-if="character.gender" variant="flat" color="primary">
            {{ character.gender }}
          </KunBadge>
        </div>
        <p
          v-if="getPreferredLanguageText(character.description)"
          class="text-default-600 whitespace-pre-wrap"
        >
          {{ getPreferredLanguageText(character.description) }}
        </p>
        <div class="text-default-500 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
          <span v-if="character.birthday">生日: {{ character.birthday }}</span>
          <span v-if="character.age">年龄: {{ character.age }}</span>
          <span v-if="character.height">身高: {{ character.height }}cm</span>
          <span v-if="character.weight">体重: {{ character.weight }}kg</span>
          <span v-if="character.bust">B: {{ character.bust }}</span>
          <span v-if="character.waist">W: {{ character.waist }}</span>
          <span v-if="character.hips">H: {{ character.hips }}</span>
          <span v-if="character.cup">罩杯: {{ character.cup }}</span>
        </div>
      </div>
    </div>

    <div v-if="character.patches.length">
      <h2 class="mb-3 text-xl font-bold">出现的 Galgame</h2>
      <div
        class="grid grid-cols-2 gap-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4"
      >
        <NuxtLink
          v-for="p in character.patches"
          :key="p.id"
          :to="`/patch/${p.id}/introduction`"
          class="border-default/20 bg-background hover:bg-default-100 overflow-hidden rounded-lg border transition-colors"
        >
          <img
            v-if="p.banner"
            :src="p.banner.replace(/\.avif$/, '-mini.avif')"
            :alt="getPreferredLanguageText(p.name)"
            class="aspect-video w-full object-cover"
          />
          <div class="p-3">
            <h3 class="font-semibold line-clamp-2">
              {{ getPreferredLanguageText(p.name) }}
            </h3>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
  <KunNull v-else description="角色不存在" />
</template>
