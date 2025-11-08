import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../App';
import db from '../services/db';
import { Announcement, UserRole } from '../types';

const Announcements: React.FC = () => {
    const { currentUser } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Delete confirmation state
    const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);

    const fetchData = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        const data = await db.getAnnouncements(currentUser.churchId);
        setAnnouncements(data);
        setLoading(false);
    }, [currentUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const openModal = (mode: 'add' | 'edit', announcement: Announcement | null = null) => {
        setModalMode(mode);
        setCurrentAnnouncement(announcement);
        setTitle(announcement?.title || '');
        setContent(announcement?.content || '');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentAnnouncement(null);
        setTitle('');
        setContent('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !title.trim() || !content.trim()) {
            alert('Title and content cannot be empty.');
            return;
        }

        setIsSubmitting(true);
        if (modalMode === 'add') {
            await db.addAnnouncement(currentUser.churchId, title, content);
        } else if (currentAnnouncement) {
            await db.updateAnnouncement(currentAnnouncement.id, title, content);
        }
        setIsSubmitting(false);
        closeModal();
        fetchData();
    };
    
    const handleDelete = async () => {
        if (!announcementToDelete) return;
        await db.deleteAnnouncement(announcementToDelete.id);
        setAnnouncementToDelete(null);
        fetchData();
    };

    if (loading) {
        return <div className="text-center p-8">Loading announcements...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark-text">Announcements</h1>
                    <p className="text-light-text mt-1">
                        Welcome, {currentUser?.name}! Stay updated with the latest news.
                    </p>
                </div>
                {currentUser?.role === UserRole.SuperAdmin && (
                    <button 
                        onClick={() => openModal('add')}
                        className="mt-4 sm:mt-0 w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition"
                    >
                        Add New Announcement
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {announcements.length > 0 ? (
                    announcements.map(ann => (
                        <div key={ann.id} className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-semibold text-primary">{ann.title}</h3>
                                {currentUser?.role === UserRole.SuperAdmin && (
                                    <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                                        <button onClick={() => openModal('edit', ann)} className="text-sm font-medium text-blue-600 hover:text-blue-800">Edit</button>
                                        <button onClick={() => setAnnouncementToDelete(ann)} className="text-sm font-medium text-red-600 hover:text-red-800">Delete</button>
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Posted on: {ann.createdAt}</p>
                            <p className="mt-3 text-gray-700 whitespace-pre-wrap">{ann.content}</p>
                        </div>
                    ))
                ) : (
                    <div className="bg-white rounded-lg shadow-md p-6 text-center">
                        <p className="text-light-text">No announcements have been posted yet.</p>
                    </div>
                )}
            </div>
            
            {/* Add/Edit Modal */}
            {isModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                        <h3 className="text-lg font-medium text-dark-text mb-4">{modalMode === 'add' ? 'Add New Announcement' : 'Edit Announcement'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                                <input
                                    type="text"
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="content" className="block text-sm font-medium text-gray-700">Content</label>
                                <textarea
                                    id="content"
                                    rows={5}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                                    required
                                ></textarea>
                            </div>
                            <div className="flex items-center justify-end gap-4 mt-6">
                                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition disabled:bg-gray-400">
                                    {isSubmitting ? 'Saving...' : 'Save Announcement'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {announcementToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium text-dark-text">Confirm Deletion</h3>
                        <p className="mt-2 text-sm text-light-text">
                            Are you sure you want to delete the announcement "<strong>{announcementToDelete.title}</strong>"? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-4 mt-6">
                            <button onClick={() => setAnnouncementToDelete(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Cancel</button>
                            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Announcements;
