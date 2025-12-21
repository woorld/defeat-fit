<script setup lang="ts">
// TODO: ライトモード対応
import AppLogo from '../components/logo/AppLogo.vue';
import WooooorldLogo from '../components/logo/WooooorldLogo.vue';
import LinkWithIcon from '../components/LinkWithIcon.vue';
</script>

<template>
  <VContainer>
    <VRow class="mt-6">
      <VCol cols="6" class="d-flex justify-center align-center ga-4">
        <AppLogo class="logo" />
        <div>
          <h3 class="text-h3">DefeatFit</h3>
          <p class="text-subtitle-1 text-center mt-1">v0.1.0-ultrabeta</p>
        </div>
        <!-- TODO: バージョンを外部からとってくる -->
      </VCol>
      <VCol cols="6" class="text-center d-flex justify-center align-center">
        <WooooorldLogo class="logo" color="white" />
        <div class="flex-1-1-0">
          <p>Developed by <span class="text-h4 ml-2">わーるど</span></p>
          <div class="d-flex justify-center align-center ga-2 mt-2">
            <LinkWithIcon
              linkType="githubRepository"
              iconName="mdi-github"
              :iconSize="32"
            />
            <LinkWithIcon
              linkType="developerTwitter"
              iconName="mdi-twitter"
              :iconSize="32"
            />
          </div>
        </div>
      </VCol>
    </VRow>
    <h3 class="text-h4 text-center mt-12">LICENSE</h3>
    <!-- TODO -->
    <VCard class="mt-4" text="TODO: ライセンステキストを読み込んで表示"></VCard>
  </VContainer>
</template>

<style scoped>
.logo {
  width: 100px;
}

a {
  color: white;
}
</style>
