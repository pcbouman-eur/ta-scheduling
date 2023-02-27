<template>
  <v-container>
    <v-row>
      <v-col>
        <h3>Load TA preferences</h3>

        <FileDropZone accept=".preferences.json" :allowMultiple="true" @change="change"/>

        <div v-if="taAvailability && taAvailability.length > 0">
            <h3>Preferences for the following TA's are now loaded</h3>
            <v-chip class="chip-spacing" v-for="av,idx of taAvailability" :key="'ta_'+idx">{{av.preferences.userId}}</v-chip>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';
  import FileDropZone from '@/components/util/FileDropZone.vue'
  import {State, Mutation} from 'vuex-class'

  import {UserAvailability} from '@/data';

  @Component({
      components: {
          FileDropZone
      }
  })
  export default class LoadTAPreferences extends Vue {
      @State taAvailability!: UserAvailability[]
      
      change(files: FileList|null):void {
          if (files) {
              for (const file of files) {
                  const reader = new FileReader();
                  reader.addEventListener('load', this.processFile);
                  reader.readAsText(file);
              }
          }
      }

      @Mutation('addTAPreferences') addTAPreferences!: (payload: unknown) => void

      processFile(ev: ProgressEvent<FileReader>): void {
          const data = ev?.target?.result as string;
          if (data) {
              try {
                  const preferences = JSON.parse(data);
                  this.addTAPreferences(preferences);
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
