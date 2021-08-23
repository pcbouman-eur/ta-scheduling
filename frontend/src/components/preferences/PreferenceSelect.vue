<template>
  <v-select
    :items="items"
    :value="preference"
    @change="changePreference"
    :background-color="backgroundColor"
    label="Select your Preference"
  />
</template>

<script lang="ts">
  import {Prop, Component, Vue} from 'vue-property-decorator'
  import {Preference, PreferenceColors} from '@/data';

  @Component
  export default class PreferenceSelect extends Vue {
    preference: Preference = Preference.NEUTRAL
    @Prop({default: true}) allowUnavailable!: boolean
    changePreference(newVal: Preference): void {
      this.preference = newVal
      this.$emit('change', this.preference);
    }
    get excludes(): string[] {
      if (this.allowUnavailable) {
        return [];
      }
      return [Preference.UNAVAILABLE];
    }
    get items(): string[] {
      return Object.keys(Preference).filter(k => !this.excludes.includes(k));
    }
    get backgroundColor(): string {
      return PreferenceColors[this.preference];
    }
  }
</script>
