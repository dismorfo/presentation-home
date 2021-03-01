<template>
  <div>
    <b-embed
      type="embed"
      :src="`${baseUrl}/${resource}/${identifier}/${sequence}`"
      allowfullscreen
    ></b-embed>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

// Define the props by using Vue's canonical way.
const EmbeddedProps = Vue.extend({
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
export default class Embedded extends EmbeddedProps {
  baseUrl: string = '';
}
</script>
