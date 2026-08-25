package catalogv2

import (
	"context"
	"net/url"
	"strconv"
)

type Company struct {
	ID          string                   `json:"id"`
	DisplayName string                   `json:"display_name"`
	Latin       *string                  `json:"latin"`
	Localized   map[string]LocalizedText `json:"localized"`
	CompanyKind string                   `json:"company_kind"`
	WorkCount   int                      `json:"work_count"`
}

func (c Company) IntID() (int64, bool) { return ParseID(c.ID) }

type CreditName struct {
	ID          string                   `json:"id"`
	DisplayName string                   `json:"display_name"`
	Latin       *string                  `json:"latin"`
	Localized   map[string]LocalizedText `json:"localized"`
	PersonID    *string                  `json:"person_id"`
}

func (n CreditName) IntID() (int64, bool) { return ParseID(n.ID) }

type NameCredit struct {
	Work  Work             `json:"work"`
	Roles []NameCreditRole `json:"roles"`
}

type NameCreditRole struct {
	RoleKey     string  `json:"role_key"`
	RoleName    string  `json:"role_name"`
	CharacterID *string `json:"character_id"`
}

type Character struct {
	ID          string                   `json:"id"`
	DisplayName string                   `json:"display_name"`
	Latin       *string                  `json:"latin"`
	Localized   map[string]LocalizedText `json:"localized"`
	Gender      *string                  `json:"gender"`
	Image       *Image                   `json:"image"`
	Figure      *Image                   `json:"figure"`
}

func (ch Character) IntID() (int64, bool) { return ParseID(ch.ID) }

type Person struct {
	ID                  string  `json:"id"`
	DisplayName         string  `json:"display_name"`
	PrimaryCreditNameID *string `json:"primary_credit_name_id"`
	Gender              *string `json:"gender"`
	Image               *Image  `json:"image"`
}

type Tag struct {
	ID          string                   `json:"id"`
	DisplayName string                   `json:"display_name"`
	Tier        string                   `json:"tier"`
	TagKind     string                   `json:"tag_kind"`
	IsSexual    bool                     `json:"is_sexual"`
	WorkCount   int                      `json:"work_count"`
	Localized   map[string]LocalizedText `json:"localized"`
}

func (t Tag) IntID() (int64, bool) { return ParseID(t.ID) }

func (c *Client) GetCompany(ctx context.Context, id int64, nsfw bool) (*Company, error) {
	var out Company
	if err := c.get(ctx, "/v2/catalog/companies/"+FormatID(id)+nsfwQuery(nsfw), &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *Client) GetCreditName(ctx context.Context, id int64, nsfw bool) (*CreditName, error) {
	var out CreditName
	if err := c.get(ctx, "/v2/catalog/credit-names/"+FormatID(id)+nsfwQuery(nsfw), &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *Client) CreditNameCredits(ctx context.Context, id int64, nsfw bool, cursor string, limit int) (*List[NameCredit], error) {
	return getPaged[NameCredit](ctx, c, "/v2/catalog/credit-names/"+FormatID(id)+"/credits", nsfw, cursor, limit)
}

func (c *Client) GetPerson(ctx context.Context, id int64) (*Person, error) {
	var out Person
	if err := c.get(ctx, "/v2/catalog/persons/"+FormatID(id), &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *Client) GetCharacter(ctx context.Context, id int64, nsfw bool) (*Character, error) {
	v := url.Values{}
	v.Set("view", "full")
	if nsfw {
		v.Set("nsfw", "true")
	} else {
		v.Set("nsfw", "false")
	}
	var out Character
	if err := c.get(ctx, "/v2/catalog/characters/"+FormatID(id)+"?"+v.Encode(), &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *Client) GetTag(ctx context.Context, id int64, nsfw bool) (*Tag, error) {
	var out Tag
	if err := c.get(ctx, "/v2/catalog/tags/"+FormatID(id)+nsfwQuery(nsfw), &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *Client) EntityByRef(ctx context.Context, object, source, externalID string, nsfw bool) (id int64, err error) {
	v := url.Values{}
	v.Set("refs", source+":"+externalID)
	v.Set("limit", "1")
	if nsfw {
		v.Set("nsfw", "true")
	}
	path := "/v2/catalog/" + object + "s?" + v.Encode()
	if object == "company" {
		path = "/v2/catalog/companies?" + v.Encode()
	}
	if object == "credit_name" {
		path = "/v2/catalog/credit-names?" + v.Encode()
	}
	var page List[struct {
		ID string `json:"id"`
	}]
	if err := c.get(ctx, path, &page); err != nil {
		return 0, err
	}
	if len(page.Items) == 0 {
		return 0, ErrNotFound
	}
	n, ok := ParseID(page.Items[0].ID)
	if !ok {
		return 0, ErrNotFound
	}
	return n, nil
}

func getPaged[T any](ctx context.Context, c *Client, path string, nsfw bool, cursor string, limit int) (*List[T], error) {
	v := url.Values{}
	if limit > 0 {
		v.Set("limit", strconv.Itoa(limit))
	}
	if cursor != "" {
		v.Set("cursor", cursor)
	}
	if nsfw {
		v.Set("nsfw", "true")
	} else {
		v.Set("nsfw", "false")
	}
	q := v.Encode()
	if q != "" {
		path += "?" + q
	}
	var out List[T]
	if err := c.get(ctx, path, &out); err != nil {
		return nil, err
	}
	if out.Items == nil {
		out.Items = []T{}
	}
	return &out, nil
}

func nsfwQuery(nsfw bool) string {
	if nsfw {
		return "?nsfw=true"
	}
	return "?nsfw=false"
}
