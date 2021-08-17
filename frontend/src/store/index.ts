import Vue from 'vue'
import Vuex from 'vuex'

import {bundlesPerWeeklySlot} from '../handle-sheet'
import {weeklySlotToString, emptyInstance, instanceToDefaultPreferences} from '../utils'


Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        instance: emptyInstance(),
        preferences: instanceToDefaultPreferences()
    },
    mutations: {
        setInstance(state, payload) {
            state.instance = payload;
            state.preferences = instanceToDefaultPreferences(payload);
        },
        setCapability(state, payload) {
            Vue.set(state.preferences.capabilities, payload.capability, payload.status);
        },
        setConsecutivePref(state, payload) {
            Vue.set(state.preferences.consecutivePreferences, payload.key, payload.preference);
        },
        setDifferentDaysPref(state, payload) {
            Vue.set(state.preferences.differentDaysPreferences, payload.key, payload.preference);
        },        
        setGroupTypePref(state, payload) {
            Vue.set(state.preferences.groupTypePreferences, payload.key, payload.preference);
        },
        setSlotPref(state, payload) {
            Vue.set(state.preferences.slotPreferences, weeklySlotToString(payload.weeklySlot), payload.preference);
        },
        setUserId(state, payload) {
            Vue.set(state.preferences, 'userId', payload);
        },
        setSchedulingComment(state, payload) {
            Vue.set(state.preferences, 'schedulingComment', payload);
        }
    },
    getters: {
        bundlesPerSlot(state) {
            const result = new Map();
            const bundles = state?.instance?.bundles;
            if (bundles) {
                const entries = bundlesPerWeeklySlot(bundles);
                for (const entry of entries.values()) {
                    const weeklySlot = entry.weeklySlot;
                    const bundles = entry.bundles;
                    const key = weeklySlotToString(weeklySlot);
                    result.set(key, bundles);
                }
            }
            return result;
        }
    },
    actions: {
        loadInstance(context, src) {
            console.log(src);
            return fetch(src.url)
                .then(response => {
                    return response.json()
                })
                .then(jsonObj => {
                    console.log(jsonObj);
                    context.commit('setInstance', jsonObj);
                })
                .catch(err => {
                    console.log(err);
                })
        }
    }

}) 