package trust

type ReportReason struct {
	Key      string `json:"key"`
	Label    string `json:"label"`
	Severity int    `json:"severity"`
}

var GlobalReasons = []ReportReason{
	{Key: "abuse", Label: "辱骂骚扰", Severity: 2},
	{Key: "spam", Label: "垃圾信息", Severity: 1},
	{Key: "illegal", Label: "违法内容", Severity: 3},
	{Key: "rating_mislabel", Label: "分级标注错误", Severity: 1},
	{Key: "copyright", Label: "版权侵权", Severity: 2},
	{Key: "other", Label: "其他", Severity: 1},
}
