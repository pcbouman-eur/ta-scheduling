<template>
  <key-preferences
    :keys="consecutive"
    :keyTransform="transform"
    instruction="Please indicate your preferences to teach multiple classes directly after each other (back to back)"
    @change="change"
    :allowUnavailable="false"
   />
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator'
  import {State, Mutation} from 'vuex-class'
  import KeyPreferences from './KeyPreferences.vue';
  import { SchedulingInstance } from '@/data';
  @Component({
    components: {
      KeyPreferences
    }
  })
  export default class ConsecutivePreferences extends Vue {
    @State('instance') instance?: SchedulingInstance = undefined
    get consecutive(): number[] {
      const result = [];
      if (this.instance) {
        for (let i=2; i <= this.instance.maxConsecutiveSessions; i++) {
          result.push(i);
        }
      }
      return result;
    }
    transform(num: number): string {
      return 'Your preference of teaching '+num+' classes consecutively';
    }
    @Mutation('setConsecutivePref') change!: (payload: unknown) => void
  }
</script>
