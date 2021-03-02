import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import(/* webpackChunkName: "home" */ './views/Home.vue'),
      props: route => ({
        currentPage: route.query.page ? Number(route.query.page) : 1,
      }),
    },
    {
      path: '/:resource/:identifier/:sequence',
      name: 'viewer',
      component: () => import(/* webpackChunkName: "viewer" */ './views/Viewer.vue'),
      props: route => ({
        resource: route.params.resource,
        identifier: route.params.identifier,
        sequence: Number(route.params.sequence),
      }),
    },
  ],
});
