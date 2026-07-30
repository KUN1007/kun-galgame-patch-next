// The resource change-history read, lifted out of the component that renders it.
//
// The detail page needs the COUNT before it can lay itself out — an empty history
// gets no tab at all — while the rendering lives in ResourceHistory. Fetching in
// the component and emitting the count back up would decide the tab set one tick
// after the parent first rendered, i.e. a visible one-tab → two-tabs flip. The
// page awaits this instead, so the first paint is already correct.

export interface ResourceFieldChange {
  field: string
  label: string
  before: string
  after: string
}

export interface ResourceRevisionItem {
  id: number
  action: string
  reason: string
  actor_role: number
  created_at: string
  changes: ResourceFieldChange[]
}

export const RESOURCE_REVISION_LIMIT = 20

export const useResourceRevisions = (resourceId: Ref<number> | number) => {
  const api = useApi()
  const id = computed(() => unref(resourceId))
  const page = ref(1)

  const { data, pending } = useAsyncData(
    () => `resource-revisions-${id.value}-${page.value}`,
    async () => {
      const res = await api.get<{
        items: ResourceRevisionItem[]
        total: number
      }>(
        `/patch/resource/${id.value}/revisions?page=${page.value}&limit=${RESOURCE_REVISION_LIMIT}`
      )
      // A failure must not take the detail page down with it: the history is
      // supplementary to the download, so this resolves to empty (no tab)
      // rather than throwing.
      if (res.code !== 0) return { items: [], total: 0 }
      return { items: res.data?.items ?? [], total: res.data?.total ?? 0 }
    },
    { watch: [page, id] }
  )

  const items = computed(() => data.value?.items ?? [])
  const total = computed(() => data.value?.total ?? 0)
  const totalPages = computed(() =>
    Math.max(1, Math.ceil(total.value / RESOURCE_REVISION_LIMIT))
  )
  const hasHistory = computed(() => total.value > 0)

  return { items, total, totalPages, hasHistory, pending, page }
}
