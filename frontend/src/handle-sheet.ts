import { Session, Group, WeeklySlot, Bundle, SchedulingInstance, IndexedBundle } from './data';
import { read, Sheet, utils, WorkBook } from "xlsx";

import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
dayjs.extend(weekOfYear);

//import LZUTF8 from 'lzutf8';

export function retrieveInstance(url='timetable-test.xlsx'): Promise<SchedulingInstance> {
    return new Promise((resolve, reject) => {
        const req = new XMLHttpRequest();
        req.open("GET", url, true);
        req.responseType = "arraybuffer";
        req.onload = () => {
            const data = new Uint8Array(req.response);
            const workbook = read(data, {type:"array", cellDates: true});
            resolve(workbookToInstance(workbook));
            /*
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const records = processSheet(firstSheet);
            const sessions = records.map(recordToSession);
            const bundles = bundleSessions(sessions);
            const bundlesPerSlot = bundlesPerWeeklySlot(bundles);
            console.log(bundlesPerSlot);
            const json_raw = JSON.stringify(bundlesPerSlot);
            const json_comp = LZUTF8.compress(json_raw, {outputEncoding: 'Base64'});
            const json_decomp = LZUTF8.decompress(json_comp, {inputEncoding: 'Base64'});
            console.log(json_comp);
            console.log(json_raw.length, json_comp.length, json_decomp.length);
            */
        }
        req.onerror = () => reject();
        req.send()
    });
}

export function workbookToInstance(workbook: WorkBook): SchedulingInstance {
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const records = processSheet(firstSheet);
    const sessions = records.map(recordToSession);
    const bundles = bundleSessions(sessions);
    const courseNames = [...new Set(records.map(rec => rec['Description'] + ' ('+rec['Course code']+')'))]
    const askSlots = bundlesPerWeeklySlot(bundles).map(ws => ws.weeklySlot);
    const maxConsecutiveSessions = computeMaxConsecutive(sessions);
    const maxDifferentDays = computeMaxWeekdays(sessions);
    const groupTypes = getGroupTypes(sessions);
    const capabilities = getCapabilities(sessions);
    return {
        courseNames,
        bundles,
        askSlots,
        askConsecutiveSessions: maxConsecutiveSessions > 1,
        maxConsecutiveSessions,
        askDifferentDays: maxDifferentDays > 1,
        maxDifferentDays,
        askGroupTypes: groupTypes.length > 1,
        groupTypes,
        askCapabilities: capabilities.length > 1,
        capabilities
    };
}

function getCapabilities(sessions: Session[]): string[] {
    const caps = [...new Set(sessions.flatMap(ses => ses.requiredCapabilities))];
    caps.sort();
    return caps;
}

function getGroupTypes(sessions: Session[]): string[] {
    const types = [...new Set(sessions.filter(ses => !ses.group.plenary).map(ses => ses.group.groupType))];
    types.sort();
    return types;
}

function computeMaxWeekdays(sessions: Session[]): number {
    let max = 0;
    const cur = new Set();
    let currentYear = -1;
    let currentWeek = -1;
    for (const ses of sessions) {
        const slot = dayjs(ses.timeSlot.start);
        const weekOfYear = slot.week();
        const dayInWeek = slot.day();
        const year = slot.year();
        if (currentWeek === weekOfYear && year === currentYear) {
            cur.add(dayInWeek);
        }
        else {
            max = Math.max(cur.size, max);
            cur.clear();
            currentWeek = weekOfYear;
            currentYear = year;
        }
    }
    return max;
}

// TODO: this method is not entirely correct, but it will be enough for now
function computeMaxConsecutive(sessions: Session[], maxDist=15): number {
    sessions.sort(ses_cmp);
    let prev = null;
    let cur = 0, max = 0;
    for (const ses of sessions) {
        if (prev != null) {
            const td = time_dist(prev, ses);
            if (td > 0 && td <= maxDist) {
                cur++;
                max = Math.max(cur, max);
            }
            else if (td > 0) {
                cur = 0;
            }
        }
        prev = ses;
    }
    return max;
}

interface sheet_header {
    [key: number]: string;
}

interface sheet_record {
    // eslint-disable-next-line
    [key: string]: any;
}

interface slot_bundles {
    weeklySlot: WeeklySlot;
    bundles: IndexedBundle[];
}

function time_dist(prev: Session, next: Session, timeUnit=60000): number {
    const prevEnd = prev.timeSlot.end.getTime();
    const nextStart = next.timeSlot.start.getTime();
    return (nextStart - prevEnd) / timeUnit;
}

function ws_to_num(ws: WeeklySlot): number {
    return ws.dayOfWeek * 24 * 60 + ws.startHour * 60 + ws.startMinute;
}

function sb_cmp(fst: slot_bundles, snd: slot_bundles): number {
    return ws_cmp(fst.weeklySlot, snd.weeklySlot);
}

function ws_cmp(fst: WeeklySlot, snd: WeeklySlot): number {
    return ws_to_num(fst) - ws_to_num(snd);
}

function ses_cmp(fst: Session, snd: Session): number {
    const ts1Start = fst.timeSlot.start.getTime();
    const ts2Start = snd.timeSlot.start.getTime();
    const ts1End = fst.timeSlot.end.getTime();
    const ts2End = snd.timeSlot.end.getTime();
    if (ts1Start == ts2Start) {
        return ts1End - ts2End;
    }
    return ts1Start - ts2Start;
}


export function bundlesPerWeeklySlot(bundles: Bundle[]): slot_bundles[] {
    const aggregator = new Map();
    for (const [index,bundle] of bundles.entries()) {
        const key = weeklySlotKey(bundle.weeklySlot);
        if (!aggregator.has(key)) {
            aggregator.set(key, [{index, ...bundle}]);
        }
        else {
            aggregator.get(key).push({index, ...bundle});
        }
    }
    
    const result: slot_bundles[] = [];
    for (const bundles of aggregator.values()) {
        result.push({weeklySlot: bundles[0].weeklySlot, bundles});
    }
    result.sort(sb_cmp);
    return result;
}

function weeklySlotKey(ws: WeeklySlot): string {
    return ws.dayOfWeek+'__'+ ws.startHour + '__' + ws.startMinute;
}

function bundleKey(ws: WeeklySlot, grp: Group): string {
    return weeklySlotKey(ws) + '__' + grp.name;
}

function makeName(group: Group, groupCount: Map<string,number>): string {
    const count = groupCount.get(group.name);
    let postFix = '';
    if (count) {
        groupCount.set(group.name, count+1);
        let remain = count;
        while (remain > 0) {
            if (remain > 26) {
                const charCode = remain % 26;
                postFix += String.fromCharCode(97+charCode);
                remain = Math.floor(remain / 26);
            }
            else {
                postFix += String.fromCharCode(97+remain);
                remain = 0;
            }
        }
    }
    else {
        groupCount.set(group.name, 1);
        postFix = 'a';
    }
    return group.name + '-' + postFix;
}

function bundleSessions(sessions: Session[], removePlenary=true, groupPostfix=true): Bundle[] {
    const filtered = sessions.filter( ses => (!ses.group.plenary || !removePlenary) && ses.canBundle );
    const groupCount: Map<string,number> = new Map();
    const bundles: Map<string,Bundle> = new Map();
    for (const ses of filtered) {
        const ws = sessionToWeeklySlot(ses)
        const grp = ses.group;
        const key =  bundleKey(ws, grp);
        if (!bundles.has(key)) {          
            const name = groupPostfix ? makeName(grp, groupCount) : grp.name;
            bundles.set(key, {
                name,
                group: ses.group,
                weeklySlot: ws,
                sessions: [ses]
            });
        }
        else {
            bundles.get(key)?.sessions.push(ses);
        }
    }
    return [...bundles.values()];
}

function sessionToWeeklySlot(session: Session, timeUnit=3600000): WeeklySlot {
    const ts = session.timeSlot;
    console.log(ts);
    const dayOfWeek = ts.start.getDay()
    const startHour = ts.start.getHours();
    const startMinute = ts.start.getMinutes();
    const durationInHours = Math.ceil((ts.end.getTime() - ts.start.getTime()) / timeUnit);
    return {
        dayOfWeek,
        startHour,
        startMinute,
        durationInHours
    }
}

function recordToSession(sheet_record: sheet_record, id: number): Session {
    const courseCode = sheet_record['Course code'];
    const start = sheet_record['Start'];
    const end = sheet_record['End'];
    const timeSlot = {
        start, end
    }
    const isEnglish = courseCode.endsWith('X') || courseCode.endsWith('S');
    const group = parseGroup(sheet_record['Group'], courseCode);
    const requiredCapabilities = [];
    if (isEnglish) {
        requiredCapabilities.push('English');
    }
    else {
        requiredCapabilities.push('Dutch');
    }
    return {
        timeSlot,
        staffNeeded: 1,
        canBundle: true,
        location: sheet_record['Location(s)'],
        id,
        type: sheet_record['Type'],
        group,
        requiredCapabilities
    }
}

function parseGroup(raw_input: string, courseCode: string, stripPrefix='Group '): Group {
    const input = raw_input.replace(stripPrefix, '');
    if (input === 'Plenary') {
        return {
            groupType: input,
            plenary: true,
            name: input
        }
    }

    const groupTypeMatch = input.match(/^[A-Za-z]+/);
    const groupNumberMatch = input.match(/[0-9]+$/);
    if (groupTypeMatch && groupNumberMatch) {
        return {
            name: input,
            groupType: groupTypeMatch[0],
            plenary: false
        }
    }
    const postFixMatch = courseCode.match(/[A-Za-z]$/)
    return {
        name: input + (postFixMatch ? ('-' + postFixMatch[0]) : ''),
        groupType: input + (postFixMatch ? ('-' + postFixMatch[0]) : ''),
        plenary: false
    }
}

function processSheet(sheet: Sheet): sheet_record[] {
    const raw_range = sheet['!ref'];
    if (!raw_range) {
        throw 'Invalid Spreadsheet';
    }
    const range = utils.decode_range(raw_range);
    let first_row = true;
    const result: sheet_record[] = [];
    const header: sheet_header = {};
    console.log(sheet);
    for (let row = range.s.r; row <= range.e.r; row++) {
        const record: sheet_record = {};
        for (let col = range.s.c; col <= range.e.c; col++) {
            const cell_address = utils.encode_cell({r: row, c: col});
            const cell = sheet[cell_address];
            if (!cell) {
                continue;
            }
            if (first_row) {
                header[col] = cell.v;
            }
            else {
                const field = header[col];
                record[field] = cell.v
            }
        }
        if (!first_row) {
            result.push(record)
        }
        else {
            first_row = false;
        }
    }
    return result;
}
