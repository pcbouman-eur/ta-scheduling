import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
  },
  mutations: {
  },
  actions: {
  },
  modules: {
  }
}) 

/*
Vue.use(Vuex)

import {retrieveInstance} from './handle-sheet'

export default new Vuex.Store({
    state: {
        instance: null
    },
    mutations: {
        setInstance(state, payload) {
            state.instance = payload;
        }
    },
    getters: {

    },
    actions: {
        loadInstance(context, src) {
            retrieveInstance(src.url).then(instance => {
                context.commit('setInstance', instance);
            });
        }
    }

})
*/