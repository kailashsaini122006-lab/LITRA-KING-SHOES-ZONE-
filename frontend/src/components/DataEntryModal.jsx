import React, { useState, useEffect, useCallback } from 'react';
import { List, X, RefreshCw, ShieldCheck } from 'lucide-react';
import { getApiUrl } from '../config/api';

export default function DataEntryModal({ isOpen, onClose, accessToken }) {
  const [records, setRecords] = useState([]);
  const [fetchingRecords, setFetchingRecords] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchDataEntries = useCallback(async () => {
    try {
      setFetchingRecords(true);
      setErrorMessage('');
      const res = await fetch(getApiUrl('/data-entry'), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.success) {
        setRecords(data.data || []);
      } else {
        setErrorMessage(data?.message || 'Failed to fetch saved records from MongoDB.');
      }
    } catch (err) {
      console.error('Error fetching records:', err);
      setErrorMessage(`Connection Error (${err.message}). Unable to reach backend server.`);
    } finally {
      setFetchingRecords(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isOpen && accessToken) {
      fetchDataEntries();
    }
  }, [isOpen, accessToken, fetchDataEntries]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl text-zinc-950 font-bold shadow-md shadow-amber-500/20">
              <List className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white tracking-wider flex items-center gap-2">
                SAVED RECORDS PORTAL
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified Session
                </span>
              </h3>
              <p className="text-xs text-zinc-400">View all customer inquiries and data entry records stored in MongoDB</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-header Controls */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800/80 bg-zinc-950/40">
          <div className="text-xs font-extrabold text-amber-400 flex items-center gap-2 uppercase tracking-wider">
            <List className="w-4 h-4" /> TOTAL SAVED RECORDS ({records.length})
          </div>

          <button
            onClick={fetchDataEntries}
            disabled={fetchingRecords}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${fetchingRecords ? 'animate-spin text-amber-400' : ''}`} /> Refresh Data
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-4 bg-red-950/70 border border-red-800/80 rounded-2xl text-red-300 text-sm">
              {errorMessage}
            </div>
          )}

          {fetchingRecords ? (
            <div className="py-12 text-center text-zinc-400 flex items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" /> Loading saved records from MongoDB...
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              No saved records found in MongoDB.
            </div>
          ) : (
            <div className="border border-zinc-800 rounded-2xl overflow-hidden shadow-inner">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase font-bold border-b border-zinc-800">
                    <tr>
                      <th className="px-4 py-3.5">User Name</th>
                      <th className="px-4 py-3.5">Mobile Number</th>
                      <th className="px-4 py-3.5">Inquiry Type</th>
                      <th className="px-4 py-3.5">Message / Requirements</th>
                      <th className="px-4 py-3.5">Submitted Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                    {records.map((rec) => (
                      <tr key={rec._id} className="hover:bg-zinc-800/50 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-white">{rec.userName}</td>
                        <td className="px-4 py-3.5 font-semibold text-amber-400">+91 {rec.mobileNumber}</td>
                        <td className="px-4 py-3.5 text-zinc-300 font-medium">
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                            {rec.inquiryType || 'Wholesale Inquiry'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-zinc-300 max-w-xs leading-relaxed">{rec.message}</td>
                        <td className="px-4 py-3.5 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                          {new Date(rec.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
