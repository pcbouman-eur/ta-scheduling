<template>
  <v-container>
    <v-row>
      <v-col>
        <h3>Welcome</h3>
        <p>In this part of the application you can convert scheduling data from 
           a spreadsheet into an instance to use in this scheduling application.</p>
        <h3>Load Timetable Spreadsheet</h3>
        <FileDropZone accept=".xlsx" :allowMultiple="false" @change="change"/>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';
  import FileDropZone from '@/components/util/FileDropZone.vue'
  import {Mutation} from 'vuex-class'

  import { read } from "xlsx";
  import { workbookToInstance } from '@/handle-sheet';

  @Component({
      components: {
          FileDropZone
      }
  })
  export default class PrepareWelcom extends Vue {
      
      change(files: FileList|null):void {
          if (files) {
              for (const file of files) {
                  const reader = new FileReader();
                  reader.addEventListener('load', this.processFile);
                  reader.readAsArrayBuffer(file);
                  reader.readAsText(file);
              }
          }
      }

      @Mutation('setInstance') setInstance!: (payload: unknown) => void

      processFile(ev: ProgressEvent<FileReader>): void {
          const buffer = ev?.target?.result as ArrayBuffer;
          if (buffer) {
              try {
                  const data = new Uint8Array(buffer);
                  console.log(data);
                  const workbook = read(data, {type: 'array', cellDates: true});
                  const instance = workbookToInstance(workbook);
                  console.log(instance);
                  this.setInstance(instance);
              }
              catch (err) {
                  console.log(err);
              }
          }
      }
  }
</script>

<style scoped>
.spaced {
  margin: 1.5em;
}

.chip-spacing:not(:last-child) {
    margin-right: 0.5em;
}
</style>
