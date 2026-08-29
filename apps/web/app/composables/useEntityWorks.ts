// The works list on a 角色 / 制作人员 page. The first page arrives inside the
// detail payload so it renders server-side; every page after it comes from the
// entity's own /works face, keyed on catalog's opaque cursor — which is minted
// there and only ever echoed back, never built here.
export const useEntityWorks = (
  path: () => string,
  detail:
    | Ref<PatchEntityWorkPage | null>
    | ComputedRef<PatchEntityWorkPage | null>
) => {
  const api = useApi()

  const items = ref<PatchEntityWork[]>([])
  const cursor = ref('')
  const isLoading = ref(false)

  watch(
    detail,
    (v) => {
      items.value = v?.works ?? []
      cursor.value = v?.next_cursor ?? ''
    },
    { immediate: true }
  )

  const loadMore = async () => {
    if (!cursor.value || isLoading.value) return
    isLoading.value = true
    const res = await api.get<PatchEntityWorkPage>(
      `${path()}?cursor=${encodeURIComponent(cursor.value)}`
    )
    isLoading.value = false
    if (res.code !== 0) return
    items.value = [...items.value, ...(res.data.works ?? [])]
    cursor.value = res.data.next_cursor ?? ''
  }

  return { items, hasMore: computed(() => !!cursor.value), isLoading, loadMore }
}
