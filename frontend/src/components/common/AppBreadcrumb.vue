<template>
  <el-breadcrumb class="app-breadcrumb" separator="/">
    <transition-group name="breadcrumb">
      <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="item.path">
        <span
          v-if="item.redirect === 'noRedirect' || index === breadcrumbs.length - 1"
          class="no-redirect"
        >
          {{ item.meta?.title }}
        </span>
        <a v-else @click.prevent="handleLink(item)">
          {{ item.meta?.title }}
        </a>
      </el-breadcrumb-item>
    </transition-group>
  </el-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RouteLocationNormalized } from 'vue-router'

const route = useRoute()
const router = useRouter()

const breadcrumbs = computed(() => {
  const matched: any[] = []
  route.matched.forEach((item) => {
    if (item.meta?.title) {
      matched.push({
        path: item.path,
        meta: item.meta,
        redirect: item.redirect
      })
    }
  })
  return matched
})

const handleLink = (item: RouteLocationNormalized) => {
  router.push(item.path)
}
</script>

<style scoped>
.app-breadcrumb {
  padding: 12px 0;
}

.no-redirect {
  color: #97a8be;
  cursor: text;
}

a {
  color: #409eff;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
