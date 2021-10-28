import { Bundle, Preference, SchedulingState, UserAvailability } from "./data";
import { computeFromState, computeBundleWorkloads, ScheduleInformation, checkOverlap,
         computeBundleWeeklyWorkloads, computeWeeklyWorkloads } from "./scheduling";
import { weeklySlotToString, addMaps, mapMaxValue } from "./utils";
import { shuffle, MersenneTwister19937, Engine, sample }  from 'random-js';


function canAddBundleOverlap(bundle: Bundle, assigned: Bundle[]): boolean {
    for (const other of assigned) {
        if (checkOverlap(bundle, other)) {
            return false;
        }
    }
    return true;
}

function canAddBundleWeeklyWorkload(
    current: Map<number,number>,
    toAdd: Map<number,number>,
    maxWeeklyWorkload: number): boolean {
        const newMap = addMaps(current, toAdd);
        const maxValue = mapMaxValue(newMap);
        return maxValue <= maxWeeklyWorkload;
}

function compatibilityMatrix(info: ScheduleInformation, assignment?: number[]): boolean[][] {
    const bundles = info.bundles;
    const availability = info.availability;
    const result = [];
    const weeklyWorkloads = info.bundlesPerTa.map(computeWeeklyWorkloads);
    // TODO: computing this only once is probably faster?
    const workloads = computeBundleWorkloads(bundles);
    for (const [bundleIdx,bundle] of bundles.entries()) {
        const bundleWeeklyLoad = computeBundleWeeklyWorkloads(bundle);
        const row = [];
        for (const [idx,av] of availability.entries()) {
            const prefs = av.preferences;
            const key = weeklySlotToString(bundle.weeklySlot);
            const taBundles = info.bundlesPerTa[idx];
            
            let possible = prefs.slotPreferences[key] !== Preference.UNAVAILABLE
                        && info.workloads[idx] + workloads[bundleIdx] <= av.totalWorkload
                        && (assignment == null || assignment[bundleIdx] == -1)
                        && canAddBundleOverlap(bundle, taBundles)
                        && canAddBundleWeeklyWorkload(weeklyWorkloads[idx], bundleWeeklyLoad, av.maxWeeklyWorkload);
            // TODO: we should probably also consider weekly max workload violations here
            if (possible) {
                capabilityLoop:
                for (const session of bundle.sessions) {
                    for (const cap of session.requiredCapabilities) {
                        if (!prefs.capabilities[cap]) {
                            possible = false;
                            break capabilityLoop;
                        }
                    }
                }
            }
            row.push(possible);
        }
        result.push(row);
    }
    return result;
}

interface GreedyAction {
    index: number,
    bundle: boolean,
    choices: number[]
}

function computeGreedyActions(matrix: boolean[][], info: ScheduleInformation): GreedyAction[] {
    const bundleOptions = new Array(matrix.length).fill(()=>[]).map(f=>f());
    const taOptions = new Array(matrix[0].length).fill(()=>[]).map(f=>f());
    for (const [rowIdx,row] of matrix.entries()) {
        for (const [colIdx,val] of row.entries()) {
            if (val) {
                bundleOptions[rowIdx].push(colIdx);
                taOptions[colIdx].push(rowIdx);
            }
        }
    }
    const actions: GreedyAction[] = [];
    for (const [bundleIdx,tas] of bundleOptions.entries()) {
        if (tas.length > 0) {
            actions.push({
                index: bundleIdx,
                bundle: true,
                choices: [...tas]
            });
        }
    }
    for (const [taIdx, bundles] of taOptions.entries()) {
        if (bundles.length > 0) {
            actions.push({
                index: taIdx,
                bundle: false,
                choices: [...bundles]
            });
        }
    }
    if (actions.length == 0) {
        return [];
    }
    //console.log(matrix, bundleOptions, taOptions, actions);
    actions.sort((a1, a2) => a1.choices.length - a2.choices.length);
    const minChoices = actions[0].choices.length;
    return actions.filter(a => a.choices.length == minChoices);
}

export function greedy(state: SchedulingState, maxSteps=25, seed?: number, minChoice=true): number[]|null {
    const stateCopy = {...state};
    let result = state.currentAssignment;
    let improve = false;
    let improvementFound = false;
    let iteration = 0
    const stepFn = minChoice ? minChoiceGreedyStep : fullGreedyStep;
    const rng = seed ? MersenneTwister19937.seed(seed) : MersenneTwister19937.autoSeed();
    do {
        improve = false;
        iteration++;
        stateCopy.currentAssignment = result;
        const info = computeFromState(stateCopy);
        const compat = compatibilityMatrix(info, result);
        const step = stepFn(state, compat, result, rng);
        if (step) {
            result = step;
            improve = true;
            improvementFound = true;
        }
    } while(improve && iteration <= maxSteps);
    if (improvementFound) {
        return result;
    }
    return null;
}

function minChoiceGreedyStep(state: SchedulingState, compat: boolean[][], assignment: number[], rng: Engine): number[]|null {
    const info = computeFromState(state, assignment);
    const actions = computeGreedyActions(compat, info);
    if (actions.length == 0) {
        return null;
    }
    const action = sample(rng, actions, 1)[0];
    console.log(action);
    const newAssignments = [];
    if (action.bundle) {
        for (const ta of action.choices) {
            const newAssignment = [...assignment];
            newAssignment[action.index] = ta;
            newAssignments.push(newAssignment);
        }
    }
    else {
        for (const bundle of action.choices) {
            const newAssignment = [...assignment];
            newAssignment[bundle] = action.index;
            newAssignments.push(newAssignment);
        }
    }

    let improve = false;
    let best = info.objective;
    let bestAssignment = null;
    for (const newAssignment of newAssignments) {
        const newInfo = computeFromState(state, newAssignment);
        if (newInfo.objective > best) {
            best = newInfo.objective;
            bestAssignment = newAssignment;
            improve = true;
        }
    }
    if (improve) {
        console.log('Improvement found!');
    }
    else {
        console.log('No improvement found.');
    }
    return bestAssignment;
}

function fullGreedyStep(state: SchedulingState, compat: boolean[][], assignment: number[], rng: Engine): number[]|null {
    const info = computeFromState(state, assignment);
    let improve = false;
    let best = info.objective;
    let bestAssignment = null;
    for (const [bundleIdx,assignee] of assignment.entries()) {
        if (assignee == -1) {
            const tas = [...compat[bundleIdx].entries()].filter(e => e[1]).map(e => e[0]);
            shuffle(rng, tas);
            for (const taIdx of tas) {
                const newAssignment = [...assignment];
                newAssignment[bundleIdx] = taIdx;
                const newInfo = computeFromState(state, newAssignment);
                if (newInfo.objective > best) {
                    best = newInfo.objective;
                    bestAssignment = newAssignment;
                    improve = true;
                }
            }
        }
    }
    if (improve) {
        console.log('Improvement found!');
    }
    else {
        console.log('No improvement found.');
    }
    return bestAssignment;
}