package dto

// CreateTagRequest is the request for creating a tag
type CreateTagRequest struct {
	Name         string   `json:"name" validate:"required,min=1,max=17"`
	Introduction string   `json:"introduction" validate:"max=10007"`
	Alias        []string `json:"alias" validate:"dive,min=1,max=17"`
}

// GetTagRequest is the request for fetching tags
type GetTagRequest struct {
	Page  int `query:"page" validate:"required,min=1"`
	Limit int `query:"limit" validate:"required,min=1,max=100"`
}

// GetPatchByTagRequest is the request for fetching patches by tag
type GetPatchByTagRequest struct {
	Page  int `query:"page" validate:"required,min=1"`
	Limit int `query:"limit" validate:"required,min=1,max=24"`
}

// SearchRequest is the generic search request for metadata
type SearchRequest struct {
	Query []string `json:"query" validate:"required,min=1,max=10,dive,min=1,max=107"`
}

// CreateCompanyRequest is the request for creating a company
type CreateCompanyRequest struct {
	Name            string   `json:"name" validate:"required,min=1,max=107"`
	Introduction    string   `json:"introduction" validate:"max=10007"`
	Alias           []string `json:"alias" validate:"dive,min=1,max=17"`
	PrimaryLanguage []string `json:"primary_language" validate:"required,min=1,dive,min=1,max=17"`
	OfficialWebsite []string `json:"official_website" validate:"dive,max=10007"`
	ParentBrand     []string `json:"parent_brand" validate:"dive,min=1,max=17"`
}

// GetMetadataRequest is the generic pagination request for metadata lists
type GetMetadataRequest struct {
	Page  int `query:"page" validate:"required,min=1"`
	Limit int `query:"limit" validate:"required,min=1,max=72"`
}

// GetReleaseRequest is the request for fetching releases by month
type GetReleaseRequest struct {
	Year  int `query:"year" validate:"required,min=1,max=5000"`
	Month int `query:"month" validate:"required,min=1,max=12"`
}
