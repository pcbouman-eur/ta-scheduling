<template>
  <v-card
    elevation="2"
    tile
  >
    <v-card-title>{{weeklySlot}}</v-card-title>
    <v-card-text>
      <preference-select />
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
  import {Prop, ModelSync, Component, Vue} from 'vue-property-decorator'
  import {Preference, WeeklySlot} from '../data';
  import PreferenceSelect from './PreferenceSelect.vue';

  @Component({
    components: {
      PreferenceSelect
    }
  })
  export default class WeeklySlotPreference extends Vue {
    items = Object.keys(Preference)
    @ModelSync('value', 'input', {default: Preference.NEUTRAL}) currentValue! : Preference
    @Prop() readonly weeklySlot: WeeklySlot | undefined
  }
</script>
