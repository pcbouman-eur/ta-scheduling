<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h3>Define Scheduling Priorities</h3>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" lg="6">
        <v-form>
          <h5>Score per preference</h5>
          <v-text-field type="number" :value="config.stronglyFavoredScore" label="Strongly Unfavored" @change="v => updateConfig('stronglyFavoredScore', v)" />
          <v-text-field type="number" :value="config.favoredScore" label="Unfavored" @change="v => updateConfig('favoredScore', v)" />
          <v-text-field type="number" :value="config.neutralScore" label="Neutral" @change="v => updateConfig('neutralScore', v)" />
          <v-text-field type="number" :value="config.unfavoredScore" label="Favored" @change="v => updateConfig('unfavoredScore', v)" />
          <v-text-field type="number" :value="config.stronglyUnfavoredScore" label="Strongly Favored" @change="v => updateConfig('stronglyUnfavoredScore', v)" />
            <v-text-field type="number" :value="config.unavailableScore" label="Unavailable" @change="v => updateConfig('unavailableScore', v)" />
          <v-divider />
          <br />
          <h5>Student Preference Weights</h5>
          <v-text-field type="number" :value="config.slotPreferenceFactor" label="Timeslot Preference Factor" @change="v => updateConfig('slotPreferenceFactor', v)" />
          <v-text-field type="number" :value="config.groupPreferenceFactor" label="Group Preference Factor" @change="v => updateConfig('groupPreferenceFactor', v)" />
          <v-text-field type="number" :value="config.consecutiveSessionFactor" label="Consecutive Sessions Factor" @change="v => updateConfig('consecutiveSessionFactor', v)" />
          <v-text-field type="number" :value="config.multipleDayFactor" label="Multiple Days Factor" @change="v => updateConfig('multipleDayFactor', v)" />
          <v-divider />
          <br />
          <h5>Course Objectives</h5>
          <v-text-field type="number" :value="config.multiTAExponent" label="Multiple TAs per Group Exponent" @change="v => updateConfig('multiTAExponent', v)" />
          <v-text-field type="number" :value="config.multiTAFactor" label="Multiple TAs per Group Factor" @change="v => updateConfig('multiTAFactor', v)" />
          <v-text-field type="number" :value="config.violationScore" label="Violation Score" @change="v => updateConfig('violationScore', v)" />
          <v-text-field type="number" :value="config.uncoveredScore" label="Uncovered Session Score" @change="v => updateConfig('uncoveredScore', v)" />
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
  import { SchedulingConfiguration } from '@/data';
  import {Component, Vue} from 'vue-property-decorator'
  import {State, Mutation} from 'vuex-class';

  @Component({
    components: {

    }
  })
  export default class SchedulingConfigurationPage extends Vue {
    @State('configuration') config!: SchedulingConfiguration;
    @Mutation('setConfiguration') setConfig!: (payload: unknown) => void
    updateConfig(key: string, val: number): void {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newConfig: any = {...this.config};
      newConfig[key] = val;
      this.setConfig(newConfig);
    }
  }
</script>
