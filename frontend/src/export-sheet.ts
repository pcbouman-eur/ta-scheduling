import { SchedulingState, Session, AssignedSession } from "./data";
import XLSX from 'xlsx';
import { computeScheduleInformation, ScheduleInformation } from "./scheduling";
import { compareSessions } from "./utils";

export function createTASpreadSheet(state: SchedulingState): XLSX.WorkBook {
    const result = XLSX.utils.book_new();
    result.Props = {
        Title: 'Schedule for ' + state.instance.courseNames.join(', '),
    };

    const information = computeScheduleInformation(state.instance, state.taAvailability, state.currentAssignment, state.configuration);
    const overviewTypeMap = computeGroupsPerTa(information, true);
    const overviewGroupMap = computeGroupsPerTa(information);
    const tas = [...overviewTypeMap.keys()].sort();

    addOverviewSheet(result, [
        {header: 'Group Types per TA', keys: tas, map: overviewTypeMap},
        {header: 'Groups per TA', keys: tas, map: overviewGroupMap}
    ]);

    for (const [idx, availability] of state.taAvailability.entries()) {
        const bundles = information.bundlesPerTa[idx];
        const sessions: Session[] = [];
        for (const bundle of bundles) {
            for (const session of bundle.sessions) {
                sessions.push(session);
            }
        }
        sessions.sort(compareSessions);
        const sheetArray: (string|Date)[][] = [['Start', 'End', 'Group', 'Location']];
        for (const session of sessions) {
            const start = new Date(session.timeSlot.start);
            const end = new Date(session.timeSlot.end);
            sheetArray.push([start.toLocaleString(),end.toLocaleString(), session.group.name, session.location]);
        }
        addSheet(result, sheetArray, `${idx+1}. ${availability.preferences.userId}`, [28, 28, 10, 35]);
    }

    return result;
}

function computeCourseGroupMap(info: ScheduleInformation): Map<string,Array<AssignedSession>> {
    const result: Map<string,Array<AssignedSession>> = new Map();

    for (const session of info.assignedSessions) {
        const group = session.group.name;
        if (result.has(group)) {
            result.get(group)?.push(session);
        }
        else {
            result.set(group, [session]);
        }
    }

    for (const sessions of result.values()) {
        sessions.sort(compareSessions);
    }
    
    return result;
}

function computeGroupsPerTa(info: ScheduleInformation, groupType=false): Map<string,Map<string,number>> {
    const result: Map<string,Map<string,number>> = new Map();

    for (const session of info.assignedSessions) {
        const ta = session.userId;
        const group = groupType ? session.group.groupType : session.group.name;
        let subMap = result.get(ta);
        if (!subMap) {
            subMap = new Map();
            result.set(ta, subMap);
        }
        const count = subMap.get(group) || 0;
        subMap.set(group, count + 1)
    }

    return result;
}

function computeTAsPerGroup(info: ScheduleInformation, groupType=false): Map<string,Map<string,number>> {
    const result: Map<string,Map<string,number>> = new Map();

    for (const session of info.assignedSessions) {
        const group = groupType ? session.group.groupType : session.group.name;
        let subMap = result.get(group);
        if (!subMap) {
            subMap = new Map();
            result.set(group, subMap);
        }
        const count = subMap.get(session.userId) || 0;
        subMap.set(session.userId, count + 1)
    }

    return result;
}

function addToSheetArray(categories: string[], sheetArray: string[][], map: Map<string,Map<string,number>>): void {
    for (const cat of categories) {
        sheetArray.push([cat]);
        const subMap = map.get(cat);
        if (!subMap) {
            continue;
        }
        const subList = [...subMap.entries()];
        subList.sort((a, b) => b[1]-a[1]);
        for (const [userId, count] of subList) {
            sheetArray.push([userId, `${count} sessions`]);
        }
        sheetArray.push([]); 
    }
}

function addSheet(wb: XLSX.WorkBook, sheetArray: (string|number|Date)[][], sheetName: string, width: number[]) {
    wb.SheetNames.push(sheetName);
    const sheet = XLSX.utils.aoa_to_sheet(sheetArray);
    const colProps: {wch: number}[] = [];
    for (const wch of width) {
        colProps.push({wch});
    }
    sheet['!cols'] = colProps;
    wb.Sheets[sheetName] = sheet;
}

interface OverviewTask {
    map: Map<string, Map<string,number>>;
    header: string;
    keys: string[];
}

function addOverviewSheet(wb: XLSX.WorkBook, tasks: OverviewTask[]) {
    const sheetArray: string[][] = [];
    for (const task of tasks) {
        sheetArray.push([task.header]);
        sheetArray.push([]);
        addToSheetArray(task.keys, sheetArray, task.map);
        sheetArray.push([]);
    }
    addSheet(wb, sheetArray, 'Overview', [25, 12]);
}

export function createGroupSpreadSheet(state: SchedulingState): XLSX.WorkBook {
    const result = XLSX.utils.book_new();
    result.Props = {
        Title: 'Schedule for ' + state.instance.courseNames.join(', '),
    };

    const information = computeScheduleInformation(state.instance, state.taAvailability, state.currentAssignment, state.configuration);
    const map = computeCourseGroupMap(information);
    const overviewTypeMap = computeTAsPerGroup(information, true);
    const overviewGroupMap = computeTAsPerGroup(information);
    const groups = [...map.keys()].sort();
    const types = [...overviewTypeMap.keys()].sort();

    addOverviewSheet(result, [
        {header: 'Overview per Group Type', keys: types, map: overviewTypeMap},
        {header: 'Overview per Group', keys: groups, map: overviewGroupMap}
    ]);

    // // Block to limit sheetArray's scope
    // {
    //     const sheetArray: string[][] = [['Overview per Group Type'], []];
        
    //     addToSheetArray(types, sheetArray, overviewTypeMap);
        
    //     sheetArray.push([]);
    //     sheetArray.push(['Overview per Group']);
    //     sheetArray.push([]);

    //     addToSheetArray(groups, sheetArray, overviewGroupMap);
    //     addSheet(result, sheetArray, 'Overview', [25, 12]);
    // }

    for (const [idx, group] of groups.entries()) {
        const sheetArray: (string|Date)[][] = [['Start', 'End', 'Location', 'Teacher']];
        const sessions = map.get(group);
        if (sessions) {
            for (const session of sessions) {
                const start = new Date(session.timeSlot.start);
                const end = new Date(session.timeSlot.end);
                sheetArray.push([start.toLocaleString(),end.toLocaleString(), session.location, session.userId]);
            }
        }
        addSheet(result, sheetArray, `${idx+1}. ${group}`, [28, 28, 35, 28]);
    }

    return result;
}

export function downloadTASpreadsheet(state: SchedulingState): void {
    const wb = createTASpreadSheet(state);
    const filename = 'Schedule for ' + state.instance.courseNames[0].replaceAll(/[^A-Za-z0-9-_]/g,'_') + '.xlsx';
    XLSX.writeFile(wb, filename);
}

export function downloadGroupSpreadsheet(state: SchedulingState): void {
    const wb = createGroupSpreadSheet(state);
    const filename = 'Schedule for ' + state.instance.courseNames[0].replaceAll(/[^A-Za-z0-9-_]/g,'_') + '.xlsx';
    XLSX.writeFile(wb, filename);
}