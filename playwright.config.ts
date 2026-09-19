import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  timeout: 180_000,
  use: { baseURL: 'http://localhost:3100', trace: 'retain-on-failure' },
  webServer: {
    // Build de producción en el puerto 3100: Next 16 no permite un segundo `next dev` en la misma carpeta
    command: 'npm run e2e:serve',
    url: 'http://localhost:3100/entrar',
    reuseExistingServer: false,
    timeout: 240_000,
    env: {
      DATABASE_URL: 'file:.data/e2e.db',
      DATABASE_AUTH_TOKEN: '',
      MAIL_DIR: '.data/e2e-emails',
      UPLOAD_DIR: '.data/e2e-uploads',
      BETTER_AUTH_URL: 'http://localhost:3100',
      BETTER_AUTH_SECRET: 'e2e-secreto-de-prueba-con-32-caracteres',
      AI_MODEL: '',
      RESEND_API_KEY: '',
      BLOB_READ_WRITE_TOKEN: '',
      // Sin Google: el entorno E2E no debe depender de las credenciales del .env local
      GOOGLE_CLIENT_ID: '',
      GOOGLE_CLIENT_SECRET: '',
    },
  },
})
