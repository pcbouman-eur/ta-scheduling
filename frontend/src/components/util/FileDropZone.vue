<template>
   <div>
    <v-sheet
      tabindex="0"                     
      title="Click to grap a file from your PC!"
      color="secondary lighten-4"
      width="100%"
      class="pa-2 sheet"
      @dragenter="dragStart"
      @dragover="dragStart"
      @dragleave="dragEnd"
      @drop="drop"
      @click="$refs.inputEl.click()"
    >
    <input type="file" :accept="accept" class="hidden" ref="inputEl"
        @change="changeFile" />
    <v-container>
    <v-row justify="center" v-if="!currentFiles">
         <v-icon
          v-if="error"
          color="black"
          size="75"
        >mdi-alert-box-outline</v-icon>
        <v-icon
          v-else-if="dragover && !error" 
          color="black" 
          size="75"
        >mdi-plus-box-outline</v-icon>
       <v-icon
          v-else 
          color="black" 
          size="75"
        >mdi-cloud-upload-outline</v-icon>
      </v-row>
      <v-row justify="center" v-if="!currentFiles">
        <span class="title">Drag'n drop or click to upload file{{this.allowMultiple ? '(s)' : ''}}!</span>
      </v-row>
      <v-row justify="center" v-if="currentFiles">
          <div class="selection-box">
              <h3>Selected files:</h3>
              <v-chip class="spacing" small v-for="currentFile,idx in currentFiles" :key="'file-'+idx">{{currentFile.name}}</v-chip>
          </div>
      </v-row>
      <v-row justify="center" v-if="(currentFiles || error) && !dragover">
          <v-btn color="primary" v-if="!error" @click.stop="submit">Submit</v-btn>
          <span v-if="!error" style="width: 3em;"></span>
          <v-btn color="secondary" @click.stop="clear">Clear</v-btn>
      </v-row>
    </v-container>
    </v-sheet>
    <v-alert type="error" v-if="error">
        {{ error }}
    </v-alert>
   </div>
</template>
<script lang="ts">

// // TODO: make this more configurable??
// window.addEventListener("dragover",function(e){
//   e = e || event;
//   e.preventDefault();
// },false);

// window.addEventListener("drop",function(e){
//   e = e || event;
//   e.preventDefault();
// },false);

import {Prop, Emit, Component, Vue} from 'vue-property-decorator'

@Component
export default class FileDropZone extends Vue {
    dragover = false
    error: string|null = null
    currentFiles: FileList|null = null
    $refs!: {
        inputEl: HTMLInputElement
    }
    
    @Prop({default: ''}) readonly accept!: string
    @Prop({default: null}) readonly acceptError!: string|null
    @Prop({default: false}) readonly autoSubmit!: boolean
    @Prop({default: false}) readonly allowMultiple!: boolean

    constructor() {
        super()
    }

    dragStart(ev: DragEvent): void {
        this.dragging(ev, true);
    }
    dragEnd(ev: DragEvent): void {
        this.dragging(ev, false);
    }
    dragging(ev:DragEvent, val: boolean): void {
        ev.preventDefault();
        this.dragover = val;
        if (ev.dataTransfer && ev.dataTransfer.items) {
            // TODO
            //this.error = this.validate(ev.dataTransfer.items);
        }
        if (!val) {
            this.error = null;
        }
    }
    checkValidFile(item: File): boolean {
        if (!this.accept) {
            return true;
        }
        // check by extension
        for (const opt of this.acceptOptions) {
            if (item.name.endsWith(opt)) {
                return true;
            }
        }
        // check mime type
        if (this.acceptOptions.includes(item.type)) {
            return true;
        }
        return false;
    }
    validate(items: FileList): string|null {
        if (!this.allowMultiple && items.length != 1) {
            return "Only a single file is supported";
        }
        for (const file of items) {
            if (this.accept && !this.checkValidFile(file)) {
                if (this.acceptError) {
                    return this.acceptError;
                }
                else {
                    return "Only files of type '"+this.accept+"' are supported";
                }
            }
        }
        return null;
    }
    drop(ev: DragEvent): void {
        ev.preventDefault();
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
    }
    changeFile(ev: Event): void {
        const target = ev.target as HTMLInputElement;
        const files = target.files as FileList;
        const val = this.validate(files);
        if (val == null) {

            this.currentFiles = files;
            if (this.autoSubmit) {
                this.submit();
            }
        }
        else {
            this.error = val;
        }
    }
    clear(): void {
        this.currentFiles = null;
        this.error = null;
        this.$refs.inputEl.value = '';
    }
    @Emit('change') submit(): FileList|null {
        const result = this.currentFiles;
        this.currentFiles = null;
        return result;
    }
    get acceptOptions(): string[] {
        if (this.accept) {
            return this.accept.split(',').map(t => t.trim());
            }
            return []; 
    }

}
</script>
<style scoped>
.hidden {
    display: none;
}

.sheet {
    min-height: 140px;
}

.selection-box {
    margin: 1em;
}

.spacing:not(:last-child) {
    margin-right: 0.5em;
}
</style>