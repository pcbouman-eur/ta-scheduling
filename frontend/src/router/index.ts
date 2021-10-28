import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Preferences from '@/views/Preferences.vue'
import Scheduling from '@/views/Scheduling.vue'
import Prepare from '@/views/Prepare.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Home',
    component: Preferences
  },
  {
    path: '/scheduling',
    name: 'Scheduling',
    component: Scheduling
  },
  {
    path: '/prepare',
    name: 'Prepare',
    component: Prepare
  }
  // {
  //   path: '/about',
  //   name: 'About',
  //   // route level code-splitting
  //   // this generates a separate chunk (about.[hash].js) for this route
  //   // which is lazy-loaded when the route is visited.
  //   component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  // }  
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
