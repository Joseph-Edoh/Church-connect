
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../App';
import db from '../services/db';
import { Report, Unit, UserRole } from '../types';

const UnitReports: React.FC = () => {
    const { currentUser } = useAuth();
    const [reports, setReports] = useState<Report[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedUnitId, setSelectedUnitId] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [newReportContent, setNewReportContent] = useState('');
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);

    const unitMap = useMemo(() => new Map(units.map(u => [u.id, u.name])), [units]);

    const fetchData = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);

        const dbUnits = await db.getUnits(currentUser.churchId);
        setUnits(dbUnits);

        let dbReports: Report[];
        if (currentUser.role === UserRole.SuperAdmin) {
            dbReports = await db.getReports(currentUser.churchId, selectedUnitId === 'all' ? undefined : selectedUnitId);
        } else if (currentUser.unitId) {
            dbReports = await db.getReports(currentUser.churchId, currentUser.unitId);
        } else {
            dbReports = [];
        }
        setReports(dbReports);
        
        setLoading(false);
    }, [currentUser, selectedUnitId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddReply = async (reportId: string) => {
        await db.addReportReply(reportId, replyContent);
        setReplyingTo(null);
        setReplyContent('');
        fetchData();
    };

    const handleSubmitReport = async () => {
        if (!currentUser?.unitId || !newReportContent.trim()) {
            alert('Please enter your report content.');
            return;
        }
        setIsSubmittingReport(true);
        await db.addReport(currentUser.churchId, currentUser.unitId, newReportContent);
        setNewReportContent('');
        setIsSubmittingReport(false);
        fetchData();
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-dark-text">Weekly Unit Reports</h1>
                <p className="text-light-text mt-1">
                    {currentUser?.role === UserRole.UnitHead 
                        ? "Submit your weekly report here." 
                        : "Review reports submitted by units."}
                </p>
                {currentUser?.role === UserRole.SuperAdmin && units.length > 0 && (
                    <div className="mt-4">
                        <label htmlFor="unit-filter" className="block text-sm font-medium text-gray-700">Filter by Unit</label>
                        <select
                            id="unit-filter"
                            value={selectedUnitId}
                            onChange={(e) => setSelectedUnitId(e.target.value)}
                            className="mt-1 block w-full md:w-1/3 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md text-dark-text"
                        >
                            <option value="all">All Units</option>
                            {units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {currentUser?.role === UserRole.UnitHead && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-dark-text mb-4">Submit New Report</h2>
                    <textarea 
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary" 
                        rows={4}
                        placeholder="Enter your report content..."
                        value={newReportContent}
                        onChange={(e) => setNewReportContent(e.target.value)}
                        disabled={isSubmittingReport}
                    ></textarea>
                    <button 
                        onClick={handleSubmitReport}
                        disabled={isSubmittingReport}
                        className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                    </button>
                </div>
            )}
            
            <div className="space-y-4">
                {loading ? <p>Loading reports...</p> : reports.map(report => (
                    <div key={report.id} className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-start">
                           <div>
                             <p className="font-bold text-dark-text">{unitMap.get(report.unitId) || 'Unknown Unit'}</p>
                             <p className="text-sm text-light-text">Week Ending: {report.weekEnding}</p>
                           </div>
                           <p className="text-xs text-gray-400">Submitted: {report.submittedAt}</p>
                        </div>
                        <p className="mt-4 text-gray-800">{report.content}</p>

                        {report.reply && (
                            <div className="mt-4 p-4 bg-blue-50 border-l-4 border-primary rounded-r-lg">
                                <p className="font-semibold text-primary">Pastor's Reply:</p>
                                <p className="text-sm text-gray-700 mt-1">{report.reply}</p>
                            </div>
                        )}
                         {currentUser?.role === UserRole.SuperAdmin && !report.reply && (
                           replyingTo === report.id ? (
                                <div className="mt-4">
                                    <textarea 
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        rows={2}
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        placeholder="Type your reply..."></textarea>
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => handleAddReply(report.id)} className="px-3 py-1 bg-primary text-white text-sm rounded-md hover:bg-primary-dark">Save Reply</button>
                                        <button onClick={() => setReplyingTo(null)} className="px-3 py-1 bg-gray-200 text-sm rounded-md hover:bg-gray-300">Cancel</button>
                                    </div>
                                </div>
                           ) : (
                             <button onClick={() => setReplyingTo(report.id)} className="mt-4 text-sm font-semibold text-primary hover:underline">Reply</button>
                           )
                        )}
                    </div>
                ))}
            </div>

        </div>
    );
};

export default UnitReports;