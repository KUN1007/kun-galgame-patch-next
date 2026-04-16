# 前端改动清单

## 1. API 基础路径

当前 Nitro 的 `useFetch('/api/...')` 在 SSR 阶段走内部调用（零网络开销）。拆分为独立 Go 后端后，SSR 请求需走网络。

### 配置方案

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // SSR 时 Go 后端地址（服务端内网直连）
    apiBase: 'http://127.0.0.1:1007',
    public: {
      // CSR 时 Go 后端地址（可通过 Nginx 代理）
      apiBase: '/api'
    }
  }
})
```

或者 Nginx 反向代理：
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:1007;
}
```

## 2. 响应格式适配

### 当前

Nitro 端点直接返回数据：
```json
[{ "id": 1, "title": "..." }]
```

错误时返回 H3Error：
```json
{ "statusCode": 233, "data": { "code": 233, "message": "错误信息" } }
```

### 目标

Go 端统一包裹：
```json
{ "code": 0, "message": "成功", "data": [{ "id": 1, "title": "..." }] }
```

错误：
```json
{ "code": 233, "message": "错误信息" }
```

### responseHandler.ts 改动

```typescript
// 当前
const onResponse = async (context) => {
  const errorData = context.response._data
  if (errorData?.data?.code === 205) { ... }
  if (errorData?.data?.code === 233) { ... }
}

// 目标
const onResponse = async (context) => {
  const data = context.response._data
  if (data?.code === 205) { ... }
  if (data?.code === 233) { ... }
}
```

所有 `useFetch` / `$fetch` 的数据访问需要从 `data.value` 改为 `data.value.data`（如果当前直接解包的话）。

## 3. 认证相关页面

| 页面 | 当前 | 目标 |
|------|------|------|
| `/login` | 邮箱密码表单 | OAuth 跳转按钮 + PKCE |
| `/register` | 邮箱密码注册 | 跳转 OAuth 注册 或 移除 |
| `/forgot` | 邮箱验证码重置密码 | 跳转 OAuth 重置 或 移除 |

### 登录页改造

```vue
<script setup lang="ts">
const login = () => {
  const { codeVerifier, codeChallenge } = generatePKCE()
  localStorage.setItem('oauth_code_verifier', codeVerifier)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    scope: 'openid profile email',
    state: generateRandomState()
  })

  window.location.href = `${OAUTH_SERVER}/oauth/authorize?${params}`
}
</script>
```

### 回调页新增

```
/auth/callback → POST /api/auth/oauth/callback (code + code_verifier)
```

## 4. Cookie 名变更

| 当前 | 目标 |
|------|------|
| `kungalgame-moemoe-refresh-token` | `kun_session` |
| `kungalgame-moemoe-token` (access) | 移除 |

中间件中读取 Cookie 的地方：
- `app/middleware/auth.ts` — 检查登录状态
- `app/utils/responseHandler.ts` — 205 错误时清除 Cookie

## 5. Store 变更

```typescript
// usePersistUserStore 的 resetUser 需更新
const resetUser = () => {
  // 当前：清除两个 token cookie
  // 目标：清除 kun_session cookie
}
```

## 6. WebSocket 连接

如果保持 Socket.IO 协议（推荐）：

```typescript
// 当前
const socket = io({ auth: { token: refreshToken } })

// 目标：改为 cookie 认证（kun_session 自动携带）
const socket = io({ withCredentials: true })
```

## 7. 数据字段名变更

由于 Go 使用 `json:"snake_case"` tag，大部分字段名保持不变。需要注意的：

- Go 统一返回 `created` / `updated`（和 Prisma 一致，无变化）
- 新增的 `*_count` 字段直接在列表响应中可用，无需前端额外请求
- `_count.like` → `like_count`（字段位置从嵌套变为平铺）

## 8. 分页响应变更

```typescript
// 当前：有的端点返回 [data]，有的返回 { data, total }
// 目标：统一为
{ "code": 0, "message": "成功", "data": [...], "total": 42 }
```

## 9. 不需要改动的部分

- Tailwind CSS 样式 — 纯前端，无关后端
- 组件结构 — 不变
- Pinia Store 结构 — 不变（除 auth 相关）
- 路由结构 — 不变
- Milkdown 编辑器 — 不变
- 国际化 — 不变
