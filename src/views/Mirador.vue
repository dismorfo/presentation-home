<template>
  <div>
    <div id="my-mirador"></div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import mirador from 'mirador';

// Define the props by using Vue's canonical way.
const MiradorProps = Vue.extend({
  props: {
    identifier: {
      type: String,
      required: true,
    },
    resource: {
      type: String,
      required: true,
    },
  },
});

@Component
export default class Mirador extends MiradorProps {
  api: string = `${process.env.VUE_APP_VIEWER}/api`;

  mirador: any = '';

  private mounted(): void {
    this.mirador = mirador.viewer({
      id: 'my-mirador',
      windows: [
        {
          loadedManifest: `${this.api}/presentation/${this.resource}/${this.identifier}/manifest.json`,
        },
      ],
    });
  }
}
</script>
