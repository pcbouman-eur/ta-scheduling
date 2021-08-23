import { SchedulingState, Session } from "./data";
import XLSX from 'xlsx';
import { computeScheduleInformation } from "./scheduling";
import { compareSessions } from "./utils";

export function createSpreadSheet(state: SchedulingState): XLSX.WorkBook {
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

export function downloadSpreadsheet(state: SchedulingState): void {
    const wb = createSpreadSheet(state);
    const filename = 'Schedule for ' + state.instance.courseNames[0].replaceAll(/[^A-Za-z0-9-_]/g,'_') + '.xlsx';
    XLSX.writeFile(wb, filename);
}