<template>
  <div>
    <div id="my-mirador"></div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import mirador from 'mirador';

// Define the props by using Vue's canonical way.
const ViewerProps = Vue.extend({
  props: {
    resource: {
      type: String,
      required: true,
    },
    identifier: {
      type: String,
      required: true,
    },
    sequence: {
      type: Number,
      default: 1,
    },
  },
});

@Component
export default class Viewer extends ViewerProps {
  api: string = 'https://dev-sites.dlib.nyu.edu/viewer/api';

  // @ts-ignore
  manifest: string = `${this.api}/presentation/${this.resource}/${this.identifier}/manifest.json`;

  mirador: any = '';

  seq_index: number = this.sequence;

  private mounted(): void {
    this.mirador = mirador.viewer({
      id: 'my-mirador',
      workspaceControlPanel: {
        enabled: false,
      },
      workspace: {
        isWorkspaceAddVisible: false,
        allowNewWindows: false,
      },
      language: 'en',
      windows: [
        {
          loadedManifest: this.manifest,
          canvasIndex: this.seq_index - 1,
          view: 'single',
        },
      ],
      window: {
        defaultSideBarPanel: 'info',
        sideBarOpenByDefault: true,
        showLocalePicker: true,
        hideWindowTitle: true,
      },
    });
  }
}
</script>
