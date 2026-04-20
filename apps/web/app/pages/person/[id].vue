<script setup lang="ts">
import { roleLabel } from '~/constants/character'

const route = useRoute()
const api = useApi()

const personId = computed(() => Number(route.params.id))

const { data: person } = await useAsyncData<PatchPersonDetail | null>(
  () => `person-${personId.value}`,
  async () => {
    const res = await api.get<PatchPersonDetail>(`/person/${personId.value}`)
    return res.code === 0 ? res.data : null
  }
)

const displayName = computed(() =>
  person.value ? getPreferredLanguageText(person.value.name) : ''
)

useKunSeoMeta({
  title: displayName.value || `制作人 ${personId.value}`,
  description: person.value
    ? getPreferredLanguageText(person.value.description)
    : ''
})
</script>

<template>
  <div v-if="person" class="container mx-auto my-4 space-y-6">
    <div class="flex flex-col gap-6 sm:flex-row">
      <img
        v-if="person.image"
        :src="person.image"
        :alt="displayName"
        class="size-32 rounded-xl object-cover"
      />
      <div class="flex-1 space-y-3">
        <h1 class="text-3xl font-bold">{{ displayName }}</h1>
        <div class="flex flex-wrap gap-2">
          <KunBadge
            v-for="r in person.roles"
            :key="r"
            variant="flat"
            color="primary"
          >
            {{ roleLabel(r) }}
          </KunBadge>
        </div>
        <p
          v-if="getPreferredLanguageText(person.description)"
          class="text-default-600 whitespace-pre-wrap"
        >
          {{ getPreferredLanguageText(person.description) }}
        </p>
        <div class="text-default-500 flex flex-wrap gap-4 text-sm">
          <span v-if="person.birthday">生日: {{ person.birthday }}</span>
          <span v-if="person.blood_type">血型: {{ person.blood_type }}</span>
          <span v-if="person.birthplace">出生地: {{ person.birthplace }}</span>
        </div>
      </div>
    </div>

    <div v-if="person.patches.length">
      <h2 class="mb-3 text-xl font-bold">参与的 Galgame</h2>
      <div
        class="grid grid-cols-2 gap-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4"
      >
        <NuxtLink
          v-for="p in person.patches"
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
  <KunNull v-else description="制作人不存在" />
</template>
