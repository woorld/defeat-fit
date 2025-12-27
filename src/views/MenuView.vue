<script setup lang="ts">
</script>

<template>
  <VContainer>
    <VBtnToggle class="d-flex justify-center mt-6 mb-10 rounded-xl" density="comfortable">
      <VBtn border to="/menu/edit">メニュー編集</VBtn>
      <VBtn border to="/menu/preset">プリセット編集</VBtn>
    </VBtnToggle>
    <RouterView v-slot="{Component}">
      <Transition mode="out-in">
        <Component :is="Component" />
      </Transition>
    </RouterView>
  </VContainer>
</template>
