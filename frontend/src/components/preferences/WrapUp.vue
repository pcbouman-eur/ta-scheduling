<template>
  <v-container>
    <v-row>
      <v-col>
        <h3>Wrap-Up</h3>

        <h5>Comments to Scheduler</h5>
        <p>If you have any comments to scheduler, you can type them in this textbox.</p>
        <v-textarea rows="5" outlined @change="setComment" style="max-width: 40em;" />
        <h5>Submit your Preferences</h5>
        <p>Now that you passed through all steps, you can finalize your choices.
           Use the following button to obtain a file with all your preferences.
        </p>
        <v-btn class="spaced" color="primary" @click="download">Download Preferences</v-btn>
        
        <p>
          Please make sure to send your preferences to the course coordinator!
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';
  import {State,Mutation} from 'vuex-class';
  import {SchedulingInstance,UserPreferences} from '@/data';
  import {downloadPreferencesJson} from '@/utils'

  @Component
  export default class Capabilities extends Vue {
    @State('instance') instance!: SchedulingInstance
    @State('preferences') preferences!: UserPreferences
    @Mutation('setSchedulingComment') setComment!: (comment: unknown) => void
    download(): void {
      downloadPreferencesJson(this.preferences, this.instance);
    }
  }
</script>

<style scoped>
.spaced {
  margin: 1.5em;
}
</style>
