import path from 'node:path'
import Vue from '@vitejs/plugin-vue'

import Unocss from 'unocss/vite'
import IconsResolver from 'unplugin-icons/resolver'
// ✨ 导入 Icons 相关的模块
import Icons from 'unplugin-icons/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

import Components from 'unplugin-vue-components/vite'

import VueRouter from 'unplugin-vue-router/vite'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      // 保持 '~/': `${path.resolve(__dirname, 'src')}/` 不变
      '~/': `${path.resolve(__dirname, 'src')}/`,
    },
  },

  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "~/styles/element/index.scss" as *;`,
        api: 'modern-compiler',
      },
    },
  },

  plugins: [
    Vue(),

    // https://github.com/posva/unplugin-vue-router
    VueRouter({
      extensions: ['.vue', '.md'],
      dts: 'src/typed-router.d.ts',
    }),

    // ✨ 1. 修正 Icons 插件配置：移除 customCollections: ['ep']
    Icons({
      autoInstall: true,
      compiler: 'vue3',
    }),

    Components({
      // allow auto load markdown components under `./src/components/`
      extensions: ['vue', 'md'],
      // allow auto import and register components used in markdown
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
      resolvers: [
        ElementPlusResolver({
          importStyle: 'sass',
        }),
        // ✨ 2. Icons Resolver 配置保持不变 (这是正确的)
        IconsResolver({
          // 'ep' 是 element-plus 的默认图标集别名
          prefix: 'i', // 确保解析 <i-ep-search>
        }),
      ],
      dts: 'src/components.d.ts',
    }),

    // https://github.com/antfu/unocss
    // see uno.config.ts for config
    Unocss(),
  ],

  ssr: {
    // TODO: workaround until they support native ESM
    noExternal: ['element-plus'],
  },
})
