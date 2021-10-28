<template>
  <div>
  <v-toolbar outlined>
    <v-btn @click="performGreedy()">Greedy</v-btn>
    <v-btn @click="reset()">Reset</v-btn>
    <v-spacer />
    Current objective: {{objective}}    
  </v-toolbar>
  <br />
  <div class="table-container">
    <table class="schedule-table" ref="table" id="schedulingTable">
      <thead>
        <tr>
          <th scope="col">Timeslot</th>
          <th scope="col" v-for="av,idx in taAvailability" :key="'table-head-'+idx" @click="showDetails(idx)">
            {{names[idx]}}
          </th>
          <th scope="col">Unassigned</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="slot,idx of slotRows" :key="'slot-row-'+idx">
          <th scope="row">{{slot}}</th>
          <td v-for="av,idx2 in taAvailability" :key="'table-cell-'+idx+'-'+idx2"
            :style="{backgroundColor: colors[av.preferences.slotPreferences[slot]]}"
                  @dragstart="dragStart"
                  @dragenter="dragEnter"
                  @dragover="dragging"
                  @dragleave="dragEnd"
                  @drop="drop"
                  :data-idxta="idx2"
          >
            <v-chip x-small draggable v-for="bundle,idx3 in matrix[idx][idx2]" :key="'table-cell-bundle'+idx+'-'+idx2+'-'+idx3"
              :color="bundleViolations[bundle.index].length == 0 ? 'primary' : 'secondary'" :data-idxbundle="bundle.index"
              @dblclick="clearBundle(bundle.index)">
              {{bundle.name}}
            </v-chip>
          </td>
          <td style="background-color: #dfdfdf"
                  @dragstart="dragStart"
                  @dragenter="dragEnter"
                  @dragover="dragging"
                  @dragleave="dragEnd"
                  @drop="drop"
                  :data-idxta="-1"
          >
            <v-chip draggable x-small v-for="bundle,idx3 in matrix[idx][matrix[idx].length-1]" :key="'table-cell-unassigned-bundle'+idx+'-'+idx3"
              color="primary" :data-idxbundle="bundle.index" @dblclick="clearBundle(bundle.index)">
              {{bundle.name}}
            </v-chip>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th scope="row">Total Workload</th>
          <th scope="col" v-for="av,idx in taAvailability" :key="'table-foot-total-'+idx"
              :class="{violation: workloads[idx] > av.totalWorkload, lowLoad: workloads[idx] <= av.totalWorkload*0.7}">
            {{workloads[idx]}} / {{av.totalWorkload}}
          </th>
          <th></th>
        </tr>
        <tr>
          <th scope="row">Max Weekly Workload</th>
          <th scope="col" v-for="av,idx in taAvailability" :key="'table-foot-total-'+idx"
              :class="{violation: weeklyMaxLoads[idx] > av.maxWeeklyWorkload}">
            {{weeklyMaxLoads[idx]}} / {{av.maxWeeklyWorkload}}
          </th>
          <th></th>
        </tr>      
      </tfoot>
    </table>
  </div>
  <v-alert v-if="violationList.length > 0" type="error">
    <h3>Violations found!</h3>
    <ul>
      <li v-for="v,idx of violationList" :key="'violation-'+idx">{{v}}</li>
    </ul>
  </v-alert>
  <tadetails v-for="av,idx of taAvailability" ref="detailDialogs" :availability="av" :key="'ta-details-'+idx" />
  <v-btn @click="print()">Download SVG</v-btn>
  <v-divider />
  </div>
</template>

<script lang="ts">
  import {Component, Vue, Ref} from 'vue-property-decorator';
  import {State, Getter, Mutation} from 'vuex-class';
  import {SchedulingInstance, PreferenceColors, UserAvailability, IndexedBundle, SchedulingState} from '@/data';
  import {weeklySlotToString, findDataValue, downloadString } from '@/utils';
  import {ScheduleInformation, Violation } from '@/scheduling';
  import TADetails from '@/components/scheduling/TADetails.vue';
  import {greedy} from '@/optimize';
  import { elementToSVG, inlineResources } from 'dom-to-svg';

  @Component({
    components: {
      tadetails: TADetails
    }
  })
  export default class Capabilities extends Vue {
    colors = PreferenceColors
    lastDragBundle: string|undefined = undefined
    @State('instance') instance!: SchedulingInstance
    @State('taAvailability') taAvailability!: UserAvailability[]
    @State('currentAssignment') currentAssignment!: number[]
    @Ref('detailDialogs') detailDialogs!: TADetails[]
    //@Getter('assignmentMatrix') assignmentMatrix!: number[][]
    get slotRows(): string[] {
      return this.instance.askSlots.map(weeklySlotToString);
    }
    @Getter('scheduleInformation') scheduleInformation!: ScheduleInformation
    get matrix(): IndexedBundle[][][] {
      return this.scheduleInformation.matrix;
    }
    get workloads(): number[] {
      return this.scheduleInformation.workloads;
    }
    get weeklyMaxLoads(): number[] {
      return this.scheduleInformation.weeklyWorkloads;
    }
    get bundleViolations(): Violation[][] {
      return this.scheduleInformation.bundleViolations;
    }
    get violationList(): string[] {
      const result: Set<string> = new Set();
      this.bundleViolations.forEach(lst => lst.forEach(v => result.add(v.text)));
      return [...result];
    }
    get objective(): number {
      return this.scheduleInformation.objective;
    }
    get names(): string[] {
      const idToName = new Map();
      const nameToId = new Map();
      for (const av of this.taAvailability) {
        const userId = av.preferences.userId;
        const split = userId.trim().split(' ');
        const first = split[0];
        if (nameToId.has(first)) {
          const fullName = nameToId.get(first);
          idToName.set(fullName, fullName);
          idToName.set(userId, userId);
        }
        else {
          idToName.set(userId, first);
          nameToId.set(first, userId);
        }
      }
      const result = [];
      for (const av of this.taAvailability) {
        result.push(idToName.get(av.preferences.userId));
      }
      return result;
    }
    showDetails(idx: number): void {
      this.detailDialogs[idx].setVisible(true);
    }
    @Ref('table') table!: HTMLTableElement;
    async print(): Promise<void> {
      console.log(this.table);
      const svgDocument = elementToSVG(this.table);
      await inlineResources(svgDocument.documentElement);
      const svgString = new XMLSerializer().serializeToString(svgDocument);
      downloadString(svgString, 'schedule.svg');
      //print('schedulingTable', 'html');
      /*
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [297, 210]
      });
      */

    }
    dragStart(ev: DragEvent): void {
        const element = ev.target as HTMLElement;
        this.lastDragBundle = findDataValue(element, 'idxbundle', 'table');
        /*
        const dataset = element.dataset;
        console.log(element, dataset);
        
        if (dataset && 'idxbundle' in dataset) {
          console.log('setting bundle id to '+dataset['bundleId'])
          this.lastDragBundle = dataset['bundleId'];
        }
        */
    }
    dragEnter(ev: DragEvent): void {
      ev.preventDefault();
      //console.log(ev.target);
    }
    dragging(ev: DragEvent): void {
      ev.preventDefault();
      //console.log(ev);
    }
    dragEnd(ev: DragEvent): void {
        ev.preventDefault();
        //this.lastDragBundle = undefined;
        //this.dragging(ev, false);
    }
    dragging2(ev:DragEvent, start: boolean): void {
        ev.preventDefault();
        const element = ev.target as HTMLElement;
        const dataset = element.dataset;
        if (start) {
          if (dataset && 'bundleId' in dataset) {
            this.lastDragBundle = dataset['bundleId'];
          }
        }
        //console.log(ev, val);
        /*
        this.dragover = val;
        if (ev.dataTransfer && ev.dataTransfer.items) {
            // TODO
            //this.error = this.validate(ev.dataTransfer.items);
        }
        if (!val) {
            this.error = null;
        }
        */
    }
    @Getter("fullState") fullState!: SchedulingState
    performGreedy(): void {
      const newAssignment = greedy(this.fullState);
      if (newAssignment != null) {
        this.setAssignment(newAssignment);
      }
    }
    reset(): void {
      const newAssignment = new Array(this.currentAssignment.length).fill(-1);
      this.setAssignment(newAssignment);
    }
    @Mutation('setAssignment') setAssignment!: (payload: unknown) => void
    @Mutation('assignBundleToTa') assignBundleToTa!: (payload: unknown) => void
    drop(ev: DragEvent): void {
        ev.preventDefault();
        const element = ev.target as HTMLElement;
        const taIndex = findDataValue(element, 'idxta', 'table');
        if (this.lastDragBundle !== undefined && taIndex !== undefined) {
          this.assignBundleToTa({bundleIndex: this.lastDragBundle, taIndex});
        }
        /*
        if (ev.dataTransfer) {
            const items = ev.dataTransfer.files;
            const valResult = this.validate(items);
            if (valResult == null) {
                this.currentFiles = items;
                this.error = null;
                if (this.autoSubmit) {
                    this.submit();
                }
            }
            else {
                this.error = valResult;
            }
        }
        this.dragover = false;
        */
    }
    clearBundle(idx: number): void {
      this.assignBundleToTa({bundleIndex: idx, taIndex: -1});
    }        
  }
</script>

<style scoped>
.spaced {
  margin: 0.8em;
}

.schedule-table {
  font-size: 85%;
}

table.schedule-table th {
  font-size: smaller;
}

.table-container {
  max-width: 98%;
  max-height: 98%;
  overflow: auto;
}

.violation {
  color: red;
  font-style: italic;
}

.lowLoad {
  color: rgb(0, 17, 255);
  font-style: italic;
}
</style>
