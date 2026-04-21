import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: false },

  modules: [
    '@nuxt/image',
    '@nuxt/icon',
    '@nuxt/eslint',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    'nuxt-schema-org',
    'nuxt-umami'
  ],

  devServer: {
    host: '127.0.0.1',
    port: 6969
  },

  // Frontend
  css: ['~/styles/index.css'],

  imports: {
    dirs: ['shared/utils/**']
  },

  pinia: {
    storesDirs: ['./stores/**']
  },

  piniaPluginPersistedstate: {
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'strict'
    }
  },

  colorMode: {
    preference: 'system',
    fallback: 'light',
    globalName: '__KUNGALGAME_COLOR_MODE__',
    componentName: 'ColorScheme',
    classPrefix: 'kun-',
    classSuffix: '-mode',
    storageKey: 'kungalgame-color-mode'
  },

  vite: {
    plugins: [tailwindcss()]
  },

  umami: {
    id: process.env.KUN_VISUAL_NOVEL_FORUM_UMAMI_ID,
    host: 'https://stats.kungal.org/',
    autoTrack: true
  },

  runtimeConfig: {
    public: {
      apiBase:
        process.env.KUN_VISUAL_NOVEL_NUXT_PUBLIC_API_BASE ||
        'http://127.0.0.1:9277/api/v1',
      oauthServerUrl:
        process.env.NUXT_PUBLIC_KUN_OAUTH_SERVER_URL ||
        'http://127.0.0.1:9277/api/v1',
      oauthClientId: process.env.NUXT_PUBLIC_KUN_OAUTH_CLIENT_ID || '',
      oauthRedirectUri: process.env.NUXT_PUBLIC_KUN_OAUTH_REDIRECT_URI || ''
    }
  }
})
