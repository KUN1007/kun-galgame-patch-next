# 04 — 旧系统迁移计划

## 旧路径清单

| 站点 | 旧路径 | 类型 | 迁移策略 |
|------|--------|------|---------|
| kungal | `topic/user_${uid}/${userName}-${unixMS}.webp` | 内容型，markdown 硬编码 | **老桶只读永久保留，不迁移** |
| kungal | `avatar/user_${uid}/avatar.webp` | 实体型，DB 可查 | 迁移（走 DB 字段） |
| kungal | `avatar/user_${uid}/avatar-100.webp` | 派生图 | 丢弃（新服务预生成） |
| moyu | `topic/user_${uid}/${userName}-${unixMS}.webp` | 同 kungal | 老桶只读永久保留 |
| moyu | `avatar/user_${uid}/avatar{,-100}.webp` | 同 kungal | avatar 主图迁移；`-100` 丢弃 |
| galgame wiki | `galgame/${gid}/banner/banner.webp` | 实体型，DB 可查 | 迁移 |
| galgame wiki | `galgame/${gid}/banner/banner-mini.webp` | 派生图 | 丢弃（新服务预生成） |

## 迁移原则

1. **新旧 URL 共存**：旧 URL 保持可访问，直到各站调用方代码切换完成
2. **不物理删除旧对象**：至少保留 6 个月，用于回滚和审计；topic markdown 那部分永久保留
3. **增量可中断**：迁移脚本用 `migration_progress` 表记录位置，随时续跑
4. **调用方代码切换各自独立**：kungal、moyu、galgame wiki 各自节奏，每站 3–4 个 PR 起步，1–2 个月落地
5. **派生图全部丢弃**：`avatar-100.webp`、`banner-mini.webp` 不迁移，由新服务预生成

## topic 图床的特殊处理

这是最省心的路径，单独拎出来说清：

- **用户发的 markdown 里有几十万条 `![](https://image.kungal.com/topic/user_X/xxx-1775xxx.webp)` 形式的硬编码链接**
- 这些 markdown 内容不变，URL 永远指向老 bucket
- 批量改库里的 markdown 文本是高风险、低价值的操作
- CDN rewrite 是一个需要永久维护的外部依赖

**最终方案**：

> 🔒 **topic 图床的老 URL 永久保留只读，不迁移、不 rewrite。新上传全部走新服务（preset=topic），新老数据自然分野。**

理由：
- R2 / S3 上几十 GB 的历史数据成本月度几块钱，不值得花工程时间折腾
- 不增加任何永久维护负担
- 新老 URL 用户不会同时看到（旧帖子看老 URL，新帖子看新 URL），无体验撕裂

## 阶段划分

### 阶段 0：新服务上线（V1 完成后）

- 图片服务独立运行于 `:9278`
- OAuth Client 为 kungal/moyu/galgame wiki 开通 `image:upload` scope + 对应 preset
- 各站点在**新功能**上先用新服务（新开模块、新注册用户的 avatar），旧数据不动
- 目标：验证新服务稳定性，收集真实流量数据

### 阶段 1：双写兼容期（1–2 周，按站点节奏）

- 旧代码保持不变，**旧 bucket 继续接收 topic 图床的上传**（直到该站 topic 切换，见阶段 4）
- avatar / banner 的新上传路径切到新服务
- 关键：确保新上传的图的 `hash` 被**同步写入调用方业务库**的新字段

例如 kungal 用户改头像：

```
// 旧代码（保留一段时间作为回退）
uploadToOldBucket(file) → 写 users.avatar_url_legacy

// 新代码
uploadToImageService(file) → 写 users.avatar_image_hash
```

前端读取优先 `avatar_image_hash`，缺失时回退到 `avatar_url_legacy`。

### 阶段 2：离线批量迁移（仅 avatar + banner）

迁移脚本 `cmd/migrate-images/` 处理：

```
对每个旧 bucket 的 avatar/* 或 galgame/*/banner/* 对象:
  1. 下载对象到内存
  2. 计算 sha256
  3. 查 images 表：hash 是否已存在
     - 若存在：复用，仅插入 image_site_usage 行 + 更新业务库外键
     - 不存在：
       a. S3 CopyObject 到新 key（不重新下载上传，快）
       b. 跑一次 libvips：decode → fit 1920×1080 → webp@82 → PUT 主图
          （旧 avatar.webp 可能已经是小尺寸，主图不变也 OK；关键是统一成 variants 全集）
       c. 生成预设变体（avatar: 100×100；banner: 460×259）
       d. INSERT images + image_site_usage
  4. 更新调用方业务库：
     - kungal/moyu:
       UPDATE users SET avatar_image_hash = ? WHERE id = ?
     - galgame_wiki:
       UPDATE galgame SET banner_image_hash = ? WHERE id = ?
  5. 记录 migration_progress
```

**注意**：topic 图床那部分**不跑**迁移脚本（对照阶段 4）。

#### 迁移脚本特性

- **分站点选择**：`go run ./cmd/migrate-images --site=kungal --type=avatar`
- **dry-run**：`--dry-run` 只扫描不写入，打印统计
- **断点续跑**：读 `migration_progress` 表 `WHERE site=? AND old_key > last_key`
- **速率限制**：`--rps=100`
- **并发数**：`--workers=10`

#### 迁移用的临时表

```sql
CREATE TABLE migration_progress (
    id          BIGSERIAL PRIMARY KEY,
    site        VARCHAR(32) NOT NULL,
    entity_type VARCHAR(32) NOT NULL,    -- avatar / banner
    old_key     VARCHAR(512) NOT NULL,
    new_key     VARCHAR(512),
    hash        CHAR(64),
    image_id    BIGINT,
    status      VARCHAR(16) NOT NULL,    -- pending / copied / failed / skipped
    error       TEXT,
    migrated_at TIMESTAMPTZ,
    CONSTRAINT migration_progress_uniq UNIQUE (site, old_key)
);

CREATE INDEX idx_migration_status ON migration_progress(site, entity_type, status);
```

迁移完成后此表可归档。

#### 预估耗时（仅 avatar + banner，不含 topic）

假设三站合计 avatar ~10 万 + galgame banner ~2 万 = 12 万对象，平均每个 80KB，总量约 10GB：

- S3 CopyObject（服务器端）约 2k 对象/秒 → 约 1 分钟
- 加上 libvips 重新处理生成变体：约 200 对象/秒（CGO + encode） → 约 10 分钟
- 加上 DB 写入 + 业务库更新：约 500 对象/秒 → 约 4 分钟
- 加上速率限制 → 30 分钟–1 小时完成

### 阶段 3：avatar URL 兼容层（可选，2–4 周）

**目的**：阶段 2 之后，业务库里 `users.avatar_image_hash` 已经有值，但可能还有：
- 浏览器缓存里的老 URL
- 第三方外链引用老 URL（很少）
- 部分未更新的前端代码

**方案（推荐最简单的）**：业务库保留 `avatar_url_legacy` 字段，前端 URL 解析函数：

```ts
function resolveAvatarUrl(user) {
  if (user.avatar_image_hash) return imageMainUrl(user.avatar_image_hash)
  if (user.avatar_url_legacy) return user.avatar_url_legacy
  return DEFAULT_AVATAR
}
```

前端代码全部切换完成后，可以删 `avatar_url_legacy` 字段（或永久保留也无妨，字段本身不占钱）。

> **不建议**在 CDN / Nginx 层写 rewrite 规则把 `/avatar/user_123/avatar.webp` 映射到新 URL——因为要永久维护一个"查业务库 → 拼 hash URL"的外部服务，复杂度远超收益。直接靠业务库字段回退就够。

### 阶段 4：业务代码切换（各站独立 1–2 个月）

这是最费工程时间的阶段，每站点 3–4 个 PR 起步。以 kungal 为例：

| PR | 工作 | 耗时 |
|----|------|------|
| PR-1 | 业务库 migration：加 `users.avatar_image_hash` / `topic.images_hash_jsonb` 字段 + GORM model | 半天 |
| PR-2 | avatar 上传逻辑改调图片服务；上传成功同步写 `avatar_image_hash` | 1–2 天 |
| PR-3 | topic 图床上传逻辑改调图片服务（`preset=topic`） | 1–2 天 |
| PR-4 | 读取逻辑全面切换（前端组件 / API response / CDN URL 构造函数） | 2–3 天 |
| PR-5 | 删 `avatar_url_legacy` 字段 / 清理回退代码（上线 N 周后） | 半天 |

moyu、galgame wiki 结构类似。三站合计 9–15 个 PR，跨 1–2 个月。

#### 阶段 4.x 验收（每站独立）

- [ ] 监控显示旧 bucket 的**新上传** QPS 归零（topic 也切了）
- [ ] 监控显示 `users.avatar_image_hash` 覆盖率 > 99%
- [ ] 监控显示旧 URL 访问量 < 1%（除 topic 历史 URL 外）

### 阶段 5：旧对象生命周期管理（6 个月后）

- **avatar 旧桶**：观察 6 个月后可以移到冷存储或彻底下线
- **topic 旧桶**：永久保留只读，成本低，不做任何动作

## 特殊情况处理

### galgame banner 的原图问题

galgame wiki 之前没有保留高清原图，只存了压缩版（与新服务的 `webp@82 fit 1920×1080` 大同小异）：

- 迁移后 `images.width/height` 用实际旧图尺寸
- `is_original = false`（实际上 V1 根本没这个字段，这里留作对比说明）
- 未来需要高清原图时，再增加新的 preset + 重新从 VNDB 采集

### 用户改名导致的 topic 图路径混淆

kungal 旧路径 `topic/user_123/alice-1700000000.webp`：`alice` 是上传当时的用户名。

由于 **topic 整体不迁移**，这个问题自然不存在。

### 重复内容的 hash 碰撞

迁移过程中会发现大量重复（同一张头像被不同用户传过）：

- `images` 以 `UNIQUE(hash)` 单行存在
- 迁移脚本遇到已有 hash：只 INSERT 一行 `image_site_usage`（或 UPDATE upload_count）+ 更新业务库外键
- 对象存储天然只有一份

## 回滚策略

迁移中任何阶段出错，回滚路径：

| 阶段 | 回滚动作 |
|------|---------|
| 1（双写期） | 停掉新代码的写入，旧代码自持续工作 |
| 2（批量迁移） | 迁移失败的对象 `migration_progress.status = failed`，不影响已成功的；整体出错可 TRUNCATE 该表重跑 |
| 3（URL 回退） | 撤下前端读取的 "优先新 URL" 逻辑，切回 `avatar_url_legacy`；旧桶从未删过，直接可用 |
| 4（代码切换） | 调用方有 fallback 逻辑，撤回切换不丢数据 |

## 风险检查清单

- [ ] 旧 bucket 中 avatar / banner 总对象数统计完毕（用于进度条）
- [ ] 调用方业务库的 `*_image_hash` / `*_url_legacy` 字段 migration 已上线
- [ ] 图片服务能承接真实流量（V1 验收通过）
- [ ] `image_site_usage` 写入幂等（`ON CONFLICT DO UPDATE`）
- [ ] topic 图床的老桶公开可读配置不变（别意外改成私有）
- [ ] 回滚演练至少走过一次（至少在 dev 环境）

下一篇：[05 — 工程计划](./05-engineering-plan.md)
