<script setup lang="ts">
import type { MenuUnit } from '@prisma-generated-client';
import { menuUnitMap } from '@common/util';

const props = defineProps<{
  count: number,
  manualCount: number,
  unit: MenuUnit,
  isCountCapped?: boolean,
}>();
</script>

<template>
  <span class="text-no-wrap">
    <span v-if="props.manualCount <= 0" :class="{ 'text-warning': props.isCountCapped }">{{ props.count }}</span>
    <span v-else-if="props.count <= 0" class="text-green">{{ props.manualCount }}</span>
    <template v-else>
      <span :class="{ 'text-warning': props.isCountCapped }">{{ props.count }}</span>
      + <span class="text-green">{{ props.manualCount }}</span>
      = {{ props.count + props.manualCount }}
    </template>
    {{ menuUnitMap[props.unit] }}
  </span>
</template>
