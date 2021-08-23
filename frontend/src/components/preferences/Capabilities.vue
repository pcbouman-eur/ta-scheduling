<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h3>Please fill in your name</h3>
        <v-text-field class="limit-width" @change="setName" label="Give your name"/>
      </v-col>
    </v-row>
    <template v-if="instance.askCapabilities">
      <v-row>
        <v-col cols="12">
          <h3>Please indicate teaching capabilities</h3>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <v-card elevation="2" tile class="limit-width">
            <v-card-text>
              Please indicate if you have one or more of the following capabilities for teaching classes
              <v-alert type="warning" v-if="selected <= 0" class="limit-width">
              You currently have no capabilities selected.
                This is likely incorrect.
              </v-alert>
              <div class="spaced" v-for="(cap, idx) of instance.capabilities" :key="'row-'+idx">
                <v-checkbox :label="cap" @change="pref => change(cap,pref)" />
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';
  import {Mutation, State} from 'vuex-class';
  import {SchedulingInstance} from '@/data';

  @Component
  export default class Capabilities extends Vue {
    @State('instance') instance!: SchedulingInstance
    @State('preferences') preferences!: SchedulingInstance
    @Mutation('setCapability') setCapability!: (payload: unknown) => void
    @Mutation('setUserId') setName!: (payload: unknown) => void
    change(capability: string, status: boolean): void {
      this.setCapability({capability, status})
    }
    get selected(): number {
      return Object.values(this.preferences.capabilities).filter(k => k).length;
    }
  }
</script>

<style scoped>
.spaced {
  margin: 0.8em;
}

.limit-width {
  max-width: 40em;
}
</style>
