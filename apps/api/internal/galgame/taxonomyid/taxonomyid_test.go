package taxonomyid

import "testing"

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
	if id, v := ResolveTag(1); v != Moved || id != 55 {
		t.Errorf("ResolveTag(1) = (%d, %v), want (55, Moved)", id, v)
	}
	if _, v := ResolveTag(15); v != Gone {
		t.Errorf("ResolveTag(15) = %v, want Gone", v)
	}
	if _, v := ResolveTag(99999999); v != NotFound {
		t.Errorf("ResolveTag(99999999) = %v, want NotFound", v)
	}
}
