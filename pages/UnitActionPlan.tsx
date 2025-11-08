import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../App';
import db from '../services/db';
import { ActionItem, Unit, UserRole, ActionStatus, Priority } from '../types';
import { SIMULATED_UNITS } from '../constants';

const UnitActionPlan: React.FC = () => {
    const { currentUser } = useAuth();
    const [actionItems, setActionItems] = useState<ActionItem[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedUnitId, setSelectedUnitId] = useState<string>('');
    const [loading, setLoading] = useState(true);

    // State for adding a new action item
    const [isAdding, setIsAdding] = useState(false);
    const [newDescription, setNewDescription] = useState('');
    const [newExecutioner, setNewExecutioner] = useState('');
    const [newStartDate, setNewStartDate] = useState('');
    const [newEndDate, setNewEndDate] = useState('');
    const [newPriority, setNewPriority] = useState<Priority>(Priority.Medium);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for editing an action item
    const [isEditing, setIsEditing] = useState(false);
    const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
    const [editDescription, setEditDescription] = useState('');
    const [editExecutioner, setEditExecutioner] = useState('');
    const [editStartDate, setEditStartDate] = useState('');
    const [editEndDate, setEditEndDate] = useState('');
    const [editStatus, setEditStatus] = useState<ActionStatus>(ActionStatus.Planned);
    const [editPriority, setEditPriority] = useState<Priority>(Priority.Medium);

    const getStatusColor = (status: ActionStatus) => {
        switch (status) {
            case ActionStatus.Completed: return 'bg-green-100 text-green-800';
            case ActionStatus.InProgress: return 'bg-blue-100 text-blue-800';
            case ActionStatus.Blocked: return 'bg-red-100 text-red-800';
            case ActionStatus.Planned: return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: Priority) => {
        switch (priority) {
            case Priority.High: return 'bg-red-100 text-red-800';
            case Priority.Medium: return 'bg-yellow-100 text-yellow-800';
            case Priority.Low: return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const fetchData = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);

        let currentSelectedUnit = selectedUnitId;

        if (currentUser.role === UserRole.SuperAdmin) {
            const dbUnits = await db.getUnits(currentUser.churchId);
            setUnits(dbUnits);
            if (dbUnits.length > 0 && !currentSelectedUnit) {
                currentSelectedUnit = dbUnits[0].id;
                setSelectedUnitId(dbUnits[0].id);
            }
        } else if (currentUser.unitId) {
            setUnits(SIMULATED_UNITS.filter(u => u.id === currentUser.unitId));
            currentSelectedUnit = currentUser.unitId;
            setSelectedUnitId(currentUser.unitId);
        }

        if (currentSelectedUnit) {
            const items = await db.getActionItems(currentUser.churchId, currentSelectedUnit);
            setActionItems(items);
        } else {
            setActionItems([]);
        }

        setLoading(false);
    }, [currentUser, selectedUnitId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleAddNewAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !selectedUnitId || !newDescription || !newExecutioner || !newStartDate || !newEndDate) {
            alert("Please fill all fields.");
            return;
        }
        setIsSubmitting(true);
        await db.addActionItem(currentUser.churchId, selectedUnitId, {
            description: newDescription,
            executioner: newExecutioner,
            startDate: newStartDate,
            endDate: newEndDate,
            status: ActionStatus.Planned,
            priority: newPriority,
        });

        handleCancelAdd();
        setIsSubmitting(false);
        fetchData();
    };

    const handleCancelAdd = () => {
        setIsAdding(false);
        setNewDescription('');
        setNewExecutioner('');
        setNewStartDate('');
        setNewEndDate('');
        setNewPriority(Priority.Medium);
    }

    // --- Edit Logic ---
    const handleOpenEditModal = (item: ActionItem) => {
        setEditingItem(item);
        setEditDescription(item.description);
        setEditExecutioner(item.executioner);
        setEditStartDate(item.startDate);
        setEditEndDate(item.endDate);
        setEditStatus(item.status);
        setEditPriority(item.priority);
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditingItem(null);
    };

    const handleUpdateAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        setIsSubmitting(true);
        await db.updateActionItem(editingItem.id, {
            description: editDescription,
            executioner: editExecutioner,
            startDate: editStartDate,
            endDate: editEndDate,
            status: editStatus,
            priority: editPriority,
        });
        setIsSubmitting(false);
        handleCancelEdit();
        fetchData();
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="md:flex md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-dark-text">Unit Action Plan</h1>
                        <p className="text-light-text mt-1">Track tasks and progress for your unit.</p>
                    </div>
                     <div className="mt-4 md:mt-0">
                         {(currentUser?.role === UserRole.UnitHead || currentUser?.role === UserRole.SuperAdmin) && (
                            <button 
                                onClick={() => setIsAdding(true)} 
                                disabled={(currentUser?.role === UserRole.SuperAdmin && !selectedUnitId) || isAdding}
                                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                Add New Action
                            </button>
                         )}
                    </div>
                </div>

                {currentUser?.role === UserRole.SuperAdmin && units.length > 0 && (
                    <div className="mt-4">
                        <label htmlFor="unit-select" className="block text-sm font-medium text-gray-700">Select Unit</label>
                        <select
                            id="unit-select"
                            value={selectedUnitId}
                            onChange={(e) => setSelectedUnitId(e.target.value)}
                            className="mt-1 block w-full md:w-1/3 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md text-dark-text"
                        >
                            {units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {loading ? (<p>Loading...</p>) : actionItems.length === 0 ? (
                <div className="bg-white p-6 rounded-lg shadow-md text-center text-light-text">
                    No action items found for this unit.
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Executioner</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {actionItems.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-normal text-sm font-medium text-gray-900">{item.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.executioner}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.startDate} to {item.endDate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(item.priority)}`}>
                                                {item.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                                            <button onClick={() => handleOpenEditModal(item)} className="text-primary hover:text-primary-dark">Edit</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Mobile Cards */}
                    <div className="md:hidden p-4 space-y-4">
                        {actionItems.map(item => (
                            <div key={item.id} className="bg-gray-50 rounded-lg p-4 shadow">
                                <p className="font-bold text-dark-text">{item.description}</p>
                                <p className="text-sm text-light-text mt-2"><strong>By:</strong> {item.executioner}</p>
                                <p className="text-sm text-light-text mt-1"><strong>Due:</strong> {item.endDate}</p>
                                <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                                            {item.status}
                                        </span>
                                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(item.priority)}`}>
                                            {item.priority}
                                        </span>
                                    </div>
                                    <button onClick={() => handleOpenEditModal(item)} className="text-sm font-medium text-primary hover:text-primary-dark">Edit</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Action Item Modal */}
            {isAdding && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                        <h3 className="text-lg font-medium text-dark-text mb-4">Add New Action Item for {units.find(u => u.id === selectedUnitId)?.name}</h3>
                        <form onSubmit={handleAddNewAction} className="space-y-4">
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea id="description" value={newDescription} onChange={e => setNewDescription(e.target.value)} required rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"></textarea>
                            </div>
                             <div>
                                <label htmlFor="executioner" className="block text-sm font-medium text-gray-700">Executioner(s)</label>
                                <input type="text" id="executioner" value={newExecutioner} onChange={e => setNewExecutioner(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" placeholder="e.g., John Doe, Jane Smith"/>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                                    <input type="date" id="startDate" value={newStartDate} onChange={e => setNewStartDate(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"/>
                                </div>
                                <div>
                                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
                                    <input type="date" id="endDate" value={newEndDate} onChange={e => setNewEndDate(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"/>
                                </div>
                            </div>
                             <div>
                                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                                <select id="priority" value={newPriority} onChange={e => setNewPriority(e.target.value as Priority)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-white text-dark-text">
                                    {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center justify-end gap-4 mt-6">
                                <button type="button" onClick={handleCancelAdd} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition disabled:bg-gray-400">
                                    {isSubmitting ? 'Saving...' : 'Save Action'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Action Item Modal */}
            {isEditing && editingItem && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                        <h3 className="text-lg font-medium text-dark-text mb-4">Edit Action Item</h3>
                        <form onSubmit={handleUpdateAction} className="space-y-4">
                            <div>
                                <label htmlFor="edit_description" className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea id="edit_description" value={editDescription} onChange={e => setEditDescription(e.target.value)} required rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"></textarea>
                            </div>
                             <div>
                                <label htmlFor="edit_executioner" className="block text-sm font-medium text-gray-700">Executioner(s)</label>
                                <input type="text" id="edit_executioner" value={editExecutioner} onChange={e => setEditExecutioner(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="edit_startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                                    <input type="date" id="edit_startDate" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"/>
                                </div>
                                <div>
                                    <label htmlFor="edit_endDate" className="block text-sm font-medium text-gray-700">End Date</label>
                                    <input type="date" id="edit_endDate" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"/>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="edit_priority" className="block text-sm font-medium text-gray-700">Priority</label>
                                    <select id="edit_priority" value={editPriority} onChange={e => setEditPriority(e.target.value as Priority)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-white text-dark-text">
                                        {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="edit_status" className="block text-sm font-medium text-gray-700">Status</label>
                                    <select id="edit_status" value={editStatus} onChange={e => setEditStatus(e.target.value as ActionStatus)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-white text-dark-text">
                                        {Object.values(ActionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-4 mt-6">
                                <button type="button" onClick={handleCancelEdit} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition disabled:bg-gray-400">
                                    {isSubmitting ? 'Updating...' : 'Update Action'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnitActionPlan;