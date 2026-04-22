import type { RouteRecordRaw, RouterScrollBehavior } from 'vue-router'

declare module 'unplugin-vue-router/client' {
  interface RouteMetadata {
    /**
     * Optional route title.
     * Used to automatically set the page title.
     */
    title?: string
  }
}

export interface LazyComponents {
  layouts: {
    default: () => Promise<ReturnType<typeof defineComponent>>
  }
}
