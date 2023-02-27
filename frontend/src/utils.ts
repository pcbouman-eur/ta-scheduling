import {DayOfWeek, WeeklySlot, Session, SchedulingInstance, UserPreferences, Preference, NumberPreferences, StringPreferences, StringBoolean, Bundle, UserAvailability, SchedulingState} from './data'

import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
dayjs.extend(weekOfYear);

export function weeklySlotToString(ws: WeeklySlot): string {
    const day = DayOfWeek[ws.dayOfWeek];
    const startHour = ws.startHour < 10 ? ('0'+ws.startHour) : ws.startHour;
    const startMinute = ws.startMinute < 10 ? ('0'+ws.startMinute) : ws.startMinute;
    const end = dayjs().hour(ws.startHour).minute(ws.startMinute).add(ws.durationInHours, 'hours');
    const endHour = end.hour() < 10 ? ('0'+end.hour()) : end.hour();
    const endMinute = end.minute() < 10 ? ('0'+end.minute()) : end.minute();

    return day + ' ' + startHour + ':' + startMinute + '-' + endHour + ':' + endMinute;
}

export function weekNumberString(sessions: Session[], addPrefix=true): string {
    const weeks = [...new Set(sessions.map(ses => dayjs(ses.timeSlot.start).week()))];
    weeks.sort();
    const splitted: number[][] = [];
    let last = -2;
    for (const week of weeks) {
        if (week > last+1) {
            splitted.push([week]);
        }
        else if (last!==-1) {
            splitted[splitted.length-1].push(week);
        }
        last = week;
    }
    let prefix = '';
    if (addPrefix && sessions.length > 0) {
        prefix = 'Week'
        if (sessions.length > 1) {
            prefix += 's';
        }
        prefix += ' ';
    }
    return prefix + splitted.map(seqToStr).join(', ');
}

export function downloadInstanceJson(instance: SchedulingInstance): void {
    const filename = 'scheduling-'+instance.courseNames[0].replaceAll(/[^A-Za-z0-9-_]/g,'_')+'.instance.json';
    const element = document.createElement('a');
    const body = JSON.stringify(instance);
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(body));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

export function downloadPreferencesJson(preferences: UserPreferences, instance: SchedulingInstance): void {
    let filename = 'preferences-'
        + preferences.userId.replaceAll(/[^A-Za-z0-9-_]/g,'_')
        + '-'
        + instance.courseNames[0].replaceAll(/[^A-Za-z0-9-_]/g,'_')
    filename = filename.replaceAll(/_*$/g,'').replaceAll(/_+/g,'_');
    filename += '.preferences.json';
    const element = document.createElement('a');
    const body = JSON.stringify(preferences);
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(body));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

export function downloadSchedulingJson(state: SchedulingState): void {
    const instance = state.instance;
    const filename = 'scheduling-state-'+instance.courseNames[0].replaceAll(/[^A-Za-z0-9-_]/g,'_')+'.state.json';
    const element = document.createElement('a');
    const body = JSON.stringify(state);
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(body));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

export function downloadString(data: string, filename: string): void {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(data));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function seqToStr(seq: number[]) {
    if (seq.length >= 2) {
        return seq[0] + '-' + seq[seq.length-1];
    }
    return ''+seq[0];
}
export function emptyInstance(): SchedulingInstance {
    return {
        courseNames: [],
        bundles: [],
        askSlots: [],
        askConsecutiveSessions: false,
        maxConsecutiveSessions: 1,
        askDifferentDays: false,
        maxDifferentDays: 1,
        askGroupTypes: false,
        groupTypes: [],
        askCapabilities: false,
        capabilities: []
    }
}

export function instanceToDefaultPreferences(instance: SchedulingInstance=emptyInstance()): UserPreferences {
    const capabilities = new Map(instance.capabilities.map(cap => [cap, false]));
    const slotPreferences = new Map(instance.askSlots.map(slot => [weeklySlotToString(slot), Preference.NEUTRAL]));
    const groupTypePreferences = new Map(instance.groupTypes.map(grp => [grp, Preference.NEUTRAL]));
    const userId = '';
    const schedulingComment = '';
    const consecutivePreferences = new Map();
    for (let i=2; i <= instance.maxConsecutiveSessions; i++) {
        consecutivePreferences.set(i, Preference.NEUTRAL);
    }
    const differentDaysPreferences = new Map();
    for (let i=1; i <= instance.maxDifferentDays; i++) {
        differentDaysPreferences.set(i, Preference.NEUTRAL);
    }
    return {
        capabilities: mapConvBool(capabilities),
        consecutivePreferences: mapConvNum(consecutivePreferences),
        groupTypePreferences: mapConvStr(groupTypePreferences),
        userId,
        differentDaysPreferences: mapConvNum(differentDaysPreferences),
        slotPreferences:  mapConvStr(slotPreferences),
        schedulingComment
    };
}

export function emptyUserAvailability(): UserAvailability[] {
    return [];
}


// TODO: can't we make this a single method with some type generics? This is ugly...
function mapConvNum(map: Map<number,Preference>): NumberPreferences {
    const result: NumberPreferences = {};
    for (const [key,val] of map.entries()) {
        result[key] = val;
    }
    return result;
}

function mapConvStr(map: Map<string,Preference>): StringPreferences {
    const result: StringPreferences = {};
    for (const [key,val] of map.entries()) {
        result[key] = val;
    }
    return result;
}

function mapConvBool(map: Map<string,boolean>): StringBoolean {
    const result: StringBoolean = {};
    for (const [key,val] of map.entries()) {
        result[key] = val;
    }
    return result;
}

export function findDataValue(el: HTMLElement, key: string, boundaryType?: string): string|undefined {
    let current: HTMLElement|null = el;
    const boundary = boundaryType?.toUpperCase();
    while (current != null) {
        if (current.tagName === boundary) {
            return undefined;
        }
        const dataset = current.dataset;
        
        if (dataset && dataset[key] !== undefined) {
            return dataset[key];
        }
        current = current.parentElement;
    }
    return undefined;
}

export function computeBundlesToSchedule(bundles: Bundle[]): number {
    let result = 0;
    for (const bundle of bundles) {
        result += computeStaffNeeded(bundle);
    }
    return result;
}

export function computeStaffNeeded(bundle: Bundle): number {
    let result = 0;
    for (const session of bundle.sessions) {
        result = Math.max(result, session.staffNeeded);
    }
    return result;
}

export function compareSessions(ses1: Session, ses2: Session): number {
    const start1 = new Date(ses1.timeSlot.start);
    const start2 = new Date(ses2.timeSlot.start);
    const startDiff = start1.getTime() - start2.getTime();
    if (startDiff !== 0) {
        return startDiff;
    }
    const end1 = new Date(ses1.timeSlot.end);
    const end2 = new Date(ses2.timeSlot.end);
    return end1.getTime() - end2.getTime();
}

export function addMaps<K>(map1: Map<K,number>, map2: Map<K,number>, inline=false): Map<K,number> {
    const result = inline ? map1 : new Map(map1);
    for (const [key,value] of map2.entries()) {
        if (result.has(key)) {
            let old = result.get(key);
            if (!old) {
                old = 0;
            }
            result.set(key, old+value);
        }
        else {
            result.set(key, value);
        }
    }
    return result;
}

export function mapMaxValue<T>(map: Map<T,number>): number {
    let result = -Infinity;
    for (const n of map.values()) {
        result = Math.max(result, n);
    }
    return result;
}