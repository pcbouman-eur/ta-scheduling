<template>
  <key-preferences
    :keys="consecutive"
    :keyTransform="transform"
    instruction="Please indicate your preferences to teach classes spread out over one or multiple days"
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
  export default class DifferentDaysPreferences extends Vue {
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
      return 'Your preference of teaching '+num+' different weekdays';
    }
    @Mutation('setDifferentDaysPref') change!: (payload: unknown) => void
  }
</script>
