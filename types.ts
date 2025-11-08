export enum UserRole {
  SuperAdmin = 'Super Admin',
  UnitHead = 'Unit Head',
  FirstTimerLogger = 'First-Timer Logger',
  GeneralMember = 'General Member',
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string; // Should be hashed in a real app
  role: UserRole;
  churchId: string;
  unitId?: string; // Only for Unit Heads
  memberOfUnitIds?: string[]; // For General Members belonging to units
}

export interface Church {
  id: string;
  name: string;
}

export interface Unit {
  id: string;
  name: string;
  headId?: string;
  churchId: string;
}

export enum ActionStatus {
  Planned = 'Planned',
  InProgress = 'In Progress',
  Completed = 'Completed',
  Blocked = 'Blocked',
}

export enum Priority {
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

export interface ActionItem {
  id: string;
  description: string;
  executioner: string;
  startDate: string;
  endDate: string;
  status: ActionStatus;
  priority: Priority;
  unitId: string;
  churchId: string;
}

export interface Report {
  id: string;
  content: string;
  weekEnding: string;
  submittedAt: string;
  reply?: string;
  unitId: string;
  churchId: string;
}

export enum FollowUpStatus {
    NeedsFollowUp = 'Needs Follow-up',
    Scheduled = 'Follow-up Scheduled',
    Contacted = 'Contacted',
    JoinedUnit = 'Joined Unit',
    NotInterested = 'Not Interested',
}

export interface FirstTimer {
  id: string;
  name: string;
  phone: string;
  loggedAt: string;
  churchId: string;
  followUpStatus: FollowUpStatus;
  followUpDate?: string;
  followUpNotes?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  churchId: string;
}
