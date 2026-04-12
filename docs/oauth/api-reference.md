# KUN OAuth API 参考

所有 API 基础路径：`/api/v1`

所有响应格式：

```json
{
  "code": 0,       // 0=成功, 非零=错误码
  "message": "成功",
  "data": { ... }  // 成功时有数据，失败时无
}
```

---

## OAuth 2.0 端点

### POST /oauth/token

用授权码或刷新令牌换取 access token。

**请求体（授权码模式）**：

```json
{
  "grant_type": "authorization_code",
  "code": "64位hex授权码",
  "redirect_uri": "https://www.kungal.com/auth/callback",
  "client_id": "your-client-id",
  "client_secret": "your-client-secret",
  "code_verifier": "PKCE验证器（如果authorize时使用了code_challenge）"
}
```

**请求体（刷新令牌模式）**：

```json
{
  "grant_type": "refresh_token",
  "refresh_token": "eyJhbGc...",
  "client_id": "your-client-id",
  "client_secret": "your-client-secret"
}
```

**成功响应**：

```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "access_token": "eyJhbGc...",
    "token_type": "Bearer",
    "expires_in": 900,
    "refresh_token": "eyJhbGc...",
    "scope": "openid profile"
  }
}
```

| 字段 | 说明 |
|------|------|
| access_token | JWT，有效期 15 分钟 |
| token_type | 固定 "Bearer" |
| expires_in | 900 秒（15 分钟） |
| refresh_token | JWT，有效期 7 天。每次刷新会轮换 |
| scope | 可选，回显授权时的 scope |

---

### GET /oauth/authorize

获取授权码。用户必须已登录（带 Bearer Token）。

**查询参数**：

| 参数 | 必填 | 说明 |
|------|------|------|
| client_id | 是 | OAuth 客户端 ID |
| redirect_uri | 是 | 回调地址，必须与注册时一致 |
| response_type | 是 | 固定 `code` |
| state | 是 | 随机字符串，防 CSRF |
| scope | 否 | 权限范围，空格分隔 |
| code_challenge | 否 | PKCE code challenge |
| code_challenge_method | 否 | `S256`（默认）或 `plain` |

**成功响应**：HTTP 302 重定向到 `redirect_uri?code=xxx&state=xxx`

**授权码有效期**：10 分钟，一次性使用

---

### GET /oauth/userinfo

获取当前登录用户信息。

**请求头**：`Authorization: Bearer <access_token>`

**成功响应**：

```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "sub": "550e8400-e29b-41d4-a716-446655440000",
    "name": "KUN",
    "email": "kun@kungal.com",
    "picture": "https://...",
    "updated_at": 1234567890
  }
}
```

| 字段 | 说明 |
|------|------|
| sub | 用户 UUID，唯一标识符 |
| name | 用户名 |
| email | 邮箱 |
| picture | 头像 URL（可能为空） |
| updated_at | 最后更新时间（Unix 时间戳） |

---

### POST /oauth/revoke

吊销令牌。遵循 RFC 7009，无论成功失败都返回 200。

**请求体**：

```json
{
  "token": "要吊销的 refresh_token"
}
```

---

## JWT Access Token Claims

```json
{
  "sub": "用户UUID",
  "email": "邮箱",
  "name": "用户名",
  "roles": ["user", "admin"],
  "site_id": 0,
  "exp": 1700000000,
  "iat": 1699999100,
  "nbf": 1699999100
}
```

签名算法：HS256

---

## 错误码速查

### OAuth 错误 (15xxx)

| Code | 消息 | 说明 |
|------|------|------|
| 15001 | 无效的客户端 | client_id 不存在 |
| 15002 | 无效的回调地址 | redirect_uri 未注册 |
| 15003 | 无效的授权码 | code 已过期/已使用/不存在 |
| 15004 | 无效的代码验证器 | PKCE code_verifier 不匹配 |
| 15005 | 无效的授权类型 | grant_type 不支持 |
| 15006 | 无效的权限范围 | scope 不被支持 |
| 15007 | 访问被拒绝 | 用户拒绝授权 |

### 认证错误 (10xxx)

| Code | 消息 | 说明 |
|------|------|------|
| 10001 | 未授权 | 未提供 Bearer Token |
| 10002 | 无效的令牌 | Token 格式错误或签名无效 |
| 10003 | 令牌已过期 | Token 已过期，需要刷新或重新登录 |
| 10005 | 用户不存在 | UUID 对应的用户不存在 |

### 通用错误

| Code | 消息 |
|------|------|
| 1 | 请求格式错误 |
| 7 | 参数验证失败 |
| 10 | 操作失败 |
