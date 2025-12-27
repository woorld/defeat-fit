<script setup lang="ts">
import { computed, ref } from 'vue';
import type { License } from '../../common/types';
import AppLogo from '../components/logo/AppLogo.vue';
import WooooorldLogo from '../components/logo/WooooorldLogo.vue';
import LinkWithIcon from '../components/LinkWithIcon.vue';
import ViewHeading from '../components/ViewHeading.vue';
import { useTheme } from 'vuetify';

const theme = useTheme();
const appVersion = __APP_VERSION__; // NOTE: テンプレートでそのまま使うことができない

const licenses = ref<License[]>([]);

const iconColor = computed(() => theme.current.value.dark
  ? 'white'
  : 'black'
);

const openLicenseFolder = () => {
  window.file.openLicenseFolder();
};

(async () => {
  licenses.value = await window.file.getLicenses();
})();
</script>

<template>
  <VContainer>
    <ViewHeading title="About" />
    <div class="mt-12 mb-16 d-flex justify-center align-center ga-16">
      <div class="text-center">
        <div class="d-flex justify-end align-center ga-4">
          <AppLogo class="logo" />
          <div class="text-center">
            <p class="text-h4 font-weight-bold">DefeatFit</p>
            <p class="text-subtitle-1 text-grey">v{{ appVersion }}</p>
          </div>
        </div>
        <LinkWithIcon
          class="mt-5"
          linkType="githubRepository"
          linkText="GitHub Repository"
          iconName="mdi-github"
          :iconColor
        />
      </div>
      <div class="text-center">
        <div class="d-flex justify-start align-center ga-4">
          <div class="text-center">
            <p class="text-subtitle-1 text-grey">Developed by</p>
            <p class="text-h4 font-weight-bold">わーるど</p>
          </div>
          <WooooorldLogo class="logo" :color="iconColor" />
        </div>
        <LinkWithIcon
          class="mt-5"
          linkType="developerTwitter"
          linkText="Developer's Twitter"
          iconName="mdi-twitter"
          :iconColor
        />
      </div>
    </div>
    <template v-if="licenses.length >= 1">
      <h3 class="text-h5 text-center">OSS Licenses</h3>
      <VExpansionPanels class="mt-4">
        <VExpansionPanel v-for="license of licenses">
          <template #title>
            {{ license.name }}
            <span class="text-grey ml-2">{{ license.version }}</span>
          </template>
          <template #text>
            <pre class="text-pre-wrap">{{ license.licenseText }}</pre>
          </template>
        </VExpansionPanel>
      </VExpansionPanels>
    </template>
    <div v-else class="text-center">
      <p>OSSライセンスの読み込みに失敗しました。</p>
      <VBtn
        class="mt-4"
        color="transparent"
        border
        rounded
        elevation="0"
        @click="openLicenseFolder"
      >OSSライセンスフォルダを開く</VBtn>
    </div>
  </VContainer>
</template>

<style scoped>
.logo {
  width: 100px;
  height: 100px;
}
</style>
