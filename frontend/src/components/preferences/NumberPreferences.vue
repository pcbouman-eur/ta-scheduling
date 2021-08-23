<template>
  <key-preferences
    :keys="instance.groupTypes"
    :keyTransform="transform"
    instruction="Please indicate your preferences related to group types"
    @change="change"
    :allowUnavailable="false"
   />
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator'
  import {State} from 'vuex-class'
  import KeyPreferences from './KeyPreferences.vue';
  import { SchedulingInstance } from '@/data';
  @Component({
    components: {
      KeyPreferences
    }
  })
  export default class SlotPreferences extends Vue {
    @State('instance') instance?: SchedulingInstance = undefined

    transform(grp: string): string {
      return 'Your preference with regarding to teaching groups of type '+grp;
    }
    change(payload: unknown): void {
      console.log(payload)
    }
  }
</script>
