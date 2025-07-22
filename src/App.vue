<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<template>
  <VApp>
    <VMain>
      <RouterView />
    </VMain>
    <VBottomNavigation>
      <VBtn @click="router.push('/')">
        <VIcon>mdi-home</VIcon>
      </VBtn>
      <VBtn @click="router.push('/setting')">
        <VIcon>mdi-cog</VIcon>
      </VBtn>
    </VBottomNavigation>
  </VApp>
</template>
