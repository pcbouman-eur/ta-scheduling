<template>
  <v-container>
    <v-row>
      <v-col>
        <h3>Collecting Scheduling Preferences</h3>
        <p>With this application you can provide your scheduling preferences
           for your work as a TA in the following courses:
        </p>
        <ul>
          <li v-for="course in instance.courseNames" :key="course">
            {{course}}
          </li>
        </ul>
        <br />
        <p>
          You will have to e-mail a file containing your preferences by e-mail.
          You can obtain this file during the final step.
        </p>
        <p>
          Please go through all the steps and review your preferences carefully.
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';
  import {State} from 'vuex-class';
  import {SchedulingInstance} from '@/data';

  @Component
  export default class Capabilities extends Vue {
    @State('instance') instance!: SchedulingInstance
  }
</script>

<style scoped>
.spaced {
  margin: 0.8em;
}
</style>
