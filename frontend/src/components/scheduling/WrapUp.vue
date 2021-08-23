<template>
  <v-container>
    <v-row>
      <v-col>
        <h3>Wrap-Up</h3>
        <v-btn class="spaced" color="primary" @click="download">Download State as JSON</v-btn>
        <br />
        <v-btn class="spaced" color="primary" @click="downloadXLSX">Download Spreadsheet</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';
  import {Getter} from 'vuex-class';
  import {SchedulingState} from '@/data';
  import {downloadSchedulingJson} from '@/utils'
  import {downloadSpreadsheet} from '@/export-sheet';

  @Component
  export default class WrapUp extends Vue {
    @Getter('fullState') fullState!: SchedulingState
    download(): void {
      downloadSchedulingJson(this.fullState);
    }
    downloadXLSX(): void {
      downloadSpreadsheet(this.fullState);
    }
  }
</script>

<style scoped>
.spaced {
  margin: 1.5em;
}
</style>
