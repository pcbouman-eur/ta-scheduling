<template>
  <v-app>
    <!--
    <v-app-bar
      app
      color="primary"
      dark
    >
      <div class="d-flex align-center">
        <v-img
          alt="Vuetify Logo"
          class="shrink mr-2"
          contain
          src="https://cdn.vuetifyjs.com/images/logos/vuetify-logo-dark.png"
          transition="scale-transition"
          width="40"
        />

        <v-img
          alt="Vuetify Name"
          class="shrink mt-1 hidden-sm-and-down"
          contain
          min-width="100"
          src="https://cdn.vuetifyjs.com/images/logos/vuetify-name-dark.png"
          width="100"
        />
      </div>

      <v-spacer></v-spacer>

      <v-btn
        href="https://github.com/vuetifyjs/vuetify/releases/latest"
        target="_blank"
        text
      >
        <span class="mr-2">Latest Release</span>
        <v-icon>mdi-open-in-new</v-icon>
      </v-btn>
    </v-app-bar>
    -->
    <v-main>
      <v-container fluid class="text-left">
        <v-row>
          <v-col>
            <v-stepper v-model="step" non-linear vertical>
                <v-stepper-step editable step="1">Introduction</v-stepper-step>
                <v-stepper-content step="1">
                  <welcome @stateload="step = 5" />
                  <br />
                  <v-btn color="primary" @click="next">Next</v-btn> &nbsp;
                </v-stepper-content>
                <v-stepper-step editable step="2">Load preferences</v-stepper-step>
                <v-stepper-content step="2">
                  <loadtapreferences />
                  <v-btn color="primary" @click="next">Next</v-btn> &nbsp;
                  <v-btn color="secondary" @click="prev">Back</v-btn>
                </v-stepper-content>                  
                <v-stepper-step editable step="3">TA Employment Properties</v-stepper-step>
                <v-stepper-content step="3">
                  <employment />
                  <br />
                  <v-btn color="primary" @click="next">Next</v-btn> &nbsp;
                  <v-btn color="secondary" @click="prev">Back</v-btn>
                </v-stepper-content>                
                <template>     
                  <v-stepper-step editable step="4">Scheduling Configuration</v-stepper-step>
                  <v-stepper-content step="4">
                    <scheduling-configuration-page />
                    <br />
                    <v-btn color="primary" @click="next">Next</v-btn> &nbsp;
                    <v-btn color="secondary" @click="prev">Back</v-btn>
                  </v-stepper-content>
                </template>
                <template>     
                  <v-stepper-step editable step="5">Create Schedule</v-stepper-step>
                  <v-stepper-content step="5">
                    <scheduling-table />
                    <v-btn color="primary" @click="next">Next</v-btn> &nbsp;
                    <v-btn color="secondary" @click="prev">Back</v-btn>
                  </v-stepper-content>
                </template>
                <template>     
                  <v-stepper-step editable step="6">Export Schedule</v-stepper-step>
                  <v-stepper-content step="6">
                    <wrap-up />
                    <br />
                    <v-btn color="secondary" @click="prev">Back</v-btn>
                  </v-stepper-content>
                </template>
            </v-stepper>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts">

import {SchedulingInstance} from '@/data'

import {Component, Vue} from 'vue-property-decorator'
import {State} from 'vuex-class'

import Welcome from '@/components/scheduling/Welcome.vue';
import LoadTAPreferences from '@/components/scheduling/LoadTAPreferences.vue';
import TAEmployment from '@/components/scheduling/TAEmployment.vue';
import SchedulingTable from '@/components/scheduling/SchedulingTable.vue';
import SchedulingConfigurationPage from '@/components/scheduling/SchedulingConfiguration.vue'
import WrapUp from '@/components/scheduling/WrapUp.vue';

@Component({
  components: ({
    Welcome,
    loadtapreferences: LoadTAPreferences,
    SchedulingTable,
    employment: TAEmployment,
    SchedulingConfigurationPage,
    WrapUp
  })
})
export default class Scheduling extends Vue {
  step = 1;
  @State('instance') instance!: SchedulingInstance;
  next(): void {
    this.step++;
  }
  prev(): void {
    this.step--;
  }
}

</script>
