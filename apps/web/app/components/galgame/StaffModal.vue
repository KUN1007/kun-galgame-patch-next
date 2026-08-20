<script setup lang="ts">
import { GALGAME_STAFF_GENDER_MAP } from '~/constants/galgameEntity'
import { kunMoyuMoe } from '~/config/moyu-moe'
import { imageServiceUrl } from '~/shared/utils/resolveBannerUrl'

const props = defineProps<{
  person: PatchDetailPerson | null
}>()

const isOpen = defineModel<boolean>({ required: true })

const api = useApi()
const cache = new Map<number, PatchStaffDetail>()
const detail = ref<PatchStaffDetail | null>(null)
const isLoading = ref(false)

const load = async (id: number) => {
  const cached = cache.get(id)
  if (cached) {
    detail.value = cached
    return
  }
  detail.value = null
  isLoading.value = true
  const res = await api.get<PatchStaffDetail>(`/galgame/staff/${id}`)
  isLoading.value = false
  if (res.code !== 0 || !res.data) {
    return
  }
  cache.set(id, res.data)
  if (props.person?.id === id) {
    detail.value = res.data
  }
}

watch(
  () => [isOpen.value, props.person?.id] as const,
  ([open, id]) => {
    if (open && id) {
      load(id)
    }
  },
  { immediate: true }
)

const name = computed(() =>
  getPreferredLanguageText(detail.value?.name ?? props.person?.name)
)
const secondaryName = computed(() =>
  getSecondaryLanguageText(detail.value?.name ?? props.person?.name, name.value)
)

const photoSrc = computed(() => imageServiceUrl(detail.value?.photo_hash ?? ''))

const intro = computed(() => pickPreferredLanguageRow(detail.value?.intros))

const aliases = computed(() =>
  (detail.value?.aliases ?? []).filter(
    (alias) => alias !== name.value && alias !== secondaryName.value
  )
)

// birth_y is often absent where the month and day are known, so the two halves
// render independently rather than as one date.
const birthday = computed(() => {
  const d = detail.value
  if (!d) {
    return ''
  }
  const md = d.birth_m && d.birth_d ? `${d.birth_m} 月 ${d.birth_d} 日` : ''
  const year = d.birth_y ? `${d.birth_y} 年` : ''
  return [year, md].filter(Boolean).join(' ')
})

const facts = computed(() => {
  const rows: string[] = []
  const gender = detail.value?.gender
  if (gender && GALGAME_STAFF_GENDER_MAP[gender]) {
    rows.push(GALGAME_STAFF_GENDER_MAP[gender])
  }
  if (birthday.value) {
    rows.push(`生日 ${birthday.value}`)
  }
  return rows
})

const kungalHref = computed(
  () => `${kunMoyuMoe.domain.kungal}/galgame/staff/${props.person?.id}`
)

const siblingHref = (id: number) =>
  `${kunMoyuMoe.domain.kungal}/galgame/staff/${id}`

const roleText = (credit: PatchStaffCredit) =>
  credit.roles
    .map((r) =>
      r.character ? `${r.role_name}（${r.character}）` : r.role_name
    )
    .join(' · ')
</script>

<template>
  <KunModal v-model="isOpen" inner-class-name="max-w-3xl w-[94vw]">
    <div v-if="person" class="max-h-[82dvh] space-y-4 overflow-y-auto p-1">
      <div class="flex items-start gap-4">
        <KunImage
          v-if="photoSrc"
          :src="photoSrc"
          :alt="name"
          loading="eager"
          aspect-ratio="1/1"
          object-fit="cover"
          class-name="w-20 shrink-0 overflow-hidden rounded-xl sm:w-24"
        />

        <div class="min-w-0 grow space-y-1">
          <h3 class="text-foreground text-xl font-medium">{{ name }}</h3>
          <p v-if="secondaryName" class="text-default-400 text-sm">
            {{ secondaryName }}
          </p>
          <p v-if="facts.length" class="text-default-500 text-sm">
            {{ facts.join(' · ') }}
          </p>
          <p v-if="aliases.length" class="text-default-500 text-sm">
            别名 {{ aliases.join(' / ') }}
          </p>
        </div>
      </div>

      <KunLoading v-if="isLoading" />

      <template v-else-if="detail">
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

        <div v-if="detail.siblings.length" class="space-y-1.5">
          <p class="text-default-400 text-xs">其他名义</p>
          <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
            <a
              v-for="sibling in detail.siblings"
              :key="sibling.id"
              :href="siblingHref(sibling.id)"
              target="_blank"
              rel="noopener noreferrer"
              class="text-default-800 hover:text-primary text-sm"
            >
              {{ getPreferredLanguageText(sibling.name) }}
            </a>
          </div>
        </div>

        <div v-if="detail.credits.length" class="space-y-1.5">
          <p class="text-default-400 text-xs">参与作品</p>
          <ul class="space-y-1.5">
            <li
              v-for="(credit, index) in detail.credits"
              :key="`${credit.galgame_id}-${index}`"
              class="flex flex-wrap items-baseline gap-x-2 text-sm"
            >
              <NuxtLink
                v-if="credit.galgame_id"
                :to="`/patch/${credit.galgame_id}`"
                class="text-default-800 hover:text-primary"
                @click="isOpen = false"
              >
                {{ getPreferredLanguageText(credit.name) }}
              </NuxtLink>
              <span v-else class="text-default-600">
                {{ getPreferredLanguageText(credit.name) }}
              </span>
              <span class="text-default-400 text-xs">{{
                roleText(credit)
              }}</span>
            </li>
          </ul>
        </div>

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
