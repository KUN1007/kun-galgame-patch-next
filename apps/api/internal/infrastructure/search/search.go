// Package search 封装 Meilisearch client，提供补丁索引和搜索能力。
//
// 索引策略（D10 后续；最小可用版）：
//   - 单索引 "patch"，主键为 patch.id
//   - 可搜索字段：name_en_us/name_zh_cn/name_ja_jp/vndb_id/
//     introduction_en_us/introduction_zh_cn/introduction_ja_jp/alias/tags
//   - 启动时做一次全量索引（异步，非阻塞）
//   - patch CRUD 完成后异步 Upsert/Delete 同步到 Meilisearch
package search

import (
	"context"
	"fmt"
	"log/slog"

	"kun-galgame-patch-api/pkg/config"

	"github.com/meilisearch/meilisearch-go"
)

const (
	IndexPatch = "patch"
)

// Client 包装 Meilisearch 客户端，并提供 patch 相关的高层方法。
type Client struct {
	ms meilisearch.ServiceManager
}

// PatchDocument 写入 Meilisearch 的 patch 文档形状。
type PatchDocument struct {
	ID                int      `json:"id"`
	NameEnUs          string   `json:"name_en_us"`
	NameZhCn          string   `json:"name_zh_cn"`
	NameJaJp          string   `json:"name_ja_jp"`
	VndbID            string   `json:"vndb_id"`
	IntroductionEnUs  string   `json:"introduction_en_us"`
	IntroductionZhCn  string   `json:"introduction_zh_cn"`
	IntroductionJaJp  string   `json:"introduction_ja_jp"`
	Alias             []string `json:"alias"`
	Tags              []string `json:"tags"`
	ContentLimit      string   `json:"content_limit"`
	Created           int64    `json:"created"` // unix seconds，方便按时间排序
}

// New 构建 Client。cfg.Host 为空时返回禁用的占位实例。
func New(cfg config.SearchConfig) *Client {
	if cfg.Host == "" {
		slog.Warn("Meilisearch 未配置，搜索模块禁用")
		return &Client{}
	}

	opts := []meilisearch.Option{}
	if cfg.APIKey != "" {
		opts = append(opts, meilisearch.WithAPIKey(cfg.APIKey))
	}
	ms := meilisearch.New(cfg.Host, opts...)

	slog.Info("Meilisearch 客户端就绪", "host", cfg.Host)
	return &Client{ms: ms}
}

// Ready 指示 client 是否已连上。
func (c *Client) Ready() bool { return c.ms != nil }

// EnsurePatchIndex 创建 patch 索引（已存在则跳过）并配置可搜索字段。
// 启动时调用，幂等。
func (c *Client) EnsurePatchIndex(ctx context.Context) error {
	if !c.Ready() {
		return nil
	}

	// 获取或创建 index（Meilisearch 在 AddDocuments 时也会自动创建，这里显式一下）
	_, err := c.ms.GetIndexWithContext(ctx, IndexPatch)
	if err != nil {
		task, err := c.ms.CreateIndexWithContext(ctx, &meilisearch.IndexConfig{
			Uid:        IndexPatch,
			PrimaryKey: "id",
		})
		if err != nil {
			return fmt.Errorf("创建 patch 索引失败: %w", err)
		}
		if _, err := c.ms.WaitForTaskWithContext(ctx, task.TaskUID, 0); err != nil {
			return fmt.Errorf("等待 patch 索引创建失败: %w", err)
		}
	}

	index := c.ms.Index(IndexPatch)
	searchable := []string{
		"name_en_us", "name_zh_cn", "name_ja_jp",
		"vndb_id", "alias", "tags",
		"introduction_en_us", "introduction_zh_cn", "introduction_ja_jp",
	}
	if _, err := index.UpdateSearchableAttributesWithContext(ctx, &searchable); err != nil {
		return fmt.Errorf("设置可搜索字段失败: %w", err)
	}

	filterable := []any{"content_limit"}
	if _, err := index.UpdateFilterableAttributesWithContext(ctx, &filterable); err != nil {
		return fmt.Errorf("设置过滤字段失败: %w", err)
	}

	sortable := []string{"created"}
	if _, err := index.UpdateSortableAttributesWithContext(ctx, &sortable); err != nil {
		return fmt.Errorf("设置排序字段失败: %w", err)
	}

	return nil
}

// UpsertPatches 批量写入或更新 patch 文档。非阻塞：失败只记日志不 panic。
func (c *Client) UpsertPatches(ctx context.Context, docs []PatchDocument) error {
	if !c.Ready() || len(docs) == 0 {
		return nil
	}
	index := c.ms.Index(IndexPatch)
	_, err := index.AddDocumentsWithContext(ctx, docs, nil)
	if err != nil {
		return fmt.Errorf("写入 patch 文档失败: %w", err)
	}
	return nil
}

// DeletePatch 从索引里删除一个补丁。
func (c *Client) DeletePatch(ctx context.Context, id int) error {
	if !c.Ready() {
		return nil
	}
	index := c.ms.Index(IndexPatch)
	_, err := index.DeleteDocumentWithContext(ctx, fmt.Sprintf("%d", id), nil)
	return err
}

// SearchPatches 搜索 patch。支持 NSFW 过滤、分页。
func (c *Client) SearchPatches(ctx context.Context, query string, page, limit int, nsfwFilter string) (hits []PatchDocument, total int64, err error) {
	if !c.Ready() {
		return nil, 0, fmt.Errorf("搜索服务暂不可用")
	}

	req := &meilisearch.SearchRequest{
		Limit:                 int64(limit),
		Offset:                int64((page - 1) * limit),
		AttributesToHighlight: []string{}, // 不返回高亮，前端自己处理
	}
	if nsfwFilter != "" {
		req.Filter = fmt.Sprintf("content_limit = %q", nsfwFilter)
	}

	resp, err := c.ms.Index(IndexPatch).SearchWithContext(ctx, query, req)
	if err != nil {
		return nil, 0, fmt.Errorf("搜索失败: %w", err)
	}

	hits = make([]PatchDocument, 0, len(resp.Hits))
	for _, h := range resp.Hits {
		var doc PatchDocument
		if err := h.DecodeInto(&doc); err != nil {
			slog.Warn("解析 hit 失败", "error", err)
			continue
		}
		hits = append(hits, doc)
	}
	return hits, resp.EstimatedTotalHits, nil
}
