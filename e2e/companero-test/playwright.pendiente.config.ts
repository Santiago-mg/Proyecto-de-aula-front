import base from './playwright.config'
import { defineConfig } from '@playwright/test'

// Corre SOLO las especificaciones que esperan código que este front no tiene.
export default defineConfig({
  ...base,
  testDir: './pendiente-codigo-del-companero',
  testIgnore: [],
})
