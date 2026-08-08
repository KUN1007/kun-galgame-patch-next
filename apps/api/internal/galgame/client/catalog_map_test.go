package client

import "testing"

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
