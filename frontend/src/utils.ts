import {DayOfWeek, WeeklySlot, Session, SchedulingInstance, UserPreferences, Preference, NumberPreferences, StringPreferences, StringBoolean} from './data'

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
    const filename = 'scheduling-'+instance.courseNames[0].replaceAll(/[^A-Za-z0-9-_]/g,'_')+'.json';
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
    filename += '.json';
    const element = document.createElement('a');
    const body = JSON.stringify(preferences);
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(body));
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