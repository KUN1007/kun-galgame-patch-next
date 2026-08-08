package imageclient

import (
	"context"
	"sync"
	"time"
)

type MetaResolver struct {
	client  *Client
	timeout time.Duration
	mu      sync.RWMutex
	cache   map[string]ImageMeta
}

func (c *Client) NewMetaResolver(timeout time.Duration) *MetaResolver {
	if timeout <= 0 {
		timeout = 3 * time.Second
	}
	return &MetaResolver{client: c, timeout: timeout, cache: map[string]ImageMeta{}}
}

func (r *MetaResolver) Resolve(hashes []string) map[string]ImageMeta {
	out := make(map[string]ImageMeta, len(hashes))
	var miss []string

	r.mu.RLock()
	for _, h := range hashes {
		if m, ok := r.cache[h]; ok {
			out[h] = m
		} else {
			miss = append(miss, h)
		}
	}
	r.mu.RUnlock()

	if len(miss) == 0 || !r.client.Configured() {
		return out
	}

	ctx, cancel := context.WithTimeout(context.Background(), r.timeout)
	defer cancel()
	fetched, err := r.client.MetaBatch(ctx, dedupHashes(miss))
	if err != nil {
		return out
	}

	r.mu.Lock()
	for h, m := range fetched {
		out[h] = m
		if m.Thumbhash != "" {
			r.cache[h] = m
		}
	}
	r.mu.Unlock()
	return out
}

func (r *MetaResolver) Put(hash string, m ImageMeta) {
	if hash == "" {
		return
	}
	r.mu.Lock()
	r.cache[hash] = m
	r.mu.Unlock()
}

func dedupHashes(in []string) []string {
	if len(in) < 2 {
		return in
	}
	seen := make(map[string]struct{}, len(in))
	out := make([]string, 0, len(in))
	for _, s := range in {
		if _, ok := seen[s]; ok {
			continue
		}
		seen[s] = struct{}{}
		out = append(out, s)
	}
	return out
}
