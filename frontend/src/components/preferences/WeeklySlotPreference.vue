<template>
  <v-card
    elevation="2"
    tile
  >
    <v-card-title>{{title}}</v-card-title>
    <v-card-text align="left">
      <preference-select @change="setPref"/>
      <h5>Sessions currently scheduled</h5>
      <v-chip v-for="(bundle,idx) of bundles" :key="'bdl-'+idx" class="spaced">
          {{bundle.name}}
          ({{weekNumbers[idx]}})
      </v-chip>
      <!--
      <ul style="width: 100%">
        <li v-for="(bundle,idx) of bundles" :key="'bdl-'+idx">
          {{bundle.name}}
          ({{weekNumbers[idx]}})
        </li>
      </ul>
      -->
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
  import {Prop, Component, Vue} from 'vue-property-decorator'
  import {Getter, Mutation} from 'vuex-class'
  import {weeklySlotToString, weekNumberString} from '@/utils'
  import {WeeklySlot, Preference, Bundle} from '@/data'
  import PreferenceSelect from './PreferenceSelect.vue';

  @Component({
    components: {
      PreferenceSelect
    }
  })
  export default class WeeklySlotPreference extends Vue {
    @Prop() readonly weeklySlot!: WeeklySlot
    @Getter('bundlesPerSlot') readonly bundlesPerSlot!: Map<string,Bundle[]>
    
    get bundles():Bundle[] {
      const key = weeklySlotToString(this.weeklySlot);
      if (this.bundlesPerSlot.has(key)) {
        const result =  this.bundlesPerSlot.get(key);
        if (result) {
          return result;
        }
      }
      return [];
    }
    get weekNumbers():string[] {
      return this.bundles.map(bundle => weekNumberString(bundle.sessions));
    }
    get title():string {
      if (!this.weeklySlot) {
        return '';
      }
      const ws = this.weeklySlot;
      return weeklySlotToString(ws);
    }
    @Mutation('setSlotPref') setSlotPref!: (payload: unknown) => void
    setPref(preference: Preference): void {
      this.setSlotPref({weeklySlot: this.weeklySlot, preference});
    }
  }
</script>

<style scoped>
.spaced {
  margin: 0.4em;
}
</style>