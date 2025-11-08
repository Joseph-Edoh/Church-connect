import { User, Church, UserRole, Unit, ActionItem, Report, FirstTimer, ActionStatus, Priority, FollowUpStatus, Announcement } from './types';

export const CHURCH_A_ID = 'church-a';
export const CHURCH_B_ID = 'church-b';

export const SIMULATED_CHURCHES: Church[] = [
  { id: CHURCH_A_ID, name: 'Church A - Grace Cathedral' },
  { id: CHURCH_B_ID, name: 'Church B - CityLight Chapel' },
];

export const SIMULATED_USERS: User[] = [
  // Church A Users
  { id: 'user-a-1', name: 'Pastor John (SA)', email: 'john@churcha.com', phone: '111-000-0001', password: 'password', role: UserRole.SuperAdmin, churchId: CHURCH_A_ID },
  { id: 'user-a-2', name: 'Mary (Choir Head)', email: 'mary@churcha.com', phone: '111-000-0002', password: 'password', role: UserRole.UnitHead, churchId: CHURCH_A_ID, unitId: 'unit-a-1' },
  { id: 'user-a-3', name: 'Peter (Ushering Head)', email: 'peter@churcha.com', phone: '111-000-0003', password: 'password', role: UserRole.UnitHead, churchId: CHURCH_A_ID, unitId: 'unit-a-2' },
  { id: 'user-a-4', name: 'Jane (First-Timer Logger)', email: 'jane@churcha.com', phone: '111-000-0004', password: 'password', role: UserRole.FirstTimerLogger, churchId: CHURCH_A_ID },
  { id: 'user-a-5', name: 'David (Member)', email: 'david@churcha.com', phone: '111-000-0005', password: 'password', role: UserRole.GeneralMember, churchId: CHURCH_A_ID, memberOfUnitIds: ['unit-a-1', 'unit-a-2'] },
  { id: 'user-a-6', name: 'Susan (Media Head)', email: 'susan@churcha.com', phone: '111-000-0006', password: 'password', role: UserRole.UnitHead, churchId: CHURCH_A_ID, unitId: 'unit-a-3' },
  { id: 'user-a-7', name: 'Mark (First-Timer Logger)', email: 'mark@churcha.com', phone: '111-000-0007', password: 'password', role: UserRole.FirstTimerLogger, churchId: CHURCH_A_ID },


  // Church B Users
  { id: 'user-b-1', name: 'Pastor Grace (SA)', email: 'grace@churchb.com', phone: '222-000-0001', password: 'password', role: UserRole.SuperAdmin, churchId: CHURCH_B_ID },
  { id: 'user-b-2', name: 'Luke (Welfare Head)', email: 'luke@churchb.com', phone: '222-000-0002', password: 'password', role: UserRole.UnitHead, churchId: CHURCH_B_ID, unitId: 'unit-b-1' },
  { id: 'user-b-3', name: 'Anne (Sanctuary Head)', email: 'anne@churchb.com', phone: '222-000-0003', password: 'password', role: UserRole.UnitHead, churchId: CHURCH_B_ID, unitId: 'unit-b-2' },
  { id: 'user-b-4', name: 'Paul (Greeter Logger)', email: 'paul@churchb.com', phone: '222-000-0004', password: 'password', role: UserRole.FirstTimerLogger, churchId: CHURCH_B_ID },
  { id: 'user-b-5', name: 'Esther (Member)', email: 'esther@churchb.com', phone: '222-000-0005', password: 'password', role: UserRole.GeneralMember, churchId: CHURCH_B_ID, memberOfUnitIds: ['unit-b-1'] },
];

export const SIMULATED_UNITS: Unit[] = [
    // Church A
    { id: 'unit-a-1', name: 'Choir', headId: 'user-a-2', churchId: CHURCH_A_ID },
    { id: 'unit-a-2', name: 'Ushering', headId: 'user-a-3', churchId: CHURCH_A_ID },
    { id: 'unit-a-3', name: 'Media', headId: 'user-a-6', churchId: CHURCH_A_ID },
    // Church B
    { id: 'unit-b-1', name: 'Welfare Department', headId: 'user-b-2', churchId: CHURCH_B_ID },
    { id: 'unit-b-2', name: 'Sanctuary Keepers', headId: 'user-b-3', churchId: CHURCH_B_ID },
];

export const SIMULATED_ACTION_ITEMS: ActionItem[] = [
    { id: 'act-a-1', description: 'Practice new song for Sunday service', executioner: 'Choir members', startDate: '2023-10-20', endDate: '2023-10-22', status: ActionStatus.Completed, priority: Priority.High, unitId: 'unit-a-1', churchId: CHURCH_A_ID },
    { id: 'act-a-2', description: 'Organize ushering positions for event', executioner: 'Peter', startDate: '2023-10-21', endDate: '2023-10-28', status: ActionStatus.InProgress, priority: Priority.Medium, unitId: 'unit-a-2', churchId: CHURCH_A_ID },
    { id: 'act-b-1', description: 'Prepare welfare packages for outreach', executioner: 'Luke & Team', startDate: '2023-11-01', endDate: '2023-11-10', status: ActionStatus.Planned, priority: Priority.Low, unitId: 'unit-b-1', churchId: CHURCH_B_ID },
];

export const SIMULATED_REPORTS: Report[] = [
    { id: 'rep-a-1', content: 'Choir practice went well. We are ready for Sunday.', weekEnding: '2023-10-22', submittedAt: '2023-10-21', reply: 'Great work team!', unitId: 'unit-a-1', churchId: CHURCH_A_ID },
    { id: 'rep-a-2', content: 'Ushers are briefed on the new seating arrangement.', weekEnding: '2023-10-22', submittedAt: '2023-10-20', unitId: 'unit-a-2', churchId: CHURCH_A_ID },
    { id: 'rep-b-1', content: 'Welfare planning session completed. Next step is purchasing items.', weekEnding: '2023-10-29', submittedAt: '2023-10-28', unitId: 'unit-b-1', churchId: CHURCH_B_ID },
];

export const SIMULATED_FIRST_TIMERS: FirstTimer[] = [
    { id: 'ft-a-1', name: 'Alice Wonderland', phone: '555-0101', loggedAt: '2023-10-22', churchId: CHURCH_A_ID, followUpStatus: FollowUpStatus.NeedsFollowUp },
    { id: 'ft-a-2', name: 'Bob Builder', phone: '555-0102', loggedAt: '2023-10-22', churchId: CHURCH_A_ID, followUpStatus: FollowUpStatus.Contacted, followUpDate: '2023-10-25', followUpNotes: 'Had a good conversation. Interested in the choir.' },
    { id: 'ft-b-1', name: 'Charlie Chocolate', phone: '555-0201', loggedAt: '2023-10-29', churchId: CHURCH_B_ID, followUpStatus: FollowUpStatus.Scheduled, followUpDate: '2023-11-05', followUpNotes: 'Scheduled a call for next Sunday afternoon.' },
];

export const SIMULATED_ANNOUNCEMENTS: Announcement[] = [
    {
        id: 'ann-a-1',
        title: 'Upcoming Event: Annual Conference',
        content: 'Our annual conference is scheduled for next month. All unit heads are requested to submit their action plans and reports on time.',
        createdAt: '2023-10-20',
        churchId: CHURCH_A_ID,
    },
    {
        id: 'ann-a-2',
        title: 'Weekly Service Reminder',
        content: 'Join us this Sunday for a powerful service. Service starts at 10 AM. Don\'t be late!',
        createdAt: '2023-10-21',
        churchId: CHURCH_A_ID,
    },
    {
        id: 'ann-b-1',
        title: 'Community Outreach Program',
        content: 'We will be having a community outreach program this Saturday. Volunteers are needed. Please see Deacon Luke.',
        createdAt: '2023-10-25',
        churchId: CHURCH_B_ID,
    },
];
