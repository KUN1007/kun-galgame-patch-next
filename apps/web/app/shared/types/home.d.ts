interface HomeResponse {
  galgames: GalgameCard[]
  resources: HomeResource[]
  comments: HomeComment[]
}

interface HomeCarouselMetadata {
  title: string
  banner: string
  description: string
  date: string
  // The author as a KunUser so the cards can hand it straight to KunAvatar,
  // which substitutes a deterministic per-name sticker when `avatar` is empty.
  // That substitution is the point: a raw <KunImage src=""> still emits a
  // densities srcset (" 1x,  2x"), and the browser resolves the bare descriptor
  // as a URL — one GET /1x 404 per avatar-less author.
  //
  // `id` is 0 because the pinned-doc feed carries no author id. KunAvatar reads
  // that as "no linkable identity" (isLink = isNavigation && !!user.id) and
  // renders a plain non-interactive avatar, which is what this card wants.
  author: KunUser
  pin: boolean
  directory: string
  link: string
}
