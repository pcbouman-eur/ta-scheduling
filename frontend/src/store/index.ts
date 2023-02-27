import Vue from 'vue'
import Vuex from 'vuex'

import {bundlesPerWeeklySlot} from '../handle-sheet'
import {weeklySlotToString, emptyInstance, instanceToDefaultPreferences, emptyUserAvailability, computeBundlesToSchedule} from '../utils'
import { computeScheduleInformation, defaultSchedulingConfiguration } from '@/scheduling';


Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        instance: emptyInstance(),
        preferences: instanceToDefaultPreferences(),
        taAvailability: emptyUserAvailability(),
        currentAssignment: new Array(0).fill(-1),
        configuration: defaultSchedulingConfiguration()
    },
    mutations: {
        setInstance(state, payload) {
            state.instance = payload;
            state.preferences = instanceToDefaultPreferences(payload);
            state.currentAssignment = new Array(computeBundlesToSchedule(payload.bundles)).fill(-1);
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
        },
        setTAPreferences(state, payload) {
            state.taAvailability = payload;
        },
        addTAPreferences(state, payload) {
            console.log(state, payload);
            state.taAvailability.push({totalWorkload: 4*8, maxWeeklyWorkload: 4, preferences: payload});
        },
        assignBundleToTa(state, payload) {
            //state.helper.setAssignment(payload.bundleIndex, payload.taIndex);
            Vue.set(state.currentAssignment, payload.bundleIndex, payload.taIndex);
        },
        setAssignment(state, payload) {
            Vue.set(state, 'currentAssignment', payload);
        },
        setTotalWorkload(state, payload) {
            Vue.set(state.taAvailability[payload.index], 'totalWorkload', payload.value);
        },
        setMaxWeeklyWorkload(state, payload) {
            Vue.set(state.taAvailability[payload.index], 'maxWeeklyWorkload', payload.value);
        },
        setConfiguration(state, payload) {
            Vue.set(state, 'configuration', payload);
        },
        importState(state, payload) {
            state.configuration = payload.configuration;
            state.instance = payload.instance;
            state.taAvailability = payload.taAvailability;
            state.currentAssignment = payload.currentAssignment;
            state.preferences = instanceToDefaultPreferences(payload.instance);
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
        },
        scheduleInformation(state) {
            return computeScheduleInformation(state.instance, state.taAvailability, state.currentAssignment, state.configuration);
        },
        fullState(state) {
            return {instance: state.instance, taAvailability: state.taAvailability, currentAssignment: state.currentAssignment, configuration: state.configuration};
        }
    },
    actions: {
        loadInstance(context, src) {
            console.log(src);
            if (src.data) {
                const instance = JSON.parse(src.data);
                context.commit('setInstance', instance);
            }
            else if (src.url) {
                return fetch(src.url)
                    .then(response => {
                        return response.json()
                    })
                    .then(jsonObj => {
                        context.commit('setInstance', jsonObj);
                    })
                    .catch(err => {
                        console.log(err);
                    })
            }
        }
    }

}) 