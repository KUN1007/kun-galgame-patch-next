package main

import (
	"path/filepath"
	"regexp"
	"strings"
)

type parsedPatch struct {
	Company     string
	StartDate   string
	GameName    string
	VndbID      string
	PlatformRaw string
	Platform    string
	GroupName   string
	PublishDate string
	LangRaw     string
	Languages   []string
	FileName    string
	FilePath    string
}

var (
	bracketRe       = regexp.MustCompile(`\[[^\]]+\]`)
	bracketInnerRe  = regexp.MustCompile(`\[([^\]]+)\]`)
	vndbRe          = regexp.MustCompile(`(?i)v(\d{1,6})`)
	windowsKeywords = []string{"windows", "win32", "win64", "win"}
	extStripRe      = regexp.MustCompile(`\.[^.]+$`)
)

func normalizeLanguages(lang string) []string {
	s := strings.ToUpper(lang)
	var out []string
	if strings.Contains(s, "CHS") {
		out = append(out, "zh-Hans")
	}
	if strings.Contains(s, "CHT") {
		out = append(out, "zh-Hant")
	}
	if len(out) == 0 {
		return []string{"zh-Hans"}
	}
	return out
}

func normalizePlatform(p string) string {
	s := strings.ToLower(p)
	for _, k := range windowsKeywords {
		if strings.Contains(s, k) {
			return "windows"
		}
	}
	return "other"
}

func parsePatchFileName(filePath string) *parsedPatch {
	fileName := filepath.Base(filePath)
	withoutExt := extStripRe.ReplaceAllString(fileName, "")

	locs := bracketRe.FindAllStringIndex(withoutExt, -1)
	inner := bracketInnerRe.FindAllStringSubmatch(withoutExt, -1)
	if len(locs) < 7 || len(inner) < 7 {
		return nil
	}

	title := strings.TrimSpace(withoutExt[locs[1][1]:locs[2][0]])

	get := func(i int) string {
		if i < len(inner) {
			return strings.TrimSpace(inner[i][1])
		}
		return ""
	}
	company, startDate := get(0), get(1)
	vPart, platformRaw := get(2), get(3)
	groupName, publishDate, langRaw := get(4), get(5), get(6)

	vm := vndbRe.FindStringSubmatch(vPart)
	if vm == nil {
		return nil
	}
	vndbID := "v" + vm[1]

	if langRaw == "" {
		langRaw = "CHS"
	}
	return &parsedPatch{
		Company:     company,
		StartDate:   startDate,
		GameName:    title,
		VndbID:      vndbID,
		PlatformRaw: platformRaw,
		Platform:    normalizePlatform(platformRaw),
		GroupName:   groupName,
		PublishDate: publishDate,
		LangRaw:     langRaw,
		Languages:   normalizeLanguages(langRaw),
		FileName:    fileName,
		FilePath:    filePath,
	}
}
