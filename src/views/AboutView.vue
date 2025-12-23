<script setup lang="ts">
// TODO: ライトモード対応
import { ref } from 'vue';
import type { License } from '../../common/types';
import AppLogo from '../components/logo/AppLogo.vue';
import WooooorldLogo from '../components/logo/WooooorldLogo.vue';
import LinkWithIcon from '../components/LinkWithIcon.vue';

const licenseText = ref<License[]>([]);

(async () => {
  licenseText.value = await window.file.getLicenses();
})();
</script>

<template>
  <VContainer>
    <div class="mt-12 mb-16 d-flex justify-center align-center ga-16">
      <div class="text-center">
        <div class="d-flex justify-end align-center ga-4">
          <AppLogo class="logo" />
          <div class="text-center">
            <h3 class="text-h4 font-weight-bold">DefeatFit</h3>
            <!-- TODO: バージョンを外部からとってくる -->
            <p class="text-subtitle-1 text-grey">v0.1.0-ultrabeta</p>
          </div>
        </div>
        <LinkWithIcon
          class="mt-5"
          linkType="githubRepository"
          linkText="GitHub Repository"
          iconName="mdi-github"
        />
      </div>
      <div class="text-center">
        <div class="d-flex justify-start align-center ga-4">
          <div class="text-center">
            <p class="text-subtitle-1 text-grey">Developed by</p>
            <p class="text-h4 font-weight-bold">わーるど</p>
          </div>
          <WooooorldLogo class="logo" color="white" />
        </div>
        <LinkWithIcon
          class="mt-5"
          linkType="developerTwitter"
          linkText="Developer's Twitter"
          iconName="mdi-twitter"
        />
      </div>
    </div>
    <h3 class="text-h5 text-center">OSS Licenses</h3>
    <VExpansionPanels class="mt-4">
      <VExpansionPanel  v-for="license of licenseText">
        <template #title>
          <span>{{ license.name }}</span>
          <span class="text-grey ml-2">{{ license.version }}</span>
        </template>
        <template #text>
          <pre class="text-pre-wrap">{{ license.licenseText }}</pre>
        </template>
      </VExpansionPanel>
    </VExpansionPanels>
  </VContainer>
</template>

<style scoped>
.logo {
  width: 100px;
  height: 100px;
}
</style>
