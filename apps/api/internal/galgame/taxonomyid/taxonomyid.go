// Package taxonomyid resolves OLD wiki taxonomy ids to their catalog
// successors, so the URLs moyu published for years keep landing somewhere
// honest after the wave-A2-2 id-space migration (refs/proj/106 R1 / P2).
//
// Why a static map rather than a lookup call: the catalog's public reverse
// lookup covers work / name / character / label only. Tags were deliberately
// left out of that vocabulary (D4) — they are a classification vocabulary, not
// a cross-source identity family — so the wiki-tag mapping the A2-0 rescue wave
// computed is the only resolver there is. It is FROZEN data: the wiki tag table
// is closed, so this map can never grow, which is exactly what makes vendoring
// it correct rather than lazy.
//
// The two files are byte-identical copies of the infra artifacts
// (refs/proj/132-artifacts + refs/proj/127-artifacts); their md5s are recorded
// in the wave report. Officials are NOT here — they resolve live through
// `lookup?type=label`, which covers 100% of them.
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

// Verdict is what to do with an old id.
type Verdict int

const (
	// NotFound — the id was never a wiki tag. A genuine 404.
	NotFound Verdict = iota
	// Moved — the id maps to a canonical catalog tag; redirect permanently.
	Moved
	// Gone — the id WAS a real wiki tag, but its vocabulary entry has no
	// canonical successor and never will (1,507 of them). This is a 410, not a
	// 404: "this existed and is permanently retired" is a different and more
	// useful fact for a crawler than "no idea what you mean", and it is the
	// honest answer for a URL we published ourselves.
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

// ResolveTag maps an old wiki tag id to its canonical catalog tag id.
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

// Counts reports the loaded table sizes. Used by the test to pin that the
// embedded files actually parsed — an empty map would silently turn every old
// URL into a 404, which looks like a working site and is not one.
func Counts() (mapped, gone int) {
	load()
	return len(tagMap), len(parked)
}
