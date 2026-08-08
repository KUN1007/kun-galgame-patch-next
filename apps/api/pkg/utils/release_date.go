package utils

import (
	"errors"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"
)

var ErrInvalidReleaseBound = errors.New("invalid release date bound (expect YYYY or YYYY-MM)")

var ErrInvalidMonthSet = errors.New("invalid released_months (expect comma-separated 1-12)")

func ParseMonthSet(s string) ([]int, error) {
	if strings.TrimSpace(s) == "" {
		return nil, nil
	}
	seen := make(map[int]struct{})
	months := make([]int, 0, 12)
	for _, part := range strings.Split(s, ",") {
		p := strings.TrimSpace(part)
		m, err := strconv.Atoi(p)
		if err != nil || m < 1 || m > 12 {
			return nil, ErrInvalidMonthSet
		}
		if _, dup := seen[m]; dup {
			continue
		}
		seen[m] = struct{}{}
		months = append(months, m)
	}
	sort.Ints(months)
	return months, nil
}

var (
	releaseYearRe  = regexp.MustCompile(`^\d{4}$`)
	releaseMonthRe = regexp.MustCompile(`^(\d{4})-(\d{2})$`)
)

func ParseReleaseLowerBound(s string) (*time.Time, error) {
	if s == "" {
		return nil, nil
	}
	if releaseYearRe.MatchString(s) {
		t := time.Date(atoi(s), time.January, 1, 0, 0, 0, 0, time.UTC)
		return &t, nil
	}
	if m := releaseMonthRe.FindStringSubmatch(s); m != nil {
		mm := atoi(m[2])
		if mm < 1 || mm > 12 {
			return nil, ErrInvalidReleaseBound
		}
		t := time.Date(atoi(m[1]), time.Month(mm), 1, 0, 0, 0, 0, time.UTC)
		return &t, nil
	}
	return nil, ErrInvalidReleaseBound
}

func ParseReleaseUpperBound(s string) (*time.Time, error) {
	if s == "" {
		return nil, nil
	}
	if releaseYearRe.MatchString(s) {
		t := time.Date(atoi(s), time.December, 31, 0, 0, 0, 0, time.UTC)
		return &t, nil
	}
	if m := releaseMonthRe.FindStringSubmatch(s); m != nil {
		mm := atoi(m[2])
		if mm < 1 || mm > 12 {
			return nil, ErrInvalidReleaseBound
		}
		firstNext := time.Date(atoi(m[1]), time.Month(mm)+1, 1, 0, 0, 0, 0, time.UTC)
		last := firstNext.AddDate(0, 0, -1)
		return &last, nil
	}
	return nil, ErrInvalidReleaseBound
}

func ParseGalgameReleaseDate(s string) *time.Time {
	if s == "" {
		return nil
	}
	layouts := []string{
		"2006-01-02",
		time.RFC3339,
		"2006-01-02T15:04:05.000Z07:00",
	}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, s); err == nil {
			d := time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC)
			return &d
		}
	}
	return nil
}

func atoi(s string) int {
	n, _ := strconv.Atoi(s)
	return n
}
