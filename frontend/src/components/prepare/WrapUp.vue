<template>
  <v-container>
    <v-row>
      <v-col>
        <h3>Wrap-Up</h3>
        <v-btn class="spaced" color="primary" @click="download">Download Scheduling Instance as JSON</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';
  import {State} from 'vuex-class';
  import {SchedulingInstance} from '@/data';
  import {downloadInstanceJson} from '@/utils'

  @Component
  export default class WrapUp extends Vue {
    @State('instance') instance!: SchedulingInstance
    download(): void {
      downloadInstanceJson(this.instance);
    }
  }
</script>

<style scoped>
.spaced {
  margin: 1.5em;
}
</style>
