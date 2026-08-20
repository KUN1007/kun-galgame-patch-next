<script setup lang="ts">
import {
  GALGAME_CHARACTER_KIND_COLOR,
  GALGAME_CHARACTER_KIND_MAP,
  GALGAME_CHARACTER_SPOILER_MAP
} from '~/constants/galgameEntity'
import { kunMoyuMoe } from '~/config/moyu-moe'
import { imageServiceUrl } from '~/shared/utils/resolveBannerUrl'

const props = defineProps<{
  character: PatchDetailCharacter | null
}>()

const isOpen = defineModel<boolean>({ required: true })

const emit = defineEmits<{ 'open-staff': [person: PatchDetailPerson] }>()

const api = useApi()
const cache = new Map<number, PatchCharacterDetail>()
const detail = ref<PatchCharacterDetail | null>(null)
const isLoading = ref(false)

const load = async (id: number) => {
  const cached = cache.get(id)
  if (cached) {
    detail.value = cached
    return
  }
  detail.value = null
  isLoading.value = true
  const res = await api.get<PatchCharacterDetail>(`/galgame/character/${id}`)
  isLoading.value = false
  if (res.code !== 0 || !res.data) {
    return
  }
  cache.set(id, res.data)
  if (props.character?.id === id) {
    detail.value = res.data
  }
}

watch(
  () => [isOpen.value, props.character?.id] as const,
  ([open, id]) => {
    if (open && id) {
      load(id)
    }
  },
  { immediate: true }
)

const isTraitSpoilerRevealed = ref(false)
watch(
  () => props.character?.id,
  () => (isTraitSpoilerRevealed.value = false)
)

const name = computed(() => getPreferredLanguageText(props.character?.name))
const secondaryName = computed(() =>
  getSecondaryLanguageText(props.character?.name, name.value)
)

const figureSrc = computed(() =>
  imageServiceUrl(
    detail.value?.figure_hash ?? props.character?.figure_hash ?? ''
  )
)
const imageSrc = computed(() =>
  imageServiceUrl(detail.value?.image_hash ?? props.character?.image_hash ?? '')
)

const intro = computed(() => pickPreferredLanguageRow(detail.value?.intros))

const aliases = computed(() =>
  (detail.value?.aliases ?? []).filter(
    (alias) => alias !== name.value && alias !== secondaryName.value
  )
)

const traits = computed(() =>
  (detail.value?.traits ?? []).filter(
    (t) => isTraitSpoilerRevealed.value || t.spoiler === 0
  )
)
const hiddenTraitCount = computed(
  () => (detail.value?.traits ?? []).filter((t) => t.spoiler > 0).length
)

// Catalog sends the traits already grouped and in order, so consecutive rows
// sharing a group name are one group; do not sort, that scatters them.
const traitGroups = computed(() => {
  const groups: { name: string; traits: PatchCharacterTrait[] }[] = []
  for (const trait of traits.value) {
    const group = trait.group || '其他'
    const last = groups.at(-1)
    if (last?.name === group) {
      last.traits.push(trait)
    } else {
      groups.push({ name: group, traits: [trait] })
    }
  }
  return groups
})

const kungalHref = computed(
  () => `${kunMoyuMoe.domain.kungal}/galgame/character/${props.character?.id}`
)
</script>

<template>
  <KunModal v-model="isOpen" inner-class-name="max-w-3xl w-[94vw]">
    <div v-if="character" class="max-h-[82dvh] space-y-4 overflow-y-auto p-1">
      <div class="flex flex-col gap-4 sm:flex-row">
        <KunLightboxGallery v-if="figureSrc || imageSrc">
          <div class="flex shrink-0 items-start gap-3 sm:flex-col">
            <KunLightboxGalleryItem
              v-if="figureSrc"
              v-slot="{ open }"
              :src="figureSrc"
              :alt="name"
              :wrap="false"
            >
              <button
                type="button"
                class="bg-default-100 w-fit cursor-zoom-in overflow-hidden rounded-xl"
                :aria-label="`查看 ${name} 的立绘`"
                @click="open"
              >
                <KunImage
                  :src="figureSrc"
                  :alt="name"
                  loading="eager"
                  object-fit="contain"
                  class-name="w-32 sm:w-44"
                />
              </button>
            </KunLightboxGalleryItem>

            <KunLightboxGalleryItem
              v-if="imageSrc"
              v-slot="{ open }"
              :src="imageSrc"
              :alt="name"
              :wrap="false"
            >
              <button
                type="button"
                class="bg-default-100 w-fit cursor-zoom-in overflow-hidden rounded-xl"
                :aria-label="`查看 ${name} 的头像`"
                @click="open"
              >
                <KunImage
                  :src="imageSrc"
                  :alt="name"
                  loading="eager"
                  aspect-ratio="3/4"
                  object-fit="cover"
                  :class-name="figureSrc ? 'w-20 sm:w-24' : 'w-32 sm:w-44'"
                />
              </button>
            </KunLightboxGalleryItem>
          </div>
        </KunLightboxGallery>

        <div class="min-w-0 grow space-y-3">
          <div class="space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-foreground text-xl font-medium">{{ name }}</h3>
              <KunChip
                v-if="GALGAME_CHARACTER_KIND_MAP[character.kind]"
                :color="
                  GALGAME_CHARACTER_KIND_COLOR[character.kind] ?? 'default'
                "
                size="sm"
              >
                {{ GALGAME_CHARACTER_KIND_MAP[character.kind] }}
              </KunChip>
              <KunChip
                v-if="GALGAME_CHARACTER_SPOILER_MAP[character.spoiler]"
                color="warning"
                size="sm"
              >
                {{ GALGAME_CHARACTER_SPOILER_MAP[character.spoiler] }}
              </KunChip>
            </div>
            <p v-if="secondaryName" class="text-default-400 text-sm">
              {{ secondaryName }}
            </p>
          </div>

          <div v-if="character.voices.length" class="text-default-500 text-sm">
            CV
            <template v-for="(v, index) in character.voices" :key="v.id">
              <span v-if="index"> / </span>
              <button
                type="button"
                class="text-default-600 hover:text-primary cursor-pointer"
                @click="emit('open-staff', v)"
              >
                {{ getPreferredLanguageText(v.name) }}
              </button>
            </template>
          </div>

          <KunLoading v-if="isLoading" />

          <template v-else-if="detail">
            <div v-if="aliases.length" class="text-default-500 text-sm">
              别名 {{ aliases.join(' / ') }}
            </div>

            <div v-if="intro" class="space-y-1">
              <p
                class="text-default-600 max-h-56 overflow-y-auto text-sm whitespace-pre-line"
              >
                {{ intro.intro }}
              </p>
              <p class="text-default-400 text-xs">
                资料来自 {{ intro.source || '鲲 Galgame 目录'
                }}<template v-if="intro.machine">, 由机器翻译</template>
              </p>
            </div>

            <div v-if="traitGroups.length" class="space-y-2">
              <div
                v-for="group in traitGroups"
                :key="group.name"
                class="space-y-1"
              >
                <p class="text-default-400 text-xs">{{ group.name }}</p>
                <div class="flex flex-wrap gap-1.5">
                  <KunChip
                    v-for="trait in group.traits"
                    :key="trait.id"
                    size="xs"
                    :color="trait.spoiler > 0 ? 'warning' : 'default'"
                  >
                    {{ trait.name }}<template v-if="trait.lie">（伪）</template>
                  </KunChip>
                </div>
              </div>
            </div>

            <KunButton
              v-if="hiddenTraitCount && !isTraitSpoilerRevealed"
              variant="flat"
              color="warning"
              size="sm"
              @click="isTraitSpoilerRevealed = true"
            >
              <KunIcon name="lucide:eye" />
              显示 {{ hiddenTraitCount }} 条剧透特征
            </KunButton>

            <div
              v-if="detail.links.length"
              class="flex flex-wrap items-center gap-x-4 gap-y-2"
            >
              <a
                v-for="link in detail.links"
                :key="link.url"
                :href="link.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-default-500 hover:text-primary text-sm"
              >
                {{ link.name }}
                <KunIcon name="lucide:external-link" class="inline size-3" />
              </a>
            </div>
          </template>
        </div>
      </div>

      <div class="flex justify-end">
        <KunButton
          :href="kungalHref"
          target="_blank"
          rel="noopener noreferrer"
          variant="flat"
          color="primary"
          size="sm"
        >
          在鲲 Galgame 查看完整资料
          <KunIcon name="lucide:arrow-right" />
        </KunButton>
      </div>
    </div>
  </KunModal>
</template>
