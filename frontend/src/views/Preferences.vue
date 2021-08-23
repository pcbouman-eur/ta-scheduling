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
      <v-container class="text-left">
        <v-row>
          <v-col>
            <v-stepper v-model="step" non-linear vertical>
                <v-stepper-step editable step="1">Introduction</v-stepper-step>
                <v-stepper-content step="1">
                  <welcome />
                  <v-btn color="primary" @click="next">Next</v-btn> &nbsp;
                </v-stepper-content>           
                <v-stepper-step editable step="2">Name and Capabilities</v-stepper-step>
                <v-stepper-content step="2">
                  <capabilities />
                  <v-btn color="primary" @click="next">Next</v-btn> &nbsp;
                  <v-btn color="secondary" @click="prev">Back</v-btn>
                </v-stepper-content>                
                <template v-if="isActive(3)">     
                  <v-stepper-step :editable="isActive(3)" step="3">Timeslots</v-stepper-step>
                  <v-stepper-content step="3">
                    <slot-preferences />
                    <v-btn color="primary" @click="next">Next</v-btn> &nbsp;
                    <v-btn color="secondary" @click="prev">Back</v-btn>
                  </v-stepper-content>
                </template>
                <template v-if="isActive(4)">     
                  <v-stepper-step :editable="isActive(4)" step="4">Groups</v-stepper-step>
                  <v-stepper-content step="4">
                    <group-preferences />
                    <v-btn color="primary" @click="next">Next</v-btn> &nbsp;
                    <v-btn color="secondary" @click="prev">Back</v-btn>
                  </v-stepper-content>
                </template>
                <template v-if="isActive(5)">     
                  <v-stepper-step :editable="isActive(5)" step="5">Consecutive Classes</v-stepper-step>
                  <v-stepper-content step="5">
                    <consecutive-preferences />
                    <v-btn color="primary" @click="next">Next</v-btn> &nbsp;
                    <v-btn color="secondary" @click="prev">Back</v-btn>
                  </v-stepper-content>
                </template>
                <template v-if="isActive(6)">     
                  <v-stepper-step :editable="isActive(6)" step="6">Different Days</v-stepper-step>
                  <v-stepper-content step="6">
                    <different-days-preferences />
                    <v-btn color="primary" @click="next">Next</v-btn> &nbsp;
                    <v-btn color="secondary" @click="prev">Back</v-btn>
                  </v-stepper-content>
                </template>
                <v-stepper-step editable step="7">Wrap Up</v-stepper-step>
                <v-stepper-content step="7">
                  <wrap-up />
                  <v-btn color="secondary" @click="prev">Back</v-btn>
                </v-stepper-content>                
            </v-stepper>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts">

import Welcome from '@/components/preferences/Welcome.vue'
import Capabilities from '@/components/preferences/Capabilities.vue';
import SlotPreferences from '@/components/preferences/SlotPreferences.vue';
import GroupPreferences from '@/components/preferences/GroupPreferences.vue';
import ConsecutivePreferences from '@/components/preferences/ConsecutivePreferences.vue';
import DifferentDaysPreferences from '@/components/preferences/DifferentDaysPreference.vue';
import WrapUp from '@/components/preferences/WrapUp.vue';

import {SchedulingInstance} from '@/data'

import {Component, Vue} from 'vue-property-decorator'
import {State} from 'vuex-class'

@Component({
  components: {
    Welcome,
    Capabilities,
    SlotPreferences,
    GroupPreferences,
    ConsecutivePreferences,
    DifferentDaysPreferences,
    WrapUp
  }
})
export default class App extends Vue {
  step = 1;
  @State('instance') instance!: SchedulingInstance;
  isActive(step: number): boolean {
    if (this.instance) {
      if (this.instance.askSlots.length == 0 && step == 3) {
        return false;
      }
      if (!this.instance.askGroupTypes && step == 4) {
        return false;
      }
      if (!this.instance.askConsecutiveSessions && step == 5) {
        return false;
      }
      if (!this.instance.askDifferentDays && step == 6) {
        return false;
      }
    }
    return true;
  }
  next(): void {
    this.step++;
    while (!this.isActive(this.step)) {
      this.step++;
    }
  }
  prev(): void {
    this.step--;
    while (!this.isActive(this.step)) {
      this.step--;
    }
  }
}

</script>
