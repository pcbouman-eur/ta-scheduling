<template>
  <v-container>
    <v-row>
      <v-col>
        <h3>Wrap-Up</h3>
        <v-btn class="spaced" color="primary" @click="download">Download Scheduling Instance as JSON</v-btn>
        <br />
        <v-btn class="spaced" color="primary" @click="copyText">Copy invitation text to invite TA's to fill in a scheduling survey</v-btn>
        <br />
        <v-btn class="spaced" color="primary" @click="copyLink">Copy link to Preference Survey</v-btn>
      </v-col>
    </v-row>
    <v-snackbar centered v-model="snackbar" :timeout="3000">
      {{ snackbarText }}
      <template v-slot:action="{ attrs }">
        <v-btn
          color="primary"
          text
          v-bind="attrs"
          @click="snackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';
  import {State} from 'vuex-class';
  import {SchedulingInstance} from '@/data';
  import {downloadInstanceJson} from '@/utils';

  import { Base64 } from 'js-base64';
  import copyToClipboard from 'copy-to-clipboard';

  @Component
  export default class WrapUp extends Vue {
    snackbar = false
    snackbarText = ''

    @State('instance') instance!: SchedulingInstance
    get instanceHash(): string {
      const jsonString = JSON.stringify(this.instance);
      return Base64.encode(jsonString);
    }
    get instanceLink(): string {
      const origin = window.location.origin;
      return origin + '#' + this.instanceHash;
    }
    download(): void {
      downloadInstanceJson(this.instance);
    }
    copyLink(): void {
      copyToClipboard(this.instanceLink); 
      this.snackbar = true;
      this.snackbarText = 'Link copied to the clipboard. You can share this link with your teaching assistants.';
    }
    copyText(): void {
      const text = `<p>Dear teaching assistant,</p>
      <p>we are currently collecting your scheduling preferences for the course(s) ${this.instance.courseNames.join(', ')}.
      Please follow <a href="${this.instanceLink}" target="_blank">this link</a> and provide your preferences.</p>
      <p>Once your have finished filling in your preferences in this tool, you will receive a JSON file containing your preferences.
        Please respond to this email with this JSON file as an attachment.</p>
        <p>Kind regards,</p>
        <p>The teacher</p>`; 
      copyToClipboard(text, { format: 'text/html'});
      this.snackbar = true;
      this.snackbarText = 'Text copied to the clipboard. You can paste this text into an e-mail to your teaching assistants.';
    }
  }
</script>

<style scoped>
.spaced {
  margin: 1.5em;
}
</style>
