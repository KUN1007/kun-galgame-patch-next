package client

// Mapper tests: the projections in catalog_map.go that decide what a moyu DTO
// says, given a catalog record.

import "testing"

// TestVndbIDOfPicksTheWorkAnchor pins which vndb id leaves the mapper.
//
// The include=refs block is the registry's COMPLETE set of exact anchors for a
// work, and vndb contributes two id spaces to it: one work anchor (`v…`) and one
// RELEASE anchor per release (`r…`). The wire carries {source, external_id} and
// no kind, so `source == "vndb"` matches both. moyu joins its patch rows on
// vndb_id, which is the work id — an `r`-id there matches nothing and every
// affected game reports has_patch = false.
func TestVndbIDOfPicksTheWorkAnchor(t *testing.T) {
	cases := []struct {
		name string
		refs []catalogRef
		want string
	}{
		{
			name: "release anchor first — the work anchor still wins",
			refs: []catalogRef{
				{Source: "vndb", ExternalID: "r123"},
				{Source: "vndb", ExternalID: "v456"},
			},
			want: "v456",
		},
		{
			name: "release anchors only — no work id to report",
			refs: []catalogRef{
				{Source: "vndb", ExternalID: "r123"},
				{Source: "vndb", ExternalID: "r124"},
			},
			want: "",
		},
		{
			name: "work anchor alone",
			refs: []catalogRef{{Source: "vndb", ExternalID: "v42"}},
			want: "v42",
		},
		{
			name: "other sources are skipped, whatever they are keyed on",
			refs: []catalogRef{
				{Source: "dlsite", ExternalID: "RJ01234"},
				{Source: "bangumi", ExternalID: "v42"},
				{Source: "vndb", ExternalID: "v42"},
			},
			want: "v42",
		},
		{
			name: "malformed vndb ids are not work anchors",
			refs: []catalogRef{
				{Source: "vndb", ExternalID: "v"},
				{Source: "vndb", ExternalID: "v12a"},
				{Source: "vndb", ExternalID: "vn3"},
				{Source: "vndb", ExternalID: ""},
			},
			want: "",
		},
		{name: "no refs at all", refs: nil, want: ""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := vndbIDOf(tc.refs); got != tc.want {
				t.Errorf("vndbIDOf = %q, want %q", got, tc.want)
			}
		})
	}
}
