<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h3>Define TA workloads</h3>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" md="4" xl="3" v-for="(av, idx) of taAvailability" :key="'av-col-'+idx">
        <v-card elevation="2" tile>
          <v-card-text>Workloads for {{av.preferences.userId}}</v-card-text>
          <v-card-actions>
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-text-field type="number" label="Total Workload" :value="av.totalWorkload" @change="ev => changeTotal(idx, ev)" />
                </v-col>
                <v-col cols="12">
                  <v-text-field type="number" label="Max Weekly Workload" :value="av.maxWeeklyWorkload" @change="ev => changeWeekly(idx, ev)" />
                </v-col>
              </v-row>
            </v-container>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
  import { UserAvailability } from '@/data';
import {Component, Vue} from 'vue-property-decorator'
  import {State, Mutation} from 'vuex-class';

  @Component({
    components: {

    }
  })
  export default class TAEmployment extends Vue {
    @State('taAvailability') taAvailability!: UserAvailability;
    @Mutation('setTotalWorkload') setTotal!: (payload: unknown) => void
    @Mutation('setMaxWeeklyWorkload') setWeekly!: (payload: unknown) => void
    changeTotal(index: number, ev: Event): void {
      console.log(index, ev);
      this.setTotal({index, value: ev});
    }
    changeWeekly(index: number, ev: Event): void {
      console.log(index, ev);
      this.setWeekly({index, value: ev});
    }

  }
</script>
