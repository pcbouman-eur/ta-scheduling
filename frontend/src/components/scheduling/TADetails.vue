<template>
  <v-dialog v-model="visible" width="500">
    <v-card>
      <v-card-title>
        Details for {{availability.preferences.userId}}
      </v-card-title>
      <v-card-text>
        <h4>Capabilities</h4>
        <div>
          <template v-for="[cap,present],idx of Object.entries(availability.preferences.capabilities)" >
            <v-chip :key="'cap'+idx" v-if="present">{{cap}}</v-chip>
          </template>
        </div>
        <h5>Group Type Preferences</h5>
        <div>
          <v-chip v-for="[key,pref] of Object.entries(availability.preferences.groupTypePreferences)"
                  :key="'grouptype-'+key" :color="colors[pref]">{{key}}</v-chip>
        </div>
        <h5>Consecutive Sessions Preferences</h5>
        <div>
          <v-chip v-for="[key,pref] of Object.entries(availability.preferences.consecutivePreferences)"
                  :key="'consecutive-'+key" :color="colors[pref]">{{key}} consecutive sessions</v-chip>
        </div>
        <h5>Different Days Preferences</h5>
        <div>
          <v-chip v-for="[key,pref] of Object.entries(availability.preferences.differentDaysPreferences)"
                  :key="'different-days-'+key" :color="colors[pref]">{{key}} different days</v-chip>
        </div>
        <h4>Scheduling Comment</h4>
        <blockquote v-if="availability.preferences.schedulingComment">
          {{availability.preferences.schedulingComment}}
        </blockquote>
        <p v-else style="font-style: italic">
          No scheduling comment
        </p>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" @click="() => setVisible(false)">OK</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
  import {Component, Vue, Prop} from 'vue-property-decorator';
  import {UserAvailability, PreferenceColors} from '@/data';

  @Component
  export default class TADetails extends Vue {
    @Prop() availability!: UserAvailability;
    visible = false;
    colors = PreferenceColors;
    setVisible(val: boolean): void {
      this.visible = val;
    }
  }
</script>

<style scoped>
.spaced {
  margin: 1.5em;
}
</style>
