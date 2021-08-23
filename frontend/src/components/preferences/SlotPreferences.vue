<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h3>Please indicate for the following time slots your availability and preference</h3>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" sm="10" md="6" lg="4" xl="3" v-for="(slot, idx) of instance.askSlots" :key="'col-'+idx">
        <weekly-slot-preference :weeklySlot="slot" style="min-height: 16em"/>
      </v-col>
    </v-row>
    
  </v-container>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator'
  import {State} from 'vuex-class'
  import WeeklySlotPreference from './WeeklySlotPreference.vue';
  import { SchedulingInstance } from '@/data';

  import {retrieveInstance} from '@/handle-sheet';

  @Component({
    components: {
      WeeklySlotPreference
    }
  })
  export default class SlotPreferences extends Vue {
    @State('instance') instance?: SchedulingInstance = undefined
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
