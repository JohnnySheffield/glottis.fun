import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [
    svelte({
      preprocess: {
        style: ({ content }) => {
          return {
            code: content,
            map: null
          }
        }
      }
    })
  ],
  server: {
    port: 3000
  }
})
