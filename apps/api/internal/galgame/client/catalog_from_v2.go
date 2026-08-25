package client

import (
	"errors"

	"kun-galgame-patch-api/pkg/catalogv2"
)

func claimedFrom(c *catalogv2.Claim) *catalogClaimedBy {
	if c == nil {
		return nil
	}
	id, _ := catalogv2.ParseID(c.SiteWorkID)
	return &catalogClaimedBy{
		Site:         c.Site,
		WorkID:       id,
		State:        c.State,
		ContentLimit: c.ContentLimit,
	}
}

func localizedFrom(m map[string]catalogv2.LocalizedText) map[string]catalogLocalizedName {
	if len(m) == 0 {
		return nil
	}
	out := make(map[string]catalogLocalizedName, len(m))
	for k, v := range m {
		out[k] = catalogLocalizedName{Value: v.Value, Machine: v.IsMachine}
	}
	return out
}

func refsFrom(refs *[]catalogv2.Ref) []catalogRef {
	if refs == nil {
		return nil
	}
	out := make([]catalogRef, 0, len(*refs))
	for _, r := range *refs {
		out = append(out, catalogRef{Source: r.Source, ExternalID: r.ExternalID})
	}
	return out
}

func intOrZero(p *int) int {
	if p == nil {
		return 0
	}
	return *p
}

func strOrEmpty(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}

func gradeInt(s *string) int {
	if s == nil {
		return 0
	}
	switch *s {
	case "suggestive":
		return 1
	case "explicit":
		return 2
	default:
		return 0
	}
}

func spoilerInt(s string) int {
	switch s {
	case "minor":
		return 1
	case "major":
		return 2
	default:
		return 0
	}
}

func imageHash(img *catalogv2.Image) string {
	if img == nil {
		return ""
	}
	if img.Hash != "" {
		return img.Hash
	}
	return hashFromURL(img.URL)
}

func workToListItem(w catalogv2.Work) catalogWorkListItem {
	id, _ := w.IntID()
	item := catalogWorkListItem{
		ID:            id,
		Medium:        w.Medium,
		DisplayName:   w.DisplayName,
		ContentRating: w.ContentRating,
		OLang:         w.OLang,
		ReleaseDate:   w.ReleaseDate,
		ClaimedBy:     claimedFrom(w.Claim),
		Updated:       w.UpdatedAt,
		Localized:     localizedFrom(w.Localized),
		Refs:          refsFrom(w.Refs),
	}
	if w.Cover != nil {
		item.Cover = w.Cover.URL
	}
	slots := catalogCoverSlots{}
	if w.Banner != nil {
		b := imageToSlot(w.Banner)
		slots.Banner = &b
	}
	if w.Cover != nil {
		p := imageToSlot(w.Cover)
		slots.Portrait = &p
	}
	if w.Covers != nil {
		for i := range *w.Covers {
			c := &(*w.Covers)[i]
			slot := coverToSlot(c)
			if c.PortraitPinned && slots.Portrait == nil {
				slots.Portrait = &slot
			}
			if !c.PortraitPinned && slots.Banner == nil {
				slots.Banner = &slot
			}
		}
	}
	if slots.Banner != nil || slots.Portrait != nil {
		item.Covers = &slots
	}
	return item
}

func imageToSlot(img *catalogv2.Image) catalogCoverSlot {
	return catalogCoverSlot{
		URL:       img.URL,
		Width:     intOrZero(img.Width),
		Height:    intOrZero(img.Height),
		Thumbhash: strOrEmpty(img.Thumbhash),
		Sexual:    gradeInt(img.Sexual),
		Violence:  gradeInt(img.Violence),
		Source:    img.Source,
	}
}

func coverToSlot(c *catalogv2.Cover) catalogCoverSlot {
	return catalogCoverSlot{
		URL:       c.URL,
		Width:     intOrZero(c.Width),
		Height:    intOrZero(c.Height),
		Thumbhash: strOrEmpty(c.Thumbhash),
		Sexual:    gradeInt(c.Sexual),
		Violence:  gradeInt(c.Violence),
		Source:    c.Source,
	}
}

func workToDetail(w catalogv2.Work) catalogWork {
	item := workToListItem(w)
	out := catalogWork{
		ID:            item.ID,
		Medium:        item.Medium,
		DisplayName:   item.DisplayName,
		OLang:         item.OLang,
		ContentRating: item.ContentRating,
		ReleaseDate:   item.ReleaseDate,
		Created:       w.CreatedAt,
		Updated:       w.UpdatedAt,
		Refs:          item.Refs,
		ClaimedBy:     item.ClaimedBy,
		Localized:     item.Localized,
		CoverSlots:    item.Covers,
	}
	if w.Intros != nil {
		for _, row := range *w.Intros {
			out.Intros = append(out.Intros, catalogWorkIntro{
				Lang: row.Lang, Intro: row.Value, Source: row.Source, Machine: row.IsMachine,
			})
		}
	}
	if w.Covers != nil {
		for i, c := range *w.Covers {
			kind := "main"
			if c.PortraitPinned {
				kind = "portrait"
			}
			out.Covers = append(out.Covers, catalogDetailCover{
				URL:            c.URL,
				Kind:           kind,
				PortraitPinned: c.PortraitPinned,
				Sexual:         gradeInt(c.Sexual),
				Violence:       gradeInt(c.Violence),
				Source:         c.Source,
				Width:          intOrZero(c.Width),
				Height:         intOrZero(c.Height),
				Thumbhash:      strOrEmpty(c.Thumbhash),
			})
			_ = i
		}
	}
	if w.Screenshots != nil {
		for _, s := range *w.Screenshots {
			out.Screenshots = append(out.Screenshots, catalogScreenshot{
				URL: s.URL, Caption: s.Caption, Sexual: gradeInt(s.Sexual),
				Violence: gradeInt(s.Violence), Source: s.Source,
				Width: intOrZero(s.Width), Height: intOrZero(s.Height),
				Thumbhash: strOrEmpty(s.Thumbhash),
			})
		}
	}
	if w.Tags != nil {
		for _, t := range *w.Tags {
			id, _ := catalogv2.ParseID(strOrEmpty(t.ID))
			tier, kind := "", ""
			if t.Tier != nil {
				tier = *t.Tier
			}
			if t.TagKind != nil {
				kind = *t.TagKind
			}
			out.Tags = append(out.Tags, catalogWorkTag{
				Name: t.DisplayName, Source: t.Source, CanonicalID: id,
				Tier: tier, Kind: kind, Spoiler: spoilerInt(t.Spoiler), Sexual: t.IsSexual,
			})
		}
	}
	if w.Companies != nil {
		for _, co := range *w.Companies {
			id, _ := co.IntID()
			kind := co.CompanyKind
			if co.AttributionRole != "" {
				kind = co.AttributionRole
			}
			out.Labels = append(out.Labels, catalogWorkLabel{
				ID: id, DisplayName: co.DisplayName, LabelKind: co.CompanyKind, Kind: kind,
			})
		}
	}
	if w.Characters != nil {
		for _, ch := range *w.Characters {
			id, _ := ch.IntID()
			latin := strOrEmpty(ch.Latin)
			out.Characters = append(out.Characters, catalogWorkCharacter{
				ID: id, DisplayName: ch.DisplayName, Localized: localizedFrom(ch.Localized),
				Latin: latin, Kind: ch.RosterRole, Spoiler: spoilerInt(ch.Spoiler),
				Image: imageHash(ch.Image), Figure: imageHash(ch.Figure),
			})
		}
	}
	if w.Credits != nil {
		for _, g := range *w.Credits {
			group := catalogCreditGroup{RoleKey: g.RoleKey, RoleName: g.RoleName}
			for _, e := range g.Credits {
				id, _ := catalogv2.ParseID(e.ID)
				cid, _ := catalogv2.ParseID(strOrEmpty(e.CharacterID))
				latin := strOrEmpty(e.Latin)
				group.Credits = append(group.Credits, catalogCreditItem{
					catalogPersonRef: catalogPersonRef{
						ID: id, DisplayName: e.DisplayName, Latin: latin,
						Localized: localizedFrom(e.Localized),
					},
					CharacterID: cid,
				})
			}
			out.Credits = append(out.Credits, group)
		}
	}
	if w.Ratings != nil {
		for _, r := range *w.Ratings {
			out.Ratings = append(out.Ratings, catalogRating{
				Source: r.Source, Score: r.Score, VoteCount: r.VoteCount, Rank: r.Rank,
			})
		}
	}
	return out
}

func catalogErr(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, catalogv2.ErrNotFound) {
		return &GalgameError{Code: catalogCodeNotFound, Message: "not found", HTTPStatus: 404}
	}
	if errors.Is(err, catalogv2.ErrNotConfigured) {
		return err
	}
	var p *catalogv2.Problem
	if errors.As(err, &p) {
		if p.Merged() {
			moved, _ := catalogv2.ParseID(p.CurrentID)
			return &GalgameError{Code: catalogCodeMoved, Message: p.Error(), HTTPStatus: 404, Moved: moved}
		}
		status := p.Status
		if status == 0 {
			status = 400
		}
		return &GalgameError{Code: status, Message: p.Error(), HTTPStatus: status}
	}
	return err
}
