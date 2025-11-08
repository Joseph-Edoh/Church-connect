import { 
    SIMULATED_USERS, 
    SIMULATED_UNITS, 
    SIMULATED_ACTION_ITEMS, 
    SIMULATED_REPORTS, 
    SIMULATED_FIRST_TIMERS,
    SIMULATED_CHURCHES,
    SIMULATED_ANNOUNCEMENTS
} from '../constants';
// FIX: Import UserRole to use enum values instead of string literals.
import { User, Unit, ActionItem, Report, FirstTimer, ActionStatus, UserRole, Church, FollowUpStatus, Announcement } from '../types';

// In-memory database
let users = [...SIMULATED_USERS];
let units = [...SIMULATED_UNITS];
let actionItems = [...SIMULATED_ACTION_ITEMS];
let reports = [...SIMULATED_REPORTS];
let firstTimers = [...SIMULATED_FIRST_TIMERS];
let churches = [...SIMULATED_CHURCHES];
let announcements = [...SIMULATED_ANNOUNCEMENTS];

const db = {
    // Church Management
    getChurches: (): Promise<Church[]> => Promise.resolve(churches),
    addChurch: (name: string): Promise<Church> => {
        const newChurch: Church = {
            id: `church-${Date.now()}`,
            name,
        };
        churches.push(newChurch);
        return Promise.resolve(newChurch);
    },

    // User Management
    getUsers: (churchId: string): Promise<User[]> => Promise.resolve(users.filter(u => u.churchId === churchId)),
    getUser: (userId: string): Promise<User | undefined> => Promise.resolve(users.find(u => u.id === userId)),
    addUser: (churchId: string, name: string, phone: string, email: string, password: string, role: UserRole, memberOfUnitIds?: string[]): Promise<User> => {
        const newUser: User = {
            id: `user-${Date.now()}`,
            name,
            phone,
            email,
            password,
            role,
            churchId,
        };
        if (memberOfUnitIds) {
            newUser.memberOfUnitIds = memberOfUnitIds;
        }
        users.push(newUser);
        return Promise.resolve(newUser);
    },
    authenticateUser: (churchId: string, email: string, password: string): Promise<User | null> => {
        const user = users.find(u => u.churchId === churchId && u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        return Promise.resolve(user || null);
    },
    updateUserRole: (userId: string, isLogger: boolean): Promise<User | undefined> => {
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1 && users[userIndex].role !== UserRole.SuperAdmin && users[userIndex].role !== UserRole.UnitHead) {
            // FIX: Use UserRole enum instead of string literal to prevent type errors.
            users[userIndex].role = isLogger ? UserRole.FirstTimerLogger : UserRole.GeneralMember;
            return Promise.resolve(users[userIndex]);
        }
        return Promise.resolve(undefined);
    },

    // Unit Management
    getUnits: (churchId: string): Promise<Unit[]> => Promise.resolve(units.filter(u => u.churchId === churchId)),
    addUnit: (churchId: string, name: string, headId?: string): Promise<Unit> => {
        const newUnit: Unit = {
            id: `unit-${Date.now()}`,
            name,
            churchId
        };

        if (headId) {
            newUnit.headId = headId;
            const userIndex = users.findIndex(u => u.id === headId);
            if (userIndex !== -1) {
                users[userIndex].role = UserRole.UnitHead;
                users[userIndex].unitId = newUnit.id;
            }
        }
        
        units.push(newUnit);
        return Promise.resolve(newUnit);
    },
    updateUnit: (unitId: string, name: string, headId?: string): Promise<Unit | undefined> => {
        const unitIndex = units.findIndex(u => u.id === unitId);
        if(unitIndex === -1) return Promise.resolve(undefined);
        
        const currentUnit = units[unitIndex];
        const oldHeadId = currentUnit.headId;
        
        if(oldHeadId !== headId) {
            // Demote old head if there was one
            if (oldHeadId) {
                const oldHeadUserIndex = users.findIndex(u => u.id === oldHeadId);
                if(oldHeadUserIndex !== -1) {
                    users[oldHeadUserIndex].role = UserRole.GeneralMember;
                    delete users[oldHeadUserIndex].unitId;
                }
            }
            // Promote new head if one is assigned
            if (headId) {
                const newHeadUserIndex = users.findIndex(u => u.id === headId);
                if(newHeadUserIndex !== -1) {
                    users[newHeadUserIndex].role = UserRole.UnitHead;
                    users[newHeadUserIndex].unitId = unitId;
                }
            }
        }
        
        // Update the unit object
        currentUnit.name = name;
        if (headId) {
            currentUnit.headId = headId;
        } else {
            delete currentUnit.headId;
        }

        return Promise.resolve(currentUnit);
    },
    deleteUnit: (unitId: string): Promise<boolean> => {
        const unitIndex = units.findIndex(u => u.id === unitId);
        if (unitIndex === -1) return Promise.resolve(false);

        const headId = units[unitIndex].headId;
        if (headId) {
            const userIndex = users.findIndex(u => u.id === headId);
            if (userIndex !== -1) {
                users[userIndex].role = UserRole.GeneralMember;
                delete users[userIndex].unitId;
            }
        }

        units = units.filter(u => u.id !== unitId);
        return Promise.resolve(true);
    },

    // Action Items
    getActionItems: (churchId: string, unitId: string): Promise<ActionItem[]> => Promise.resolve(actionItems.filter(a => a.churchId === churchId && a.unitId === unitId)),
    addActionItem: (churchId: string, unitId: string, item: Omit<ActionItem, 'id'|'churchId'|'unitId'>): Promise<ActionItem> => {
        const newActionItem: ActionItem = {
            id: `act-${Date.now()}`,
            ...item,
            churchId,
            unitId,
        };
        actionItems.push(newActionItem);
        return Promise.resolve(newActionItem);
    },
    updateActionItem: (itemId: string, updates: Partial<Omit<ActionItem, 'id' | 'churchId' | 'unitId'>>): Promise<ActionItem | undefined> => {
        const itemIndex = actionItems.findIndex(i => i.id === itemId);
        if (itemIndex !== -1) {
            actionItems[itemIndex] = { ...actionItems[itemIndex], ...updates };
            return Promise.resolve(actionItems[itemIndex]);
        }
        return Promise.resolve(undefined);
    },

    // Reports
    getReports: (churchId: string, unitId?: string): Promise<Report[]> => {
        let results = reports.filter(r => r.churchId === churchId);
        if(unitId) {
            results = results.filter(r => r.unitId === unitId);
        }
        return Promise.resolve(results.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
    },
    addReport: (churchId: string, unitId: string, content: string): Promise<Report> => {
         const getWeekEndingDate = () => {
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
            const diff = 7 - dayOfWeek;
            const nextSunday = new Date(today);
            nextSunday.setDate(today.getDate() + (dayOfWeek === 0 ? 0 : diff));
            return nextSunday.toISOString().split('T')[0];
        };
        const newReport: Report = {
            id: `rep-${Date.now()}`,
            content,
            weekEnding: getWeekEndingDate(),
            submittedAt: new Date().toISOString().split('T')[0],
            unitId,
            churchId
        };
        reports.push(newReport);
        return Promise.resolve(newReport);
    },
    addReportReply: (reportId: string, reply: string): Promise<Report | undefined> => {
        const reportIndex = reports.findIndex(r => r.id === reportId);
        if (reportIndex !== -1) {
            reports[reportIndex].reply = reply;
            return Promise.resolve(reports[reportIndex]);
        }
        return Promise.resolve(undefined);
    },
    
    // First Timers
    getFirstTimers: (churchId: string): Promise<FirstTimer[]> => Promise.resolve(firstTimers.filter(ft => ft.churchId === churchId)),
    addFirstTimer: (churchId: string, name: string, phone: string): Promise<FirstTimer> => {
        const newFirstTimer: FirstTimer = {
            id: `ft-${Date.now()}`,
            name,
            phone,
            loggedAt: new Date().toISOString().split('T')[0],
            churchId,
            followUpStatus: FollowUpStatus.NeedsFollowUp,
        };
        firstTimers.push(newFirstTimer);
        return Promise.resolve(newFirstTimer);
    },
    updateFirstTimerFollowUp: (firstTimerId: string, updates: { status: FollowUpStatus; date?: string; notes?: string; }): Promise<FirstTimer | undefined> => {
        const itemIndex = firstTimers.findIndex(i => i.id === firstTimerId);
        if (itemIndex !== -1) {
            firstTimers[itemIndex].followUpStatus = updates.status;
            firstTimers[itemIndex].followUpDate = updates.date;
            firstTimers[itemIndex].followUpNotes = updates.notes;
            return Promise.resolve(firstTimers[itemIndex]);
        }
        return Promise.resolve(undefined);
    },

    // Announcements
    getAnnouncements: (churchId: string): Promise<Announcement[]> => {
        const results = announcements.filter(a => a.churchId === churchId);
        return Promise.resolve(results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    },
    addAnnouncement: (churchId: string, title: string, content: string): Promise<Announcement> => {
        const newAnnouncement: Announcement = {
            id: `ann-${Date.now()}`,
            title,
            content,
            createdAt: new Date().toISOString().split('T')[0],
            churchId,
        };
        announcements.unshift(newAnnouncement);
        return Promise.resolve(newAnnouncement);
    },
    updateAnnouncement: (announcementId: string, title: string, content: string): Promise<Announcement | undefined> => {
        const annIndex = announcements.findIndex(a => a.id === announcementId);
        if (annIndex !== -1) {
            announcements[annIndex].title = title;
            announcements[annIndex].content = content;
            return Promise.resolve(announcements[annIndex]);
        }
        return Promise.resolve(undefined);
    },
    deleteAnnouncement: (announcementId: string): Promise<boolean> => {
        const initialLength = announcements.length;
        announcements = announcements.filter(a => a.id !== announcementId);
        return Promise.resolve(announcements.length < initialLength);
    },
};

export default db;