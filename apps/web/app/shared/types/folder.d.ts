// A folder is a catalog folder (nextmoe-infra /v2/me/folders), shared with the
// forum: the same shelf, whichever site you file from. This site's API is a
// thin face over it, see apps/api/internal/patch/service/folders.go.
//
// `id` is the CATALOG folder id, not a patch id.
type FolderVisibility = 'public' | 'private'

interface Folder {
  id: number
  name: string
  description: string
  visibility: FolderVisibility
  is_default: boolean
  item_count: number
  created: string
  updated: string
}

interface FolderMembership extends Folder {
  contains: boolean
}
