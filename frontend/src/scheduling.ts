import { AssignedSession, Bundle, IndexedBundle, Preference, SchedulingConfiguration, SchedulingInstance, SchedulingState, Session, UserAvailability } from "@/data";
import { compareSessions, computeStaffNeeded, weeklySlotToString, addMaps } from "./utils";
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
dayjs.extend(weekOfYear);

function computeBundles(instance: SchedulingInstance): IndexedBundle[] {
    console.log(instance);
    const result = [];
    let index = 0;
    for (const bundle of instance.bundles) {
        const n = computeStaffNeeded(bundle);
        for (let i=0; i < n; i++) {
            result.push({index, ...bundle});
            index++;
        }
    }
    return result;
}

function computeBundlesPerTA(assignment: number[], availability: UserAvailability[], bundles: IndexedBundle[]): IndexedBundle[][] {
    const bundlesPerTa: IndexedBundle[][] = [];

    for (let i=0; i < availability.length+1; i++) {
        bundlesPerTa[i] = []
    }
    for (let i=0; i < assignment.length; i++) {
        const ta = assignment[i];
        const bundle = bundles[i];
        if (ta != -1) {
            bundlesPerTa[ta].push(bundle);
        }
        else {
            bundlesPerTa[bundlesPerTa.length-1].push(bundle);
        }
    }

    return bundlesPerTa;
}

function computeAssignmentMatrix(instance: SchedulingInstance, bundlesPerTa: IndexedBundle[][], availability: UserAvailability[]): IndexedBundle[][][]{
    // TODO: the current design of data stuff doesn't seem that stable, unfortunately...
    //const bundleMap = getters.bundlesPerSlot;

    const result: IndexedBundle[][][] = [];
    for (const weeklySlot of instance.askSlots) {
        const wsKey = weeklySlotToString(weeklySlot);
        const row = []
        for (let i=0; i < availability.length+1; i++) {
            const taList = bundlesPerTa[i].filter(b => weeklySlotToString(b.weeklySlot) === wsKey);
            row.push(taList);
        }
        result.push(row);
    }
    return result;
}

function computeTotalWorkloads(availability: UserAvailability[], bundlesPerTa: IndexedBundle[][]): number[] {
    const result = [];
    for (let i=0; i < availability.length; i++) {
        let workload = 0;
        for (const bundle of bundlesPerTa[i]) {
            workload += computeBundleWorkload(bundle);
        }
        result.push(workload);
    }
    return result;
}

function computeMaxWeeklyWorkloads(availability: UserAvailability[], bundlesPerTa: IndexedBundle[][]): number[] {
    const result = [];
    for (let i=0; i < availability.length; i++) {
        const map = computeWeeklyWorkloads(bundlesPerTa[i]);
        let workload = 0;
        for (const weekLoad of map.values()) {
            workload = Math.max(workload, weekLoad);
        }
        result.push(workload);
    }
    return result;

}

function computeBundleViolations(bundles: IndexedBundle[], availability: UserAvailability[], bundlesPerTa: IndexedBundle[][]): Violation[][] {
    const result = new Array(bundles.length);
    for (let i=0; i < result.length; i++) {
        result[i] = [];
    }
    for (let ta=0; ta < availability.length; ta++) {
        const prefs = availability[ta].preferences;
        const bundles = bundlesPerTa[ta];
        for (const bundle of bundles) {
            // Check capabilities
            capabilityLoop:
            for (const session of bundle.sessions) {
                for (const cap of session.requiredCapabilities) {
                    if (!prefs.capabilities[cap]) {
                        const issue = {type: ViolationType.CAPABILITY_VIOLATION, text: `${prefs.userId} does not have capability '${cap}' required to teach one or more sessions in bundle ${bundle.name}`};
                        result[bundle.index].push(issue);
                        break capabilityLoop;
                    }
                }
            }
            // Check for unavailable timeslots
            const ws = weeklySlotToString(bundle.weeklySlot);
            if (!prefs.slotPreferences[ws] ||
                 prefs.slotPreferences[ws] === Preference.UNAVAILABLE) {
                const issue = {type: ViolationType.TIMESLOT_VIOLATION, text: `${prefs.userId} is unavailable at time slot ${ws} to teach sessions in bundle ${bundle.name}`};
                result[bundle.index].push(issue);
            }
        }

        // Check for Overlap
        for (let i=0; i < bundles.length; i++) {
            for (let j=i+1; j < bundles.length; j++) {
                const bundle1 = bundles[i];
                const bundle2 = bundles[j];
                if (checkOverlap(bundle1, bundle2)) {
                    const issue = {type: ViolationType.OVERLAP_VIOLATION, text: `${prefs.userId} teaches both bundle ${bundle1.name} and ${bundle2.name}, but these have sessions that overlap in time.`};
                    result[bundle1.index].push(issue);
                    result[bundle2.index].push(issue);
                }
            }
        }    
    }
    return result;
}

function configToScore(config: SchedulingConfiguration, pref: Preference): number {
    switch(pref) {
        case Preference.FAVORED:
            return config.favoredScore;
        case Preference.STRONGLY_FAVORED:
            return config.stronglyFavoredScore;
        case Preference.NEUTRAL:
            return config.neutralScore;
        case Preference.UNFAVORED:
            return config.unfavoredScore;
        case Preference.STRONGLY_UNFAVORED:
            return config.stronglyUnfavoredScore;
        case Preference.UNAVAILABLE:
            return config.unavailableScore;
    }
    console.log(pref);
    return config.neutralScore;
    throw `The preference ${pref} was not recognized.`
}

function areConsecutive(session1: Session, session2: Session, config: SchedulingConfiguration): boolean {
    const end1 = new Date(session1.timeSlot.end).getTime();
    const start2 = new Date(session2.timeSlot.start).getTime();
    const diffMinutes = (start2 - end1) / 60000;
    return diffMinutes <= config.consecutiveThresholdMinutes;
}

function computeConsecutive(sesList: Session[], config: SchedulingConfiguration): number[] {
    const counts = [];
    let count = 0;
    let prevSession = null;
    for (const session of sesList) {
        if (prevSession == null) {
            count = 0;
        }
        else if (!areConsecutive(prevSession, session, config)) { 
            counts.push(count);
            count = 0;
        }
        count++;
        prevSession = session;
    }
    counts.push(count);
    return counts;
}

function computeObjective(config: SchedulingConfiguration, assignment: number[], availability: UserAvailability[],
                            bundlesPerTa: IndexedBundle[][], bundleViolations: Violation[][],
                            workloadViolations: Violation[]): number {
    let result = 0;
    
    // Uncovered sessions
    result += config.uncoveredScore * assignment.filter(i => i == -1).length;

    const groupMap = new Map();

    for (let ta=0; ta < availability.length; ta++) {
        const av = availability[ta];
        const prefs = av.preferences;
        
        const sesList: Session[] = [];
        
        for (const bundle of bundlesPerTa[ta]) {
            const n = bundle.sessions.length;
            // Adding timeslot preferences
            const ws = weeklySlotToString(bundle.weeklySlot);
            const slotPref = prefs.slotPreferences[ws];
            const slotScore = configToScore(config, slotPref);
            result += config.slotPreferenceFactor * slotScore * n;

            // Adding group preferences
            const groupPref = prefs.groupTypePreferences[bundle.group.groupType];
            const groupScore = configToScore(config, groupPref);
            result += config.groupPreferenceFactor * groupScore * n;

            // Add the sessions
            for (const session of bundle.sessions) {
                sesList.push(session);
            }

            // Track the number of unique TA's per group
            const group = bundle.group.name;
            if (!groupMap.has(group)) {
                groupMap.set(group, new Set());
            }
            groupMap.get(group).add(ta);
        }

        // Analyze all the sessions for:
        sesList.sort(compareSessions);
        const counts = computeConsecutive(sesList, config);
        for (const count of counts) {
            const pref = prefs.consecutivePreferences[count];
            if (pref) {
                result += configToScore(config, pref) * config.consecutiveSessionFactor;
            }
        }


        // For each week, compute the 'days of week' score to add
        const dayMap = new Map();
        for (const session of sesList) {
            const start = dayjs(session.timeSlot.start);
            const weekOfYear = start.week();
            const dayOfWeek = start.day();
            if (!dayMap.has(weekOfYear)) {
                dayMap.set(weekOfYear, new Set());
            }
            dayMap.get(weekOfYear).add(dayOfWeek);
        }
        for (const days of dayMap.values()) {
            const numDays = days.size;
            const pref = prefs.differentDaysPreferences[numDays];
            if (pref) {
                result += config.multipleDayFactor * configToScore(config, pref);
            }
        }
    }

    // Add multiple TA's per group factor
    for (const set of groupMap.values()) {
        const tas = set.size;
        const base = Math.max(0, tas - 1);
        result += config.multiTAFactor * Math.pow(base, config.multiTAExponent);
    }
    
    // TODO: And violations?
    for (const lst of bundleViolations) {
        result += config.violationScore * lst.length;
    }
    result += config.violationScore * workloadViolations.length;

    return result;
}

function computeWorkloadViolations(workloads: number[], weeklyWorkloads: number[],
                                    availability: UserAvailability[]): Violation[] {
    const result = [];
    for (const [idx, av] of availability.entries()) {
        if (workloads[idx] > av.totalWorkload) {
            result.push({type: ViolationType.WORKLOAD_VIOLATION, text:`Maximum total workload of ${av.preferences.userId} violated`});
        }
        if (weeklyWorkloads[idx] > av.maxWeeklyWorkload) {
            result.push({type: ViolationType.WORKLOAD_VIOLATION, text:`Maximum weekly workload of ${av.preferences.userId} violated`});
        }
    }
    return result;
}

function computeBundleWorkload(bundle: Bundle): number {
    let workload = 0;
    for (const session of bundle.sessions) {
        const start = new Date(session.timeSlot.start);
        const end = new Date(session.timeSlot.end);
        workload += (end.getTime() - start.getTime()) / 3600000;                
    }
    return workload;
}

function computeAssignedSessions(availability: UserAvailability[], bundlesPerTA: IndexedBundle[][]): AssignedSession[] {
    const result = [];
    for (const [idx,av] of availability.entries()) {
        const userId = av.preferences.userId;
        for (const bundle of bundlesPerTA[idx])  {
            for (const session of bundle.sessions) {
                result.push({...session, userId});
            }
        }
    }
    return result;
}

export function computeBundleWeeklyWorkloads(bundle: Bundle): Map<number,number> {
    const map = new Map();
    for (const session of bundle.sessions) {
        const start = new Date(session.timeSlot.start);
        const end = new Date(session.timeSlot.end);
        const workload = (end.getTime() - start.getTime()) / 3600000;
        const week = dayjs(start).week();
        if (map.has(week)) {
            map.set(week, map.get(week) + workload);
        }
        else {
            map.set(week, workload);
        }
    }
    return map;
}

export function computeWeeklyWorkloads(bundles: Bundle[]): Map<number,number> {
    const map = new Map();
    for (const bundle of bundles) {
        const subMap = computeBundleWeeklyWorkloads(bundle);
        addMaps(map, subMap, true);
    }
    return map;
}

export function checkOverlap(bundle1: Bundle, bundle2: Bundle): boolean {
    // TODO: if weekly slots do not overlap, we can skip the loop.
    for (const session1 of bundle1.sessions) {
        const s1Start = new Date(session1.timeSlot.start).getTime();
        const s1End = new Date(session1.timeSlot.end).getTime();
        for (const session2 of bundle2.sessions) {
            const s2Start = new Date(session2.timeSlot.start).getTime();
            const s2End = new Date(session2.timeSlot.end).getTime();
            if (s1Start <= s2End && s1End >= s2Start) {
                return true;
            }
        }
    }
    return false;
}


export function computeBundleWorkloads(bundles: Bundle[]): number[] {
    return bundles.map(computeBundleWorkload);
}

export function computeScheduleInformation(instance: SchedulingInstance,
                                           availability: UserAvailability[],
                                           assignment: number[],
                                           config: SchedulingConfiguration): ScheduleInformation {
    console.log(instance);
    const bundles = computeBundles(instance);
    const bundlesPerTa = computeBundlesPerTA(assignment, availability, bundles);
    const matrix = computeAssignmentMatrix(instance, bundlesPerTa, availability);
    const workloads = computeTotalWorkloads(availability, bundlesPerTa);
    const weeklyWorkloads = computeMaxWeeklyWorkloads(availability, bundlesPerTa);
    const bundleViolations = computeBundleViolations(bundles, availability, bundlesPerTa);
    const workloadViolations = computeWorkloadViolations(workloads, weeklyWorkloads, availability);
    const objective = computeObjective(config, assignment, availability, bundlesPerTa, bundleViolations, workloadViolations);
    const assignedSessions = computeAssignedSessions(availability, bundlesPerTa);
    return {
        instance,
        availability,
        assignment,
        bundles,
        bundlesPerTa,
        matrix,
        workloads,
        weeklyWorkloads,
        workloadViolations,
        bundleViolations,
        objective,
        assignedSessions
    };
}

export function computeFromState(state: SchedulingState, assignment?: number[]): ScheduleInformation {
    if (assignment) {
        return computeScheduleInformation(state.instance, state.taAvailability, assignment, state.configuration);
    }
    return computeScheduleInformation(state.instance, state.taAvailability, state.currentAssignment, state.configuration);
}

export function defaultSchedulingConfiguration(): SchedulingConfiguration {
    return {
        stronglyFavoredScore: 3,
        favoredScore: 1,
        neutralScore: 0,
        unfavoredScore: -1,
        stronglyUnfavoredScore: -3,
        unavailableScore: -50,
        slotPreferenceFactor: 1,
        groupPreferenceFactor: 0.25,
        consecutiveSessionFactor: 1,
        multipleDayFactor: 1,
        multiTAExponent: 1.5,
        multiTAFactor: -5,
        violationScore: -100,
        uncoveredScore: -250,
        consecutiveThresholdMinutes: 20
    }
}



export enum ViolationType {
    CAPABILITY_VIOLATION,
    TIMESLOT_VIOLATION,
    OVERLAP_VIOLATION,
    WORKLOAD_VIOLATION
}

export interface Violation {
    type: ViolationType;
    text: string;
}

export interface ScheduleInformation {
    instance: SchedulingInstance;
    availability: UserAvailability[];
    bundles: IndexedBundle[];
    assignment: number[];
    bundlesPerTa: IndexedBundle[][];
    matrix: IndexedBundle[][][];
    workloads: number[];
    weeklyWorkloads: number[];
    bundleViolations: Violation[][];
    workloadViolations: Violation[];
    objective: number;
    assignedSessions: AssignedSession[];
}
