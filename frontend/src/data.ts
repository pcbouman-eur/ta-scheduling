export interface UserPreferences {
  capabilities: { [key: string]: boolean; };
  consecutivePreferences: { [key: number]: Preference; };
  groupPreferences: { [key: string]: Preference; };
  userId: string;
  differentDaysPreference: { [key: number]: Preference; };
  slotPreferences: [[WeeklySlot,Preference]];
  schedulingComment: string;
}

export enum Preference {
  UNAVAILABLE = 'UNAVAILABLE',
  STRONGLY_UNFAVORED = 'STRONGLY_UNFAVORED',
  UNFAVORED = 'UNFAVORED',
  NEUTRAL = 'NEUTRAL',
  FAVORED = 'FAVORED',
  STRONGLY_FAVORED = 'STRONGLY_FAVORED'
}

export enum PreferenceColors {
  UNAVAILABLE = '#888888',
  STRONGLY_UNFAVORED = '#ff6b6b',
  UNFAVORED = '#ffadad',
  NEUTRAL = '#ffffff', //'#fffa70',
  FAVORED = '#ccffcc',
  STRONGLY_FAVORED = '#75ff75'
}

export interface Timeslot {
  start: Date;
  end: Date;
}

export interface Group {
  groupType: string;
  name: string;
  plenary: boolean;
}

export interface Session {
  timeSlot: Timeslot;
  staffNeeded: number;
  canBundle: boolean;
  location: string;
  id: number;
  type: string;
  group: Group;
  requiredCapabilities: string[];
}

export interface WeeklySlot {
  durationInHours: number;
  dayOfWeek: DayOfWeek;
  startHour: number;
  startMinute: number;
}

export interface Bundle {
  sessions: Session[];
  name: string;
  group: Group;
  weeklySlot: WeeklySlot;
}  

export enum DayOfWeek {
  MONDAY = 0, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
}

export interface SchedulingInstance {
  courseNames: string[];
  bundles: Bundle[];
  askSlots: WeeklySlot[];
  askConsecutiveSessions: boolean;
  maxConsecutiveSessions: number;
  askDifferentDays: boolean;
  maxDifferentDays: number;
  askGroupTypes: boolean;
  groupTypes: string[];
  askCapabilities: boolean;
  capabilities: string[];
}
