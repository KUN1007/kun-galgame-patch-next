package taxonomyid

import (
	_ "embed"
	"encoding/json"
	"strconv"
	"sync"
)

//go:embed wiki-tag-id-to-catalog-tag-id.json
var tagMapJSON []byte

//go:embed parked-l-tags-unmapped.json
var parkedTagsJSON []byte

type Verdict int

const (
	NotFound Verdict = iota
	Moved
	Gone
)

var (
	once   sync.Once
	tagMap map[int]int64
	parked map[int]struct{}
)

func load() {
	once.Do(func() {
		raw := map[string]int64{}
		_ = json.Unmarshal(tagMapJSON, &raw)
		tagMap = make(map[int]int64, len(raw))
		for k, v := range raw {
			if id, err := strconv.Atoi(k); err == nil {
				tagMap[id] = v
			}
		}
		var parkedRows []struct {
			TagID int `json:"tag_id"`
		}
		_ = json.Unmarshal(parkedTagsJSON, &parkedRows)
		parked = make(map[int]struct{}, len(parkedRows))
		for _, r := range parkedRows {
			parked[r.TagID] = struct{}{}
		}
	})
}

func ResolveTag(wikiID int) (int64, Verdict) {
	load()
	if id, ok := tagMap[wikiID]; ok {
		return id, Moved
	}
	if _, ok := parked[wikiID]; ok {
		return 0, Gone
	}
	return 0, NotFound
}

func Counts() (mapped, gone int) {
	load()
	return len(tagMap), len(parked)
}
