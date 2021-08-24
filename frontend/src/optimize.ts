import { Bundle, Preference, SchedulingState, UserAvailability } from "./data";
import { computeFromState, } from "./scheduling";
import { weeklySlotToString } from "./utils";
import { shuffle, MersenneTwister19937, Engine }  from 'random-js';

function compatibilityMatrix(bundles: Bundle[], availability: UserAvailability[]): boolean[][] {
    const result = []
    for (const bundle of bundles) {
        const row = [];
        for (const av of availability) {
            const prefs = av.preferences;
            const key = weeklySlotToString(bundle.weeklySlot);
            let possible = prefs.slotPreferences[key] !== Preference.UNAVAILABLE;
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

export function greedy(state: SchedulingState, maxSteps=5, seed?: number): number[]|null {
    let result = state.currentAssignment;
    let improve = false;
    const info = computeFromState(state);
    const compat = compatibilityMatrix(info.bundles, state.taAvailability);
    let improvementFound = false;
    let iteration = 0;
    const rng = seed ? MersenneTwister19937.seed(seed) : MersenneTwister19937.autoSeed();
    do {
        improve = false;
        iteration++;
        const step = greedyStep(state, compat, result, rng);
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

function greedyStep(state: SchedulingState, compat: boolean[][], assignment: number[], rng: Engine): number[]|null {
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