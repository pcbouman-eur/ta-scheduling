<template>
  <v-container>
    <v-row>
      <v-col>
        <h3>Welcome</h3>
        <p>In this part of the application, you can schedule TA's.</p>
        <v-divider />
        <h5>Import scheduling state from a .json file</h5>
        <FileDropZone accept=".state.json" @change="change"/>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
  import FileDropZone from '@/components/util/FileDropZone.vue';
  import {Component, Vue, Emit} from 'vue-property-decorator';
  import {Mutation} from 'vuex-class';
  import {SchedulingState} from '@/data';

  @Component({
    components: {
      FileDropZone
    }
  })
  export default class Welcome extends Vue {
    @Mutation('importState') importState!: (state: SchedulingState) => void
    @Emit('stateload') stateLoaded(): void {
      return;
    }
    change(files: FileList|null):void {
      if (files) {
        const file = files[0];
        const reader = new FileReader();
        reader.addEventListener('load', this.processFile);
        reader.readAsText(file);
        }
    }
    processFile(ev: ProgressEvent<FileReader>): void {
      const data = ev?.target?.result as string;
      if (data) {
          try {
              const state = JSON.parse(data);
              this.importState(state);
              this.stateLoaded();
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
</style>
