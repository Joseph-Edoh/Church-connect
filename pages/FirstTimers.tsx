import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../App';
import db from '../services/db';
import { FirstTimer, UserRole, FollowUpStatus } from '../types';

const FirstTimers: React.FC = () => {
    const { currentUser } = useAuth();
    const [firstTimers, setFirstTimers] = useState<FirstTimer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // State for the add form
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for the follow-up modal
    const [isEditing, setIsEditing] = useState(false);
    const [editingFirstTimer, setEditingFirstTimer] = useState<FirstTimer | null>(null);
    const [editStatus, setEditStatus] = useState<FollowUpStatus>(FollowUpStatus.NeedsFollowUp);
    const [editDate, setEditDate] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);


    const fetchData = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        const data = await db.getFirstTimers(currentUser.churchId);
        setFirstTimers(data.sort((a,b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()));
        setLoading(false);
    }, [currentUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleCancelAdd = () => {
        setIsAdding(false);
        setNewName('');
        setNewPhone('');
    };

    const handleAddFirstTimer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !newName || !newPhone) {
            alert("Please provide both name and phone number.");
            return;
        }

        setIsSubmitting(true);
        try {
            await db.addFirstTimer(currentUser.churchId, newName, newPhone);
            handleCancelAdd(); // This will hide form and reset fields
            fetchData(); // Refresh the list
        } catch (error) {
            console.error("Failed to add first timer", error);
            alert("An error occurred while adding the record. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status: FollowUpStatus) => {
        switch (status) {
            case FollowUpStatus.Contacted:
            case FollowUpStatus.JoinedUnit:
                return 'bg-green-100 text-green-800';
            case FollowUpStatus.Scheduled:
                return 'bg-blue-100 text-blue-800';
            case FollowUpStatus.NotInterested:
                return 'bg-red-100 text-red-800';
            case FollowUpStatus.NeedsFollowUp:
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleOpenEditModal = (ft: FirstTimer) => {
        setEditingFirstTimer(ft);
        setEditStatus(ft.followUpStatus);
        setEditDate(ft.followUpDate || '');
        setEditNotes(ft.followUpNotes || '');
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditingFirstTimer(null);
        setEditDate('');
        setEditNotes('');
        setEditStatus(FollowUpStatus.NeedsFollowUp);
    };

    const handleUpdateFollowUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingFirstTimer) return;

        setIsUpdating(true);
        await db.updateFirstTimerFollowUp(editingFirstTimer.id, {
            status: editStatus,
            date: editDate,
            notes: editNotes
        });
        setIsUpdating(false);
        handleCancelEdit();
        fetchData();
    };


    const filteredFirstTimers = useMemo(() => {
        return firstTimers.filter(ft => 
            ft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ft.phone.includes(searchTerm)
        );
    }, [firstTimers, searchTerm]);

    const canAddFirstTimer = currentUser?.role === UserRole.FirstTimerLogger || currentUser?.role === UserRole.SuperAdmin;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md sm:flex sm:items-center sm:justify-between">
                 <div>
                    <h1 className="text-2xl font-bold text-dark-text">First-Timer Documentation</h1>
                    <p className="text-light-text mt-1">Record and manage follow-up for new visitors.</p>
                 </div>
                 {canAddFirstTimer && !isAdding && (
                     <button 
                        onClick={() => setIsAdding(true)}
                        className="mt-4 sm:mt-0 w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition"
                    >
                        Add First-Timer
                    </button>
                 )}
            </div>

            {isAdding && canAddFirstTimer && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-dark-text mb-4">Add New First-Timer</h2>
                    <form onSubmit={handleAddFirstTimer}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="newName" className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input 
                                    id="newName"
                                    className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:ring-primary focus:border-primary" 
                                    type="text" 
                                    placeholder="e.g., Jane Doe" 
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    required 
                                />
                            </div>
                            <div>
                                <label htmlFor="newPhone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                                <input
                                    id="newPhone"
                                    className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:ring-primary focus:border-primary" 
                                    type="tel" 
                                    placeholder="e.g., 555-123-4567" 
                                    value={newPhone}
                                    onChange={e => setNewPhone(e.target.value)}
                                    required 
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-4 mt-6">
                            <button type="button" onClick={handleCancelAdd} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Cancel</button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Adding...' : 'Add Record'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md">
                 <div className="p-4 border-b">
                     <input 
                        type="text" 
                        placeholder="Search by name or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    />
                 </div>
                 {loading ? <p className="p-4">Loading...</p> : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone Number</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Logged</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Follow-up Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredFirstTimers.map(ft => (
                                        <tr key={ft.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ft.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ft.phone}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ft.loggedAt}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ft.followUpStatus)}`}>
                                                    {ft.followUpStatus}
                                                </span>
                                                {ft.followUpDate && <p className="text-xs text-gray-400">on {ft.followUpDate}</p>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                                                <button onClick={() => handleOpenEditModal(ft)} className="text-primary hover:text-primary-dark">Update</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                         {/* Mobile Cards */}
                        <div className="md:hidden p-4 space-y-4">
                             {filteredFirstTimers.map(ft => (
                                <div key={ft.id} className="bg-gray-50 rounded-lg p-4 shadow">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-dark-text">{ft.name}</p>
                                        <button onClick={() => handleOpenEditModal(ft)} className="text-sm font-medium text-primary hover:text-primary-dark flex-shrink-0 ml-4">Update</button>
                                    </div>
                                    <p className="text-sm text-light-text mt-2"><strong>Phone:</strong> {ft.phone}</p>
                                    <p className="text-sm text-light-text mt-1"><strong>Logged:</strong> {ft.loggedAt}</p>
                                     <div className="mt-3">
                                        <p className="text-sm text-light-text flex items-center flex-wrap">
                                            <strong>Status:</strong>
                                            <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ft.followUpStatus)}`}>
                                                {ft.followUpStatus}
                                            </span>
                                            {ft.followUpDate && <span className="text-xs text-gray-500 ml-2">(on {ft.followUpDate})</span>}
                                        </p>
                                        {ft.followUpNotes && <p className="text-xs text-gray-500 mt-1 italic">Notes: {ft.followUpNotes}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                 )}
            </div>

            {isEditing && editingFirstTimer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                        <h3 className="text-lg font-medium text-dark-text mb-4">Update Follow-up for {editingFirstTimer.name}</h3>
                        <form onSubmit={handleUpdateFollowUp} className="space-y-4">
                            <div>
                                <label htmlFor="followUpStatus" className="block text-sm font-medium text-gray-700">Follow-up Status</label>
                                <select
                                    id="followUpStatus"
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value as FollowUpStatus)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-white text-dark-text"
                                >
                                    {Object.values(FollowUpStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="followUpDate" className="block text-sm font-medium text-gray-700">Follow-up Date (Optional)</label>
                                <input
                                    type="date"
                                    id="followUpDate"
                                    value={editDate}
                                    onChange={(e) => setEditDate(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                                />
                            </div>
                            <div>
                                <label htmlFor="followUpNotes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                                <textarea
                                    id="followUpNotes"
                                    rows={3}
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                                    placeholder="e.g., Called, no answer. Left voicemail."
                                ></textarea>
                            </div>
                            <div className="flex items-center justify-end gap-4 mt-6">
                                <button type="button" onClick={handleCancelEdit} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Cancel</button>
                                <button type="submit" disabled={isUpdating} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition disabled:bg-gray-400">
                                    {isUpdating ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FirstTimers;