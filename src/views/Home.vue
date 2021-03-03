<template>
  <div class="main container">
    <div class="mt-3 overflow-auto">
      <b-form-group
        v-if="filter"
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
        <template v-slot:cell(thumbnail)="data">
          <img v-b-tooltip.hover :title="data.item.title" :src="data.item.thumbnail" />
        </template>
        <template v-slot:cell(title)="data">
          <div class="d-inline-block text-truncate" style="max-width: 250px;">
            <span v-b-tooltip.hover :title="data.item.title">
              {{ data.item.title }}
            </span>
          </div>
        </template>
        <template v-slot:cell(collections)="data">
          <div
            v-for="collection in data.item.collections"
            :key="collection.code"
            class="d-inline-block text-truncate"
            style="max-width: 250px;"
          >
            <a v-b-tooltip.hover :title="collection.name">
              {{ collection.name }}
            </a>
          </div>
        </template>
        <template v-slot:cell(partners)="data">
          <div
            class="d-inline-block text-truncate"
            style="max-width: 250px;"
            v-for="partner in data.item.partners"
            :key="partner.code"
          >
            <a v-b-tooltip.hover :title="partner.name">
              {{ partner.name }}
            </a>
          </div>
        </template>
        <template v-slot:cell(mirador)="data">
          <b-dropdown id="dropdown-1" text="View" class="m-md-2">
            <b-dropdown-item
              :href="`/${data.item.contentType}/${data.item.identifier}/1`"
              target="_blank"
            >
              Mirador with minimal custom configuration
            </b-dropdown-item>
            <b-dropdown-item
              :href="`${viewer}s/${data.item.contentType}/${data.item.identifier}/1`"
              target="_blank"
            >
              DLTS Viewer
            </b-dropdown-item>
            <b-dropdown-item :href="data.item.presentation" target="_blank">
              IIIF Presentation v3 Manifest
            </b-dropdown-item>
          </b-dropdown>
        </template>
      </b-table>
      <b-pagination
        v-if="items.length > 0"
        align="center"
        v-model="currentPagerPage"
        :total-rows="totalRows"
        :per-page="perPage"
        aria-controls="items"
      ></b-pagination>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';

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

interface ContentTypes {
  label: string;
  machine: string;
}

// Define the props by using Vue's canonical way.
const HomeProps = Vue.extend({
  props: {
    currentPage: {
      type: Number,
    },
    selectedType: {
      type: String,
    },
  },
});

@Component
export default class Home extends HomeProps {
  title: string = 'List of resources';

  timeoutID: number = 0;

  loadingMessage: string = 'Loading resources...';

  viewer: string = `${process.env.VUE_APP_VIEWER}`;

  presentation: string = `${process.env.VUE_APP_VIEWER}/api/presentation`;

  iiifEndpoint: string = `${process.env.VUE_APP_VIEWER}/api/v1/objects`;

  collectionsUrl: string = `${process.env.VUE_APP_VIEWER}/api/v1/collections`;

  types: Array<ContentTypes> = [
    {
      label: 'All',
      machine: '*',
    },
    {
      label: 'Books',
      machine: 'dlts_book',
    },
    {
      label: 'Maps',
      machine: 'dlts_map',
    },
    {
      label: 'Photos',
      machine: 'dlts_photo_set',
    },
  ];

  totalRows: number = 0;

  rows: number = 0;

  collection: string = '';

  partner: string = '';

  selectedCollection: string = 'null';

  perPage: number = 25;

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
      label: 'Cover',
      key: 'thumbnail',
      sortable: false,
    },
    {
      label: 'Title',
      key: 'title',
      sortable: false,
    },
    {
      label: 'Type',
      key: 'contentType',
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
    this.fetchCollections();
    this.fetchResource();
  }

  get currentPagerPage(): number {
    return this.currentPage;
  }

  set currentPagerPage(page: number) {
    this.onPagerPageSelect(page.toString());
  }

  private onPagerPageSelect(selectedPage: string): void {
    const query: any = {
      page: selectedPage,
    };
    if (this.selectedType !== '*') {
      query.type = this.selectedType;
    }
    this.$router.push({
      path: this.$router.currentRoute.path,
      query: query,
    });
    this.fetchResource();
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
    } else {
      this.collection = '';
      this.partner = '';
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
    this.timeoutID = setTimeout(() => {
      this.fetchResource();
    }, 500);
  }

  private fetchResource(): void {
    const vm = this;
    this.isBusy = true;
    const start = this.perPage * this.currentPage - this.perPage;
    let url = `${this.iiifEndpoint}?rows=${this.perPage}&start=${start}`;

    if (0 !== this.filter.length) {
      url = `${url}&searchTerm=${this.filter}`;
    }

    if (0 !== this.collection.length) {
      url = `${url}&collection=${this.collection}`;
    }
    if (0 !== this.partner.length) {
      url = `${url}&partner=${this.partner}`;
    }
    if (this.selectedType !== '*') {
      url = `${url}&type=${this.selectedType}`;
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
        vm.items = [];
        data.response.docs.map((doc: any) => {
          const contentType = `${doc.type.replace('_set', '')}s`;
          const resource = {
            title: doc.title,
            identifier: doc.identifier,
            source: `/${contentType}/${doc.identifier}/1`,
            presentation: `${vm.presentation}/${contentType}/${doc.identifier}/manifest.json`,
            type: `${doc.type}`,
            contentType: contentType,
            collections: doc.collections,
            partners: doc.partners,
            thumbnail: `${this.viewer}/api/image/${contentType}/${doc.identifier}/1/full/50,/0/default.jpg`,
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
