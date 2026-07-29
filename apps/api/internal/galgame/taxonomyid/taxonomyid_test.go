package taxonomyid

import "testing"

// TestEmbeddedTablesLoad pins the sizes the A2-0 rescue wave published. An
// embed that silently failed to parse yields empty maps, which turns every old
// taxonomy URL into a 404 — a site that looks fine and has quietly dropped
// 3,037 published URLs. The numbers are the wave's own counts, so a
// regenerated artifact that disagrees fails here and gets looked at.
func TestEmbeddedTablesLoad(t *testing.T) {
	mapped, gone := Counts()
	if mapped != 1530 {
		t.Errorf("mapped tags = %d, want 1530 (refs/proj/132-artifacts)", mapped)
	}
	if gone != 1507 {
		t.Errorf("parked tags = %d, want 1507 (refs/proj/127-artifacts)", gone)
	}
}

func TestResolveTag(t *testing.T) {
	// A mapped id redirects; the fixture pair is the first row of the artifact.
	if id, v := ResolveTag(1); v != Moved || id != 55 {
		t.Errorf("ResolveTag(1) = (%d, %v), want (55, Moved)", id, v)
	}
	// A parked id is GONE, not missing: we published this URL, and the
	// vocabulary entry behind it is permanently retired.
	if _, v := ResolveTag(15); v != Gone {
		t.Errorf("ResolveTag(15) = %v, want Gone", v)
	}
	// An id that was never a wiki tag is a plain 404.
	if _, v := ResolveTag(99999999); v != NotFound {
		t.Errorf("ResolveTag(99999999) = %v, want NotFound", v)
	}
}
