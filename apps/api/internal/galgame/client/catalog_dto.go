package client

const (
	catalogClaimStateLive    = "live"
	catalogClaimStateDraft   = "draft"
	catalogClaimStateHidden  = "hidden"
	catalogClaimStatePending = "pending"
)

// Claim sites are product identities, not external_ref source keys. Both
// spellings stay readable until the Wave 161 re-site has soaked.
const catalogClaimSiteKungal = "kungal"

const catalogClaimSiteLegacy = "galgame_wiki"

func isGIDClaimSite(site string) bool {
	return site == catalogClaimSiteKungal || site == catalogClaimSiteLegacy
}

type catalogClaimedBy struct {
	Site         string `json:"site"`
	WorkID       int64  `json:"work_id"`
	State        string `json:"state"`
	ContentLimit string `json:"content_limit"`
}

func (c *catalogClaimedBy) gid() int {
	if c == nil || !isGIDClaimSite(c.Site) {
		return 0
	}
	return int(c.WorkID)
}

func (c *catalogClaimedBy) renderable() bool {
	return c == nil || c.State != catalogClaimStateHidden
}

func (c *catalogClaimedBy) live() bool {
	return c != nil && isGIDClaimSite(c.Site) && c.State == catalogClaimStateLive
}

type catalogRef struct {
	Source     string `json:"source"`
	ExternalID string `json:"external_id"`
}

// Catalog wave 210 turned each slot of the names block from a bare string into
// a row. The slot keys did not change, so nothing about the shape looks wrong
// until json.Unmarshal refuses it — and it refuses the whole response, which
// took works / works/search / calendar down together.
type catalogNameSlot struct {
	Value   string `json:"value"`
	Machine bool   `json:"machine"`
}

type catalogNames struct {
	JaJP catalogNameSlot `json:"ja-jp"`
	ZhCN catalogNameSlot `json:"zh-cn"`
	ZhTW catalogNameSlot `json:"zh-tw"`
	EnUS catalogNameSlot `json:"en-us"`
}

type catalogIntroSlot struct {
	Intro   string `json:"intro"`
	Source  string `json:"source"`
	Machine bool   `json:"machine"`
}

type catalogIntros struct {
	JaJP *catalogIntroSlot `json:"ja-jp"`
	ZhCN *catalogIntroSlot `json:"zh-cn"`
	ZhTW *catalogIntroSlot `json:"zh-tw"`
	EnUS *catalogIntroSlot `json:"en-us"`
}

type catalogCoverSlot struct {
	URL       string `json:"url"`
	Width     int    `json:"width"`
	Height    int    `json:"height"`
	Thumbhash string `json:"thumbhash"`
	Sexual    int    `json:"sexual"`
	Violence  int    `json:"violence"`
	Source    string `json:"source"`
}

type catalogCoverSlots struct {
	Portrait *catalogCoverSlot `json:"portrait"`
	Banner   *catalogCoverSlot `json:"banner"`
}

type catalogWorkListItem struct {
	ID            int64             `json:"id"`
	Medium        string            `json:"medium"`
	DisplayName   string            `json:"display_name"`
	ContentRating string            `json:"content_rating"`
	OLang         string            `json:"olang"`
	ReleaseDate   *string           `json:"release_date"`
	ClaimedBy     *catalogClaimedBy `json:"claimed_by"`
	Cover         string            `json:"cover"`
	Updated       string            `json:"updated"`

	Names  *catalogNames      `json:"names"`
	Intros *catalogIntros     `json:"intros"`
	Covers *catalogCoverSlots `json:"covers"`
	Refs   []catalogRef       `json:"refs"`
}

type catalogWorksListData struct {
	Items      []catalogWorkListItem `json:"items"`
	NextCursor *string               `json:"next_cursor"`
}

type catalogWorksSearchData struct {
	Total int64                 `json:"total"`
	Page  int                   `json:"page"`
	Limit int                   `json:"limit"`
	Items []catalogWorkListItem `json:"items"`
}

type catalogCalendarMeta struct {
	Today    string `json:"today"`
	MinMonth string `json:"min_month"`
	MaxMonth string `json:"max_month"`
	HasPrev  *bool  `json:"has_prev"`
	HasNext  *bool  `json:"has_next"`
}

type catalogCalendarData struct {
	Month      string                `json:"month"`
	Year       string                `json:"year"`
	Count      int64                 `json:"count"`
	Items      []catalogWorkListItem `json:"items"`
	NextCursor *string               `json:"next_cursor"`
	Meta       catalogCalendarMeta   `json:"meta"`
}

type catalogTitle struct {
	Lang    string `json:"lang"`
	Title   string `json:"title"`
	Kind    string `json:"kind"`
	Machine bool   `json:"machine"`
}

type catalogWorkIntro struct {
	Lang    string `json:"lang"`
	Intro   string `json:"intro"`
	Source  string `json:"source"`
	Machine bool   `json:"machine"`
}

type catalogDetailCover struct {
	URL            string `json:"url"`
	Kind           string `json:"kind"`
	PortraitPinned bool   `json:"portrait_pinned"`
	Sexual         int    `json:"sexual"`
	Violence       int    `json:"violence"`
	Source         string `json:"source"`
	Width          int    `json:"width"`
	Height         int    `json:"height"`
	Thumbhash      string `json:"thumbhash"`
}

type catalogScreenshot struct {
	URL       string `json:"url"`
	Caption   string `json:"caption"`
	Sexual    int    `json:"sexual"`
	Violence  int    `json:"violence"`
	Source    string `json:"source"`
	Width     int    `json:"width"`
	Height    int    `json:"height"`
	Thumbhash string `json:"thumbhash"`
}

type catalogWorkTag struct {
	Name        string `json:"name"`
	Count       int    `json:"count"`
	Source      string `json:"source"`
	CanonicalID int64  `json:"canonical_id"`
	Tier        string `json:"tier"`
	Kind        string `json:"kind"`
	Spoiler     int    `json:"spoiler"`
	Sexual      bool   `json:"sexual"`
}

type catalogWorkLabel struct {
	ID          int64  `json:"id"`
	DisplayName string `json:"display_name"`
	LabelKind   string `json:"label_kind"`
	Kind        string `json:"kind"`
	Lang        string `json:"lang"`
	LogoHash    string `json:"logo_hash"`
}

type catalogWorkEngine struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

type catalogWorkLink struct {
	Source string `json:"source"`
	URL    string `json:"url"`
}

type catalogWork struct {
	ID            int64             `json:"id"`
	Medium        string            `json:"medium"`
	DisplayName   string            `json:"display_name"`
	OLang         string            `json:"olang"`
	ContentRating string            `json:"content_rating"`
	ReleaseDate   *string           `json:"release_date"`
	Created       string            `json:"created"`
	Updated       string            `json:"updated"`
	Titles        []catalogTitle    `json:"titles"`
	Refs          []catalogRef      `json:"refs"`
	ClaimedBy     *catalogClaimedBy `json:"claimed_by"`

	Intro       []catalogWorkIntro   `json:"intro"`
	Covers      []catalogDetailCover `json:"covers"`
	Screenshots []catalogScreenshot  `json:"screenshots"`
	Tags        []catalogWorkTag     `json:"tags"`
	Labels      []catalogWorkLabel   `json:"labels"`
	Engines     []catalogWorkEngine  `json:"engines"`
	Links       []catalogWorkLink    `json:"links"`
}

type catalogLookupPair struct {
	Source     string `json:"source"`
	ExternalID string `json:"external_id"`
}

type catalogLookupBatchRequest struct {
	Items []catalogLookupPair `json:"items"`
}

type catalogLookupBatchItem struct {
	Source     string            `json:"source"`
	ExternalID string            `json:"external_id"`
	Work       *catalogWorkBrief `json:"work"`
	ClaimedBy  *catalogClaimedBy `json:"claimed_by"`
}

type catalogWorkBrief struct {
	ID            int64  `json:"id"`
	Medium        string `json:"medium"`
	DisplayName   string `json:"display_name"`
	ContentRating string `json:"content_rating"`
}

type catalogLookupBatchData struct {
	Items []catalogLookupBatchItem `json:"items"`
}

type catalogLookupData struct {
	Work      *catalogWorkBrief `json:"work"`
	ClaimedBy *catalogClaimedBy `json:"claimed_by"`
}
