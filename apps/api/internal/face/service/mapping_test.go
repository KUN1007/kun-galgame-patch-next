package service

import (
	"encoding/json"
	"strings"
	"testing"
	"time"

	patchModel "kun-galgame-patch-api/internal/patch/model"
)

func TestResourceDTOCarriesNoWayToDownload(t *testing.T) {
	svc := New(nil, nil, nil, "https://www.moyu.moe")
	row := patchModel.PatchResource{
		ID:        7,
		GalgameID: 42,
		Storage:   "s3",
		Name:      "汉化补丁 v1.0",
		Size:      "120 MB",
		Blake3:    "abc123hashvalue",
		Content:   "https://oss.moyu.moe/secret/download.zip",
		S3Key:     "patches/v19658/secret.zip",
		Code:      "SECRET-EXTRACT-CODE",
		Password:  "SECRET-ARCHIVE-PW",
		Note:      "解压后覆盖安装目录",
		Type:      patchModel.JSONArray{"ai"},
		Language:  patchModel.JSONArray{"zh-Hans"},
		Platform:  patchModel.JSONArray{"windows"},
	}

	encoded, err := json.Marshal(svc.resourceDTO(&row))
	if err != nil {
		t.Fatal(err)
	}
	body := string(encoded)

	// Marshalling and searching the whole document rather than checking named
	// fields: this has to keep holding when someone adds a field years from
	// now. Revealing a link on this site is a separate rate-limited request,
	// and the gateway admits any valid key -- a link here is the bulk export
	// that endpoint exists to prevent.
	for _, secret := range []string{
		row.Content, row.S3Key, row.Code, row.Password,
	} {
		if strings.Contains(body, secret) {
			t.Errorf("resource DTO leaked %q:\n%s", secret, body)
		}
	}
	if !strings.Contains(body, `"web_url":"https://www.moyu.moe/resource/7"`) {
		t.Errorf("no absolute web_url to send a reader to:\n%s", body)
	}
	if !strings.Contains(body, `"hash":"abc123hashvalue"`) {
		t.Errorf("the BLAKE3 is the only stable identity of the bytes and should survive:\n%s", body)
	}
}

func TestPatchDTOShape(t *testing.T) {
	svc := New(nil, nil, nil, "https://www.moyu.moe")
	work := int64(61311)
	limit := "nsfw"
	released := time.Date(2016, 11, 25, 0, 0, 0, 0, time.UTC)
	row := patchModel.Patch{
		ID:            223309,
		VndbID:        "v65869",
		CatalogWorkID: &work,
		ContentLimit:  &limit,
		ReleaseDate:   &released,
		ResourceCount: 3,
		Created:       time.Date(2026, 1, 2, 3, 4, 5, 0, time.UTC),
	}

	item := svc.patchDTO(&row)
	if item.ID != "223309" || item.CatalogWorkID == nil || *item.CatalogWorkID != "61311" {
		t.Fatalf("ids = %+v; both are strings on the wire and they are different id spaces", item)
	}
	if item.ReleaseDate == nil || *item.ReleaseDate != "2016-11-25" {
		t.Errorf("release date = %v, want a bare YYYY-MM-DD", item.ReleaseDate)
	}
	if item.CreatedAt != "2026-01-02T03:04:05Z" {
		t.Errorf("created_at = %q, want RFC 3339 in UTC", item.CreatedAt)
	}
	if item.ContentLimit == nil || *item.ContentLimit != "nsfw" {
		t.Errorf("content limit = %v, want catalog's own vocabulary", item.ContentLimit)
	}

	// An unmirrored row answers null rather than guessing sfw: catalog is the
	// authority and 129 of 10,925 pages have not been mirrored yet.
	row.ContentLimit = nil
	if svc.patchDTO(&row).ContentLimit != nil {
		t.Error("an unmirrored content limit must stay null")
	}

	// The empty jsonb columns have to marshal as [], not null: a caller
	// iterating language would have to nil-check a field that is always a list.
	encoded, _ := json.Marshal(svc.patchDTO(&row))
	if !strings.Contains(string(encoded), `"language":[]`) {
		t.Errorf("empty arrays must not marshal as null:\n%s", encoded)
	}
}

func TestMissingAnchorsEchoesTheCallersSpelling(t *testing.T) {
	work := int64(61311)
	rows := []patchModel.Patch{
		{ID: 1, VndbID: "v65869", CatalogWorkID: &work},
	}
	q := &PatchQuery{Refs: []string{"vndb:v65869", "catalog:61311", "vndb:v999", "catalog:7"}}
	got := missingAnchors(q, rows)
	want := []string{"vndb:v999", "catalog:7"}
	if len(got) != len(want) {
		t.Fatalf("missing = %v, want %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("missing = %v, want %v", got, want)
		}
	}

	// Nothing asked for, nothing missing -- and never a null, which a caller
	// would have to special-case against the empty list.
	if m := missingAnchors(&PatchQuery{}, rows); m == nil || len(m) != 0 {
		t.Errorf("missing = %v, want an empty list", m)
	}
}
