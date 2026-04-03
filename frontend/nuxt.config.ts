// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  modules: ['@pinia/nuxt'],

  components: {
    dirs: [
      { path: '~/components', pathPrefix: false },
    ],
  },

  css: ['~/assets/css/tailwind.css'],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8001/api/v1',
    },
  },

  app: {
    head: {
      title: 'Engineering Management System',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Multi-tenant SaaS Engineering Management System' },
      ],
    },
  },

  typescript: {
    strict: true,
  },
});
