<template>
  <div class="main container">
    <div class="mt-3 overflow-auto">
      <b-form-group
        label-cols-sm="0"
        label-align-sm="left"
        label-for="filterInput"
        class="mt-3 mb-3"
      >
        <h5 class="mb-3">Search</h5>
        <b-input-group size="sm">
          <b-form-input
            v-model="filter"
            type="search"
            id="filterInput"
            placeholder="Type to search by title, identifier or handle."
          >
          </b-form-input>
          <b-input-group-append>
            <b-button :disabled="!filter" @click="filter = ''">Clear</b-button>
          </b-input-group-append>
        </b-input-group>
      </b-form-group>
      <b-form-group label-cols-sm="0" label-align-sm="left" label-size="sm" class="mb-0">
        <h6 class="mt-3 mb-3">Filter by collection</h6>
        <b-form-select
          v-model="selectedCollection"
          :options="collections"
          @change="onCollectionChange($event)"
        ></b-form-select>
      </b-form-group>
      <div v-if="items.length > 0" class="resultsnum mt-4 mb-4">
        Showing items
        <span class="start" v-html="perPage * currentPage - perPage + 1"></span>
        -
        <span class="docslength" v-html="perPage * currentPage - perPage + items.length"></span> of
        <span class="numfound" v-html="Number(totalRows).toLocaleString()"></span> sesults
      </div>
      <b-table
        striped
        hover
        caption-top
        sort-icon-left
        :busy.sync="isBusy"
        :sort-by.sync="sortBy"
        :items="items"
        :fields="fields"
        :sort-direction="sortDirection"
      >
        <template #head(title)="data">
          <span class="text-info">{{ data.label.toUpperCase() }}</span>
        </template>
        <template v-slot:table-busy>
          <div class="text-center my-2">
            <b-spinner class="align-middle"></b-spinner>
            <strong>{{ loadingMessage }}</strong>
          </div>
        </template>
        <template v-slot:cell(title)="data">
          <div class="d-inline-block text-truncate" style="max-width: 250px;">
            <a v-b-tooltip.hover :title="data.item.title" :href="data.item.presentation">
              {{ data.item.title }}
            </a>
          </div>
        </template>
        <template v-slot:cell(collections)="data">
          <a
            v-b-tooltip.hover
            :title="collection.name"
            v-for="collection in data.item.collections"
            :key="collection.code"
          >
            {{ collection.code }}
          </a>
        </template>
        <template v-slot:cell(partners)="data">
          <a
            v-b-tooltip.hover
            :title="partner.name"
            v-for="partner in data.item.partners"
            :key="partner.code"
          >
            {{ partner.code }}
          </a>
        </template>
        <template v-slot:cell(mirador)="data">
          <b-dropdown id="dropdown-1" text="View" class="m-md-2">
            <b-dropdown-item>
              <router-link :to="`/${data.item.contentType}/${data.item.identifier}/1`">
                Mirador with minimal custom configuration
              </router-link>
            </b-dropdown-item>
            <b-dropdown-item>
              <router-link :to="`/mirador/${data.item.contentType}/${data.item.identifier}`">
                Mirador "out of the box"
              </router-link>
            </b-dropdown-item>
            <b-dropdown-item>
              <a :href="data.item.presentation">
                IIIF Presentation v3 Manifest
              </a>
            </b-dropdown-item>
          </b-dropdown>
        </template>
      </b-table>
      <b-pagination
        align="center"
        v-model="currentPage"
        :total-rows="totalRows"
        :per-page="perPage"
        aria-controls="items"
        @input="fetchResource"
      ></b-pagination>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';

const baseUrl: string = process.env.BASE_URL;

interface Resource {
  title: string;
  identifier: string;
  source: string;
  partners: Array<string>;
  collections: Array<string>;
  type: string;
  presentation: string;
  contentType: string;
}

interface Partner {
  code: string;
  name: string;
}

interface CollectionDocument {
  code: string;
  title: string;
  partners: Array<Partner>;
}

interface CollectionItem {
  text: string;
  value: string;
}

interface Field {
  key: string;
  label: string;
  sortable: boolean;
}

@Component({
  components: {},
})
export default class Home extends Vue {
  title: string = 'List of resources';

  timeoutID: number = 0;

  loadingMessage: string = 'Loading resources...';

  presentation: string = 'https://dev-sites.dlib.nyu.edu/viewer/api/presentation';

  iiifEndpoint: string = 'https://dev-sites.dlib.nyu.edu/viewer/api/v1/objects';

  collectionsUrl: string = 'https://dev-sites.dlib.nyu.edu/viewer/api/v1/collections';

  totalRows: number = 0;

  currentPage: number = 1;

  rows: number = 0;

  collection: string = '';

  partner: string = '';

  selectedCollection: string = 'null';

  perPage: number = 10;

  isBusy: boolean = true;

  items: Array<Resource> = [];

  collections: Array<CollectionItem> = [
    {
      text: '-- All collections --',
      value: 'null',
    },
  ];

  filter: string = '';

  filterOn: Array<string> = [];

  sortDirection: string = 'asc';

  sortBy: string = 'collection';

  fields: Array<Field> = [
    {
      label: 'Manifest',
      key: 'title',
      sortable: false,
    },
    {
      label: 'Type',
      key: 'type',
      sortable: false,
    },
    {
      label: 'Collection',
      key: 'collections',
      sortable: false,
    },
    {
      label: 'Partner',
      key: 'partners',
      sortable: false,
    },
    {
      label: 'Options',
      key: 'mirador',
      sortable: false,
    },
  ];

  private mounted(): void {
    this.fetchResource();
    this.fetchCollections();
  }

  private onCollectionChange(newValue: string): void {
    let params = [];
    this.selectedCollection = newValue;
    if (newValue !== 'null') {
      params = newValue.split(':');
      this.collection = params[0];
      if (params[1]) {
        this.partner = params[1];
      }
    }
    this.fetchResource();
  }

  private fetchCollections(): void {
    fetch(this.collectionsUrl)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Network response was not ok.');
      })
      .then(data => {
        const vm = this;
        data.response.docs.map((doc: CollectionDocument) => {
          vm.collections.push({
            value: `${doc.code}:${doc.partners[0].code}`,
            text: `${doc.title} - ${doc.partners[0].name}`,
          });
        });
      })
      .catch(error => {
        console.log(`Error! Could not reach the API. ${error}`);
      });
  }

  @Watch('filter')
  onPropertyChanged() {
    clearTimeout(this.timeoutID);
    const vm = this;
    this.timeoutID = setTimeout(() => {
      this.fetchResource();
    }, 500);
  }

  private fetchResource(): void {
    const vm = this;
    this.isBusy = true;
    let url = `${this.iiifEndpoint}?start=${this.perPage * this.currentPage - this.perPage}&rows=${
      this.perPage
    }`;

    vm.items = [];

    if (0 !== this.filter.length) {
      url = `${url}&searchTerm=${this.filter}`;
    }
    if (0 !== this.collection.length) {
      url = `${url}&collection=${this.collection}`;
    }
    if (0 !== this.partner.length) {
      url = `${url}&partner=${this.partner}`;
    }
    fetch(url)
      .then((response: Response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Network response was not ok.');
      })
      .then((data: any) => {
        vm.totalRows = parseInt(data.response.numFound, 10);
        data.response.docs.map((doc: any) => {
          const contentType = `${doc.type.replace('_set', '')}s`;

          console.log(contentType);
          const resource = {
            title: doc.title,
            identifier: doc.identifier,
            source: `/${contentType}/${doc.identifier}/1`,
            presentation: `${vm.presentation}/${contentType}/${doc.identifier}/manifest.json`,
            type: `${doc.type}`,
            contentType: contentType,
            collections: doc.collections,
            partners: doc.partners,
          };
          vm.items.push(resource);
        });
      })
      .finally(() => {
        this.isBusy = false;
      })
      .catch(error => {
        console.log(`Error! Could not reach the API. ${error}`);
      });
  }
}
</script>
