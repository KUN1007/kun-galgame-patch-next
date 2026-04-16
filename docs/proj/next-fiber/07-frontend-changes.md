# 前端变更清单

## 1. API 请求基础路径

### 当前

Next.js API Routes 与前端同源，无需配置 base path：
```typescript
// 前端直接调用相对路径
const res = await fetch('/api/patch/comment?patchId=1&page=1&limit=10')
```

### 目标

Go 后端独立部署，需要区分 SSR 和 CSR 请求：

```typescript
// SSR（服务端渲染）：直接访问 Go 后端内网地址
const API_BASE_SSR = 'http://127.0.0.1:1007'

// CSR（客户端渲染）：通过 Nginx 反向代理
const API_BASE_CSR = '/api'  // Nginx 将 /api 代理到 Go 后端
```

封装统一的 fetch 工具：
```typescript
function getApiBase() {
  if (typeof window === 'undefined') {
    return process.env.API_BASE_SSR || 'http://127.0.0.1:1007'
  }
  return '/api'
}
```

### Nginx 配置

```nginx
server {
    listen 80;

    # Go API 后端
    location /api/ {
        proxy_pass http://127.0.0.1:1007/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://127.0.0.1:1007/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Next.js 前端
    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

---

## 2. 响应格式适配

### 当前

端点直接返回数据，无包裹：
```typescript
// 成功
const data = await res.json()  // 直接是数据
// 错误
const message = await res.json()  // 字符串消息
```

### 目标

统一包裹格式：
```typescript
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}
```

封装响应处理器：
```typescript
async function kunFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const base = getApiBase()
  const res = await fetch(`${base}${url}`, {
    ...options,
    credentials: 'include',  // 携带 Cookie
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  const json: ApiResponse<T> = await res.json()

  if (json.code !== 0) {
    // 统一错误处理
    if (json.code === 40100) {
      // Session 过期，跳转登录
      redirectToLogin()
    }
    throw new ApiError(json.code, json.message)
  }

  return json.data
}
```

### 错误码映射

| 当前 | 目标 | 说明 |
|------|------|------|
| HTTP 200 + 字符串 body | `code: 40000` | 通用业务错误 |
| HTTP 200 + 特定错误码 205 | `code: 40100` | 认证过期 |
| HTTP 200 + 特定错误码 233 | `code: 40300` | 权限不足 |

---

## 3. 认证流程

### 登录页

**当前**：邮箱/密码表单
```typescript
// 提交 → POST /api/auth/login → 设置 JWT Cookie
```

**目标**：OAuth 跳转按钮
```typescript
import { generatePKCE } from '@/utils/pkce'

async function handleLogin() {
  const { codeVerifier, codeChallenge } = await generatePKCE()

  // 存储 code_verifier（回调时需要）
  sessionStorage.setItem('code_verifier', codeVerifier)

  // 跳转到 OAuth 授权页
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID!,
    redirect_uri: `${window.location.origin}/auth/callback`,
    response_type: 'code',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  window.location.href = `${OAUTH_BASE_URL}/oauth/authorize?${params}`
}
```

### 回调页（新增）

```
/auth/callback?code=xxx
```

```typescript
// pages/auth/callback/page.tsx
export default function AuthCallback() {
  useEffect(() => {
    const code = searchParams.get('code')
    const codeVerifier = sessionStorage.getItem('code_verifier')

    fetch('/api/auth/oauth/callback', {
      method: 'POST',
      body: JSON.stringify({ code, code_verifier: codeVerifier }),
      credentials: 'include',
    })
    .then(() => {
      sessionStorage.removeItem('code_verifier')
      router.push('/')
    })
  }, [])
}
```

### 注册页

**当前**：用户名 + 邮箱 + 密码 + 验证码表单
**目标**：与登录页合并，都使用 OAuth 流程。OAuth 服务器自带注册功能。

### 登出

**当前**：
```typescript
await fetch('/api/user/status/logout', { method: 'POST' })
// 清除本地状态
```

**目标**：
```typescript
await kunFetch('/auth/logout', { method: 'POST' })
// 后端清除 Redis Session + 吊销 OAuth Token
// 清除本地状态
```

---

## 4. Cookie 变更

| 当前 | 目标 | 说明 |
|------|------|------|
| `kun-galgame-patch-moe-token` | `kun_session` | 认证 Cookie 名 |
| JWT Token（客户端可解码） | Session ID（不透明） | 无法在客户端获取用户信息 |

影响：当前如果有前端代码解码 JWT 获取用户信息的逻辑，需要改为调用 `GET /api/auth/me`。

---

## 5. 状态管理（Zustand Store）

### 当前 UserState

```typescript
interface UserState {
  uid: number
  name: string
  avatar: string
  bio: string
  moemoepoint: number
  role: number
  dailyCheckIn: number
  dailyImageLimit: number
  dailyUploadLimit: number
}
```

### 变更

- 获取方式：`GET /api/user/status` → `GET /api/auth/me`
- 数据结构保持基本不变
- 登录状态判断：检查 `uid > 0` 即可（Session 过期后 `/auth/me` 返回 401）
- 初始化时机：`_app.tsx` 或 layout 中调用 `/auth/me`

---

## 6. WebSocket 连接

### 当前

```typescript
import { io } from 'socket.io-client'

const socket = io({
  path: '/ws',
  query: { id: user.uid.toString() }
})
```

### 目标（使用 go-socket.io）

```typescript
const socket = io({
  path: '/ws',
  withCredentials: true,  // 携带 Cookie 认证
  // 移除 query.id，改用 Cookie 中的 Session 认证
})
```

变更点：
- 认证方式从 `query.id` 改为 `withCredentials: true`
- Socket.IO 客户端版本兼容性需要测试（go-socket.io 支持的协议版本）

---

## 7. NSFW 设置传递

当前通过请求头传递 NSFW 设置，保持不变：

```typescript
headers: {
  'x-nsfw-header': JSON.stringify({ showNSFW: userSettings.showNSFW })
}
```

在 `kunFetch` 封装中自动附加此 header。

---

## 8. 文件上传

### 当前

```typescript
// 补丁横幅上传
const formData = new FormData()
formData.append('image', file)
formData.append('patchId', patchId.toString())
await fetch('/api/patch/banner', { method: 'POST', body: formData })
```

### 目标

```typescript
// 路径变更，FormData 格式不变
const formData = new FormData()
formData.append('image', file)
await kunFetch(`/patch/${patchId}/banner`, {
  method: 'POST',
  body: formData,
  headers: {},  // 不设置 Content-Type，让浏览器自动设置 multipart boundary
})
```

分块上传逻辑不变，仅端点路径变更。

---

## 9. 忘记密码

**当前**：两步流程（`/forgot/one` → `/forgot/two`）
**目标**：端点路径变更为 `/api/auth/forgot/send-code` 和 `/api/auth/forgot/reset`

前端页面逻辑保持不变，仅修改 API 调用路径。

---

## 10. 逐步迁移策略

使用 Nginx 路由分流实现渐进式迁移：

```nginx
# 已迁移到 Go 的端点
location ~ ^/api/(auth|patch|user)/ {
    proxy_pass http://127.0.0.1:1007;
}

# 尚未迁移的端点，继续走 Next.js
location /api/ {
    proxy_pass http://127.0.0.1:3000;
}
```

每完成一个模块的迁移和测试，将对应路径切换到 Go 后端。

---

## 变更清单汇总

| 项 | 文件/目录 | 变更类型 | 说明 |
|----|----------|---------|------|
| API 封装 | `lib/kunFetch.ts`（新增） | 新增 | 统一 fetch + 响应解包 + 错误处理 |
| 登录页 | `app/(auth)/login/` | 重写 | OAuth 跳转 |
| 注册页 | `app/(auth)/register/` | 重写或移除 | OAuth 处理注册 |
| 回调页 | `app/(auth)/callback/`（新增） | 新增 | OAuth 回调处理 |
| 忘记密码 | `app/(auth)/forgot/` | 修改 | API 路径变更 |
| 用户 Store | `store/userStore.ts` | 修改 | 获取方式变更 |
| Socket 连接 | `lib/socket.ts` | 修改 | 认证方式变更 |
| 所有 API 调用 | 散布在各组件中 | 修改 | 使用 `kunFetch` + 新路径 |
| 环境变量 | `.env` | 修改 | 新增 OAuth 相关变量 |
