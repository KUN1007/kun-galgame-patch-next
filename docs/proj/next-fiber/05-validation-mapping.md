# 请求验证映射：Zod → Go Validator

## 验证策略

当前项目使用 Zod schema 在 `apps/web/validations/` 中定义验证规则，通过 `apps/next-server/utils/parseQuery.ts` 中的工具函数应用到请求上。

Go 端使用 `go-playground/validator` + Fiber 内置解析，封装在 `pkg/utils/validate.go` 中。

### 解析工具映射

| 当前 (TypeScript) | 目标 (Go) | 说明 |
|-------------------|-----------|------|
| `kunParseGetQuery(req, schema)` | `utils.ParseQueryAndValidate(c, &dto)` | GET 查询参数 |
| `kunParsePostBody(req, schema)` | `utils.ParseAndValidate(c, &dto)` | POST/PUT JSON body |
| `kunParsePutBody(req, schema)` | `utils.ParseAndValidate(c, &dto)` | 同上 |
| `kunParseDeleteQuery(req, schema)` | `utils.ParseQueryAndValidate(c, &dto)` | DELETE 查询参数 |
| `kunParseFormData(req, schema)` | `c.FormFile()` + 手动解析 | 文件上传 |

## DTO 定义

每个模块的 `dto/` 目录包含请求和响应 DTO。以下是所有 Zod schema 到 Go struct 的映射。

### auth 模块

```go
// OAuth 回调
type OAuthCallbackDTO struct {
    Code         string `json:"code" validate:"required"`
    CodeVerifier string `json:"code_verifier" validate:"required"`
}

// 忘记密码 - 发送验证码
type ForgotSendCodeDTO struct {
    Name string `json:"name" validate:"required"` // 邮箱或用户名
}

// 忘记密码 - 重置密码
type ForgotResetDTO struct {
    Name             string `json:"name" validate:"required"`
    VerificationCode string `json:"verification_code" validate:"required,len=6"`
    NewPassword      string `json:"new_password" validate:"required,min=6,max=1007"`
    ConfirmPassword  string `json:"confirm_password" validate:"required,eqfield=NewPassword"`
}

// 发送邮箱修改验证码
type SendEmailCodeDTO struct {
    Email   string `json:"email" validate:"required,email"`
    Captcha string `json:"captcha" validate:"required,len=10"`
}
```

### patch 模块

```go
// 创建补丁（FormData）
type PatchCreateDTO struct {
    VndbID           string `form:"vndbId" validate:"max=10"`
    NameZhCn         string `form:"name_zh_cn" validate:"max=1007"`
    NameJaJp         string `form:"name_ja_jp" validate:"max=1007"`
    NameEnUs         string `form:"name_en_us" validate:"max=1007"`
    IntroductionZhCn string `form:"introduction_zh_cn" validate:"max=100007"`
    IntroductionJaJp string `form:"introduction_ja_jp" validate:"max=100007"`
    IntroductionEnUs string `form:"introduction_en_us" validate:"max=100007"`
    Alias            string `form:"alias" validate:"max=2333"`
    Released         string `form:"released" validate:"max=30"`
    ContentLimit     string `form:"contentLimit" validate:"oneof=sfw nsfw"`
    // Banner 文件通过 c.FormFile("banner") 单独获取
}

// 更新补丁
type PatchUpdateDTO struct {
    VndbID           string   `json:"vndb_id" validate:"max=10"`
    NameZhCn         string   `json:"name_zh_cn" validate:"max=1007"`
    NameJaJp         string   `json:"name_ja_jp" validate:"max=1007"`
    NameEnUs         string   `json:"name_en_us" validate:"max=1007"`
    IntroductionZhCn string   `json:"introduction_zh_cn" validate:"max=100007"`
    IntroductionJaJp string   `json:"introduction_ja_jp" validate:"max=100007"`
    IntroductionEnUs string   `json:"introduction_en_us" validate:"max=100007"`
    Alias            []string `json:"alias" validate:"max=30,dive,max=1007"`
    Released         string   `json:"released" validate:"max=30"`
    ContentLimit     string   `json:"content_limit" validate:"oneof=sfw nsfw"`
}

// 检查重复
type DuplicateCheckDTO struct {
    VndbID string `query:"vndbId" validate:"required,startswith=v,max=10"`
}

// 获取评论列表
type GetPatchCommentDTO struct {
    Page  int `query:"page" validate:"required,min=1"`
    Limit int `query:"limit" validate:"required,min=1,max=30"`
}

// 创建评论
type PatchCommentCreateDTO struct {
    PatchID  int    `json:"patch_id" validate:"required,min=1"`
    ParentID *int   `json:"parent_id" validate:"omitempty,min=1"`
    Content  string `json:"content" validate:"required,min=1,max=10007"`
    Captcha  string `json:"captcha" validate:"max=10"`
}

// 更新评论
type PatchCommentUpdateDTO struct {
    Content string `json:"content" validate:"required,min=1,max=10007"`
}

// 创建资源
type PatchResourceCreateDTO struct {
    PatchID  int      `json:"patch_id" validate:"required,min=1"`
    Storage  string   `json:"storage" validate:"required"`
    Name     string   `json:"name" validate:"max=300"`
    ModelName string  `json:"model_name" validate:"max=1007"`
    Hash     string   `json:"hash" validate:"max=107"`
    Content  string   `json:"content" validate:"required,min=1,max=1007"`
    Size     string   `json:"size" validate:"required"`
    Code     string   `json:"code" validate:"max=1007"`
    Password string   `json:"password" validate:"max=1007"`
    Note     string   `json:"note" validate:"max=10007"`
    Type     []string `json:"type" validate:"required,min=1,max=10"`
    Language []string `json:"language" validate:"required,min=1,max=10"`
    Platform []string `json:"platform" validate:"required,min=1,max=10"`
}

// 更新资源（在 CreateDTO 基础上增加 ResourceID，通过路径参数传入）
type PatchResourceUpdateDTO struct {
    PatchResourceCreateDTO
}

// 更新补丁横幅
type UpdatePatchBannerDTO struct {
    // Banner 文件通过 c.FormFile("image") 获取
    // PatchID 通过路径参数 :id 获取
}
```

### user 模块

```go
// 获取用户信息
type GetUserInfoDTO struct {
    Page  int `query:"page" validate:"min=1"`
    Limit int `query:"limit" validate:"min=1,max=20"`
}

// 修改用户名
type UpdateUsernameDTO struct {
    Username string `json:"username" validate:"required,min=1,max=17"`
}

// 修改简介
type UpdateBioDTO struct {
    Bio string `json:"bio" validate:"required,min=1,max=107"`
}

// 修改密码
type UpdatePasswordDTO struct {
    OldPassword string `json:"old_password" validate:"required"`
    NewPassword string `json:"new_password" validate:"required,min=6,max=1007"`
}

// 修改邮箱
type UpdateEmailDTO struct {
    Email string `json:"email" validate:"required,email"`
    Code  string `json:"code" validate:"required,len=6"`
}

// 搜索用户（@提及）
type SearchUserDTO struct {
    Query string `query:"query" validate:"required,min=1,max=20"`
}

// 关注/取消关注 - 通过路径参数 :uid 获取
```

### admin 模块

```go
// 管理后台分页
type AdminPaginationDTO struct {
    Page   int    `query:"page" validate:"required,min=1"`
    Limit  int    `query:"limit" validate:"required,min=1,max=100"`
    Search string `query:"search" validate:"max=300"`
}

// 更新用户
type AdminUpdateUserDTO struct {
    Name            string `json:"name" validate:"required,min=1,max=17"`
    Role            int    `json:"role" validate:"required,min=1,max=3"`
    Status          int    `json:"status" validate:"min=0,max=2"`
    DailyImageCount int    `json:"daily_image_count" validate:"min=0,max=50"`
    Bio             string `json:"bio" validate:"max=107"`
}

// 批准创作者
type ApproveCreatorDTO struct {
    UID int `json:"uid" validate:"required,min=1"`
}

// 拒绝创作者
type DeclineCreatorDTO struct {
    Reason string `json:"reason" validate:"required,min=1,max=1007"`
}

// 统计查询
type AdminStatsDTO struct {
    Days int `query:"days" validate:"required,min=1"`
}
```

### message 模块

```go
// 获取消息
type GetMessageDTO struct {
    Type  string `query:"type" validate:"omitempty"`
    Page  int    `query:"page" validate:"required,min=1"`
    Limit int    `query:"limit" validate:"required,min=1,max=30"`
}

// 创建消息
type CreateMessageDTO struct {
    Type        string `json:"type" validate:"required"`
    Content     string `json:"content" validate:"required,max=1007"`
    RecipientID int    `json:"recipient_id" validate:"required,min=1"`
    Link        string `json:"link" validate:"max=1007"`
}

// 标记已读
type ReadMessageDTO struct {
    Type string `json:"type" validate:"required,max=20"`
}
```

### metadata 模块

```go
// 标签
type CreateTagDTO struct {
    Name         string   `json:"name" validate:"required,min=1,max=17"`
    Introduction string   `json:"introduction" validate:"max=10007"`
    Alias        []string `json:"alias" validate:"dive,min=1,max=17"`
}

type GetTagDTO struct {
    Page  int `query:"page" validate:"required,min=1"`
    Limit int `query:"limit" validate:"required,min=1,max=100"`
}

type SearchTagDTO struct {
    Query []string `json:"query" validate:"required,min=1,max=10,dive,min=1,max=107"`
}

// 公司
type CreateCompanyDTO struct {
    Name            string   `json:"name" validate:"required,min=1,max=107"`
    Introduction    string   `json:"introduction" validate:"max=10007"`
    Alias           []string `json:"alias" validate:"dive,min=1,max=17"`
    PrimaryLanguage []string `json:"primary_language" validate:"required,min=1,dive,min=1,max=17"`
    OfficialWebsite []string `json:"official_website" validate:"dive,max=10007"`
    ParentBrand     []string `json:"parent_brand" validate:"dive,min=1,max=17"`
}

// 角色/人物 - 通用分页
type GetMetadataDTO struct {
    Page  int `query:"page" validate:"required,min=1"`
    Limit int `query:"limit" validate:"required,min=1,max=72"`
}

// 通用搜索
type SearchMetadataDTO struct {
    Query []string `json:"query" validate:"required,min=1,max=10,dive,min=1,max=107"`
}

// 发售日历
type GetReleaseDTO struct {
    Year  int `query:"year" validate:"required,min=1,max=5000"`
    Month int `query:"month" validate:"required,min=1,max=12"`
}
```

### common 模块

```go
// Galgame 列表
type GetGalgameListDTO struct {
    SelectedType string `query:"selectedType" validate:"required,min=1,max=107"`
    SortField    string `query:"sortField" validate:"required,oneof=resource_update_time created view download"`
    SortOrder    string `query:"sortOrder" validate:"required,oneof=asc desc"`
    Page         int    `query:"page" validate:"required,min=1"`
    Limit        int    `query:"limit" validate:"required,min=1,max=24"`
    YearString   string `query:"yearString" validate:"max=1007"`
    MonthString  string `query:"monthString" validate:"max=1007"`
}

// 搜索
type SearchDTO struct {
    Query        []string `json:"query" validate:"required,min=1,max=10,dive,min=1,max=107"`
    Page         int      `json:"page" validate:"required,min=1"`
    Limit        int      `json:"limit" validate:"required,min=1,max=24"`
    SearchOption struct {
        SearchInIntroduction bool `json:"searchInIntroduction"`
        SearchInAlias        bool `json:"searchInAlias"`
        SearchInTag          bool `json:"searchInTag"`
    } `json:"searchOption"`
}

// 全局评论列表
type GetCommentListDTO struct {
    SortField string `query:"sortField" validate:"required,oneof=created like"`
    SortOrder string `query:"sortOrder" validate:"required,oneof=asc desc"`
    Page      int    `query:"page" validate:"required,min=1"`
    Limit     int    `query:"limit" validate:"required,min=1,max=50"`
}

// 全局资源列表
type GetResourceListDTO struct {
    SortField string `query:"sortField" validate:"required,oneof=update_time created download like"`
    SortOrder string `query:"sortOrder" validate:"required,oneof=asc desc"`
    Page      int    `query:"page" validate:"required,min=1"`
    Limit     int    `query:"limit" validate:"required,min=1,max=50"`
}
```

### chat 模块

```go
// 创建群聊
type CreateChatRoomDTO struct {
    Name          string `json:"name" validate:"required,min=1,max=107"`
    Link          string `json:"link" validate:"required,min=3,max=17"`
    Avatar        string `json:"avatar" validate:"required,url,max=1007"`
    MemberIDArray []int  `json:"member_id_array" validate:"required,dive,min=1"`
}

// 加入群聊
type JoinChatRoomDTO struct {
    Link string `json:"link" validate:"required,min=3,max=17"`
}

// 获取聊天记录
type GetChatMessageDTO struct {
    Cursor int `query:"cursor" validate:"omitempty,min=1"`
    Limit  int `query:"limit" validate:"required,min=1,max=50"`
}
```

## 自定义验证规则

以下 Zod 验证有自定义逻辑，需要在 Go 端注册自定义 validator：

| 规则 | 当前实现 | Go 实现 |
|------|---------|---------|
| 邮箱/用户名混合 | `z.string()` + 正则判断 | 自定义 validator `email_or_username` |
| 密码强度 | 正则 `/^(?=.*[a-zA-Z])(?=.*[0-9])/` | 自定义 validator `strong_password` |
| 资源大小格式 | `ResourceSizeRegex` | 自定义 validator `resource_size` |
| VNDB ID 格式 | `/^v\d{1,6}$/` | 自定义 validator `vndb_id` |
| 聊天室链接 | 自定义校验函数 | 自定义 validator `chat_link` |
