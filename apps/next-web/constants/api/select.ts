export const GalgameCardSelectField = {
  id: true,
  name_en_us: true,
  name_ja_jp: true,
  name_zh_cn: true,
  banner: true,
  view: true,
  download: true,
  type: true,
  language: true,
  platform: true,
  content_limit: true,
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

export const ChatMessageSelectField = {
  sender: {
    select: {
      id: true,
      name: true,
      avatar: true
    }
  },
  reaction: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    }
  },
  seen_by: true,
  reply_to: {
    select: {
      content: true,
      sender: {
        select: {
          name: true
        }
      }
    }
  }
}
