<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        Test! <br /> {{myData}}
        <v-container>
          <v-row>
            <v-col cols="2" v-for="i of slots" :key="i">
              <weekly-slot-preference :weeklySlot="i"/>
            </v-col>
          </v-row>
        </v-container>
      </v-col>
    </v-row>
    <v-btn @click="downloadTestJson" style="display: none;">Do Test</v-btn>
  </v-container>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator'
  import WeeklySlotPreference from './WeeklySlotPreference.vue';
//  import PreferenceSelect from './PreferenceSelect.vue';
  import { Preference } from '../data';

  import {retrieveInstance} from '../handle-sheet';

  @Component({
    components: {
      WeeklySlotPreference
//        PreferenceSelect
    }
  })
  export default class Stuff extends Vue {
    myData = Preference.NEUTRAL;
    slots = [...Array(12).keys()]
    downloadTestJson(): void {
      retrieveInstance().then(
        instance => {
          const filename = 'scheduling-'+instance.courseNames[0].replaceAll(/[^A-Za-z0-9-_]/g,'_')+'.json';
          const element = document.createElement('a');
          const body = JSON.stringify(instance);
          element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(body));
          element.setAttribute('download', filename);
          element.style.display = 'none';
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
        });
    }
  }
</script>
