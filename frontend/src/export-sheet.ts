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
        const sheetName = `${idx+1}. ${availability.preferences.userId}`;
        result.SheetNames.push(sheetName);
        const sheet = XLSX.utils.aoa_to_sheet(sheetArray);
        const colProps = [{wch: 28}, {wch: 28}, {wch: 10}, {wch: 35}];
        sheet['!cols'] = colProps;
        result.Sheets[sheetName] = sheet;
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

    {
        const sheetArray: string[][] = [['Overview per Group Type'], []];
        
        addToSheetArray(types, sheetArray, overviewTypeMap);
        
        sheetArray.push([]);
        sheetArray.push(['Overview per Group']);
        sheetArray.push([]);

        addToSheetArray(groups, sheetArray, overviewGroupMap);
        // for (const group of groups) {
        //     sheetArray.push([group]);
        //     const subMap = overviewGroupMap.get(group);
        //     if (!subMap) {
        //         continue;
        //     }
        //     const subList = [...subMap.entries()];
        //     subList.sort((a, b) => b[1]-a[1]);
        //     for (const [userId, count] of subList) {
        //         sheetArray.push([userId, `${count} sessions`]);
        //     }
        //     sheetArray.push([]);
        // }

        const sheetName = 'Overview';
        result.SheetNames.push(sheetName);
        const sheet = XLSX.utils.aoa_to_sheet(sheetArray);
        const colProps = [{wch: 25}, {wch: 12}];
        sheet['!cols'] = colProps;        
        result.Sheets[sheetName] = sheet;
}

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
        const sheetName = `${idx+1}. ${group}`;
        result.SheetNames.push(sheetName);
        const sheet = XLSX.utils.aoa_to_sheet(sheetArray);
        const colProps = [{wch: 28}, {wch: 28}, {wch: 35}, {wch: 28}];
        sheet['!cols'] = colProps;
        result.Sheets[sheetName] = sheet;
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