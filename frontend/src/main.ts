import Vue from 'vue'
import App from './App.vue'
import store from './store'
import vuetify from './plugins/vuetify'
import router from './router'

import { Base64 } from 'js-base64'

Vue.config.productionTip = false

new Vue({
  store,
  vuetify,
  router,
  render: h => h(App)
}).$mount('#app')

function updateHash() {
  const hash = window.location.hash.substring(1);
  if (hash.length > 0) {
    try {
      const data = Base64.decode(hash);
      store.dispatch('loadInstance', {data});
    }
    catch (e) {
      console.log(e);
    }
  }
  else {
    store.dispatch('loadInstance', {url: 'instance.json'})
  }
}

window.addEventListener('hashchange', updateHash);
updateHash();

