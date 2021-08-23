<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h3>{{instruction}}</h3>
      </v-col>
    </v-row>
    <v-row >
      <v-col cols="12" md="6" xl="4" v-for="(key, idx) of keys" :key="'col-'+idx">
        <v-card elevation="2" tile>
          <v-card-text>{{transformed[idx]}}</v-card-text>
          <v-card-actions>
            <preference-select @change="pref => change(key, pref)" :allowUnavailable="allowUnavailable"/>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
  import {Component, Vue, Prop, Emit} from 'vue-property-decorator'
  import PreferenceSelect from './PreferenceSelect.vue';
  import { Preference } from '@/data';

  @Component({
    components: {
        PreferenceSelect
    }
  })
  export default class KeyPreferences extends Vue {
    @Prop() readonly instruction!: string
    @Prop() readonly keys!: string[]|number[]
    @Prop() readonly keyTransform?: (key: string|number) => string
    @Prop() readonly allowUnavailable!: boolean
    @Emit('change') change(key: string|number, preference: Preference): {key: string|number, preference: Preference} {
      return {key, preference};
    }
    get transformed(): string[] {
      const result = [];
      for (const k of this.keys) {
        if (this.keyTransform) {
          result.push(this.keyTransform(k).toString())
        }
        else {
          result.push(k.toString());
        }
      }
      return result;
    }
  }
</script>
