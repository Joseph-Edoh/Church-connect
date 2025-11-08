import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../App';
import db from '../services/db';
import { User, Unit, UserRole } from '../types';

const Configuration: React.FC = () => {
    const { currentUser } = useAuth();
    const [units, setUnits] = useState<Unit[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // State for the "Add Unit" form
    const [isAddingUnit, setIsAddingUnit] = useState(false);
    const [newUnitName, setNewUnitName] = useState('');
    const [newUnitHeadId, setNewUnitHeadId] = useState('');

    // State for the "Edit Unit" modal
    const [isEditingUnit, setIsEditingUnit] = useState(false);
    const [currentUnit, setCurrentUnit] = useState<Unit | null>(null);
    const [editUnitName, setEditUnitName] = useState('');
    const [editUnitHeadId, setEditUnitHeadId] = useState('');

    // State for the "Delete Unit" confirmation
    const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);


    const fetchData = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        const [dbUnits, dbUsers] = await Promise.all([
            db.getUnits(currentUser.churchId),
            db.getUsers(currentUser.churchId)
        ]);
        setUnits(dbUnits);
        setUsers(dbUsers.sort((a,b) => a.name.localeCompare(b.name)));
        setLoading(false);
    }, [currentUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleToggleLogger = async (userId: string, isLogger: boolean) => {
        await db.updateUserRole(userId, isLogger);
        fetchData();
    };

    const handleAddUnit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !newUnitName) {
            alert('Please provide a unit name.');
            return;
        }
        await db.addUnit(currentUser.churchId, newUnitName, newUnitHeadId);
        // Reset form and refetch data
        setNewUnitName('');
        setNewUnitHeadId('');
        setIsAddingUnit(false);
        fetchData();
    };

    const handleCancelAddUnit = () => {
        setNewUnitName('');
        setNewUnitHeadId('');
        setIsAddingUnit(false);
    };

    // --- Edit Unit Logic ---
    const handleOpenEditModal = (unit: Unit) => {
        setCurrentUnit(unit);
        setEditUnitName(unit.name);
        setEditUnitHeadId(unit.headId || '');
        setIsEditingUnit(true);
    };

    const handleCancelEdit = () => {
        setIsEditingUnit(false);
        setCurrentUnit(null);
        setEditUnitName('');
        setEditUnitHeadId('');
    };

    const handleUpdateUnit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUnit || !editUnitName) return;

        await db.updateUnit(currentUnit.id, editUnitName, editUnitHeadId);
        handleCancelEdit();
        fetchData();
    };

    // --- Delete Unit Logic ---
    const handleOpenDeleteConfirm = (unit: Unit) => {
        setUnitToDelete(unit);
    };

    const handleCancelDelete = () => {
        setUnitToDelete(null);
    };

    const handleDeleteUnit = async () => {
        if (!unitToDelete) return;
        await db.deleteUnit(unitToDelete.id);
        handleCancelDelete();
        fetchData();
    };


    const potentialAddUnitHeads = useMemo(() => {
        return users.filter(user => user.role !== UserRole.SuperAdmin && user.role !== UserRole.UnitHead);
    }, [users]);
    
    const potentialEditUnitHeads = useMemo(() => {
        if (!currentUnit) return [];
        // Eligible users are members of the unit (who are not super admins), plus the current head of the unit.
        return users.filter(user => 
            user.role !== UserRole.SuperAdmin &&
            (user.memberOfUnitIds?.includes(currentUnit.id) || user.id === currentUnit.headId)
        );
    }, [users, currentUnit]);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-dark-text">Church Configuration</h1>
                <p className="text-light-text mt-1">Manage units and user roles for your church.</p>
            </div>

            {/* Manage Units (Add/Edit/Delete) */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="sm:flex sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-dark-text">Manage Units</h2>
                    {!isAddingUnit && (
                         <button onClick={() => setIsAddingUnit(true)} className="mt-4 sm:mt-0 w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition">Add New Unit</button>
                    )}
                </div>
                
                <div className="overflow-x-auto mt-4">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Head</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {units.map(unit => (
                                <tr key={unit.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{unit.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{users.find(u => u.id === unit.headId)?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                                        <button onClick={() => handleOpenEditModal(unit)} className="text-primary hover:text-primary-dark">Edit</button>
                                        <button onClick={() => handleOpenDeleteConfirm(unit)} className="ml-4 text-red-600 hover:text-red-800">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 
                {isAddingUnit && (
                    <form onSubmit={handleAddUnit} className="mt-6 pt-6 border-t border-gray-200">
                        <h3 className="text-lg font-medium text-dark-text mb-4">Add a New Unit</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="unitName" className="block text-sm font-medium text-gray-700">Unit Name</label>
                                <input
                                    type="text"
                                    id="unitName"
                                    value={newUnitName}
                                    onChange={(e) => setNewUnitName(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                                    required
                                    placeholder="e.g., Welfare Department"
                                />
                            </div>
                            <div>
                                <label htmlFor="unitHead" className="block text-sm font-medium text-gray-700">Assign Unit Head</label>
                                <select
                                    id="unitHead"
                                    value={newUnitHeadId}
                                    onChange={(e) => setNewUnitHeadId(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-white text-dark-text"
                                >
                                    <option value="">No Unit Head (Optional)</option>
                                    {potentialAddUnitHeads.map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-4 mt-6">
                            <button type="button" onClick={handleCancelAddUnit} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition">Save Unit</button>
                        </div>
                    </form>
                )}
            </div>

            {/* Manage First-Timer Loggers */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-dark-text mb-4">Manage First-Timer Loggers</h2>
                <div className="space-y-4">
                    {users
                        .filter(user => user.role !== UserRole.SuperAdmin && user.role !== UserRole.UnitHead)
                        .map(user => (
                            <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                <div>
                                    <p className="font-medium text-dark-text">{user.name}</p>
                                    <p className="text-sm text-light-text">{user.role}</p>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-sm mr-3 font-medium text-gray-900">Assign as Logger</span>
                                    <label htmlFor={`toggle-${user.id}`} className="inline-flex relative items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            id={`toggle-${user.id}`}
                                            className="sr-only peer"
                                            checked={user.role === UserRole.FirstTimerLogger}
                                            onChange={(e) => handleToggleLogger(user.id, e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            {/* Edit Unit Modal */}
            {isEditingUnit && currentUnit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                        <h3 className="text-lg font-medium text-dark-text mb-4">Edit Unit: {currentUnit.name}</h3>
                        <form onSubmit={handleUpdateUnit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="editUnitName" className="block text-sm font-medium text-gray-700">Unit Name</label>
                                    <input
                                        type="text"
                                        id="editUnitName"
                                        value={editUnitName}
                                        onChange={(e) => setEditUnitName(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="editUnitHead" className="block text-sm font-medium text-gray-700">Assign Unit Head</label>
                                    <select
                                        id="editUnitHead"
                                        value={editUnitHeadId}
                                        onChange={(e) => setEditUnitHeadId(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-white text-dark-text"
                                    >
                                        <option value="">No Unit Head (Optional)</option>
                                        {potentialEditUnitHeads.map(user => (
                                            <option key={user.id} value={user.id}>{user.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-4 mt-6">
                                <button type="button" onClick={handleCancelEdit} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition">Update Unit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Unit Confirmation Modal */}
            {unitToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium text-dark-text">Confirm Deletion</h3>
                        <p className="mt-2 text-sm text-light-text">
                            Are you sure you want to delete the unit "<strong>{unitToDelete.name}</strong>"? This action will remove the Unit Head role from the assigned user and cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-4 mt-6">
                            <button onClick={handleCancelDelete} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Cancel</button>
                            <button onClick={handleDeleteUnit} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition">Delete Unit</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Configuration;