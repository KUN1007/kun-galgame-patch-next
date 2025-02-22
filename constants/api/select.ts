export const GalgameCardSelectField = {
  id: true,
  name: true,
  banner: true,
  view: true,
  download: true,
  type: true,
  language: true,
  platform: true,
  created: true,
  _count: {
    select: {
      favorite_by: true,
      contribute_by: true,
      resource: true,
      comment: true
    }
  }
}
