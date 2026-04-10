'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useOffline } from '@/context/OfflineContext';
import { useUser } from '@/context/UserContext';
import ResponsiveImage from '@/components/ResponsiveImage';
import { supabaseService } from '@/services/supabaseService';
import { motion, AnimatePresence } from 'motion/react';

export default function HistoryContent() {
  const { isOnline, getFromCache, saveToCache } = useOffline();
  const { user } = useUser();
  const isFarmer = user?.role === 'farmer';
  
  const [activeTab, setActiveTab] = useState<'transactions' | 'diagnoses'>('transactions');
  const [history, setHistory] = useState<any[]>([]);
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchHistory = async () => {
      setLoading(true);
      try {
        if (isFarmer) {
          const diagData = await supabaseService.getDiagnoses(user!.id);
          setDiagnoses(diagData || []);
        }
        // Mock transactions for now as per original
        const farmerHistory = [
          { id: 1, date: '2024-03-20', type: 'Sale', crop: 'Tomatoes', amount: 450, status: 'Completed' },
          { id: 2, date: '2024-03-18', type: 'Sale', crop: 'Potatoes', amount: 320, status: 'Completed' },
          { id: 3, date: '2024-03-15', type: 'Purchase', item: 'Fertilizer', amount: 150, status: 'Completed' },
          { id: 4, date: '2024-03-10', type: 'Sale', crop: 'Onions', amount: 280, status: 'Completed' },
        ];
        const buyerHistory = [
          { id: 1, date: '2024-03-22', type: 'Purchase', crop: 'Tomatoes', amount: 120, status: 'Completed' },
          { id: 2, date: '2024-03-20', type: 'Purchase', crop: 'Potatoes', amount: 85, status: 'Completed' },
          { id: 3, date: '2024-03-18', type: 'Purchase', crop: 'Onions', amount: 65, status: 'Completed' },
          { id: 4, date: '2024-03-15', type: 'Purchase', crop: 'Carrots', amount: 45, status: 'Completed' },
        ];
        setHistory(isFarmer ? farmerHistory : buyerHistory);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchHistory();
  }, [user, isFarmer]);

  const downloadReport = (diagnosis: any) => {
    const reportContent = `
      CROP DIAGNOSIS REPORT
      ---------------------
      Date: ${new Date(diagnosis.created_at).toLocaleString()}
      Crop: ${diagnosis.crop_type}
      Result: ${diagnosis.result_label || diagnosis.result}
      Confidence: ${((diagnosis.confidence || 0) * 100).toFixed(1)}%
      
      AI Analysis:
      ${diagnosis.report_data || 'No detailed report available.'}
    `;
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${diagnosis.crop_type}_diagnosis_${diagnosis.id.slice(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Activity History</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {isFarmer 
              ? 'Track your sales, purchases, and crop health records' 
              : 'View your recent produce purchases and orders'}
          </p>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
              activeTab === 'transactions' 
                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Transactions
          </button>
          {isFarmer && (
            <button 
              onClick={() => setActiveTab('diagnoses')}
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                activeTab === 'diagnoses' 
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Diagnoses
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'transactions' ? (
          <motion.div
            key="transactions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total {isFarmer ? 'Revenue' : 'Spent'}</p>
                <p className="text-4xl font-black text-slate-900 dark:text-white mt-3">
                  ${history.reduce((acc, curr) => acc + (curr.type === 'Sale' || !isFarmer ? curr.amount : 0), 0).toLocaleString()}
                </p>
                <div className="mt-4 flex items-center text-xs text-green-600 font-black">
                  <span className="material-symbols-outlined text-sm mr-1">trending_up</span>
                  <span>+12.5% from last month</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transactions</p>
                <p className="text-4xl font-black text-slate-900 dark:text-white mt-3">{history.length}</p>
                <div className="mt-4 flex items-center text-xs text-blue-600 font-black">
                  <span className="material-symbols-outlined text-sm mr-1">check_circle</span>
                  <span>All systems operational</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Actions</p>
                <p className="text-4xl font-black text-slate-900 dark:text-white mt-3">0</p>
                <div className="mt-4 flex items-center text-xs text-slate-400 font-black">
                  <span className="material-symbols-outlined text-sm mr-1">info</span>
                  <span>No pending approvals</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Recent Transactions</h2>
                {!isOnline && (
                  <span className="px-4 py-1.5 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                    Offline Mode
                  </span>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-8 py-5 text-sm text-slate-500 dark:text-slate-400 font-medium">{item.date}</td>
                        <td className="px-8 py-5">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            item.type === 'Sale' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-900 dark:text-white">{item.crop || item.item}</td>
                        <td className="px-8 py-5 text-sm text-slate-900 dark:text-white text-right font-black">${item.amount}</td>
                        <td className="px-8 py-5 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="diagnoses"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {diagnoses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {diagnoses.map((diag) => (
                  <div key={diag.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-3xl">potted_plant</span>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        (diag.confidence || 0) > 0.8 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {((diag.confidence || 0) * 100).toFixed(0)}% Confidence
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{diag.crop_type}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">{diag.result_label || diag.result}</p>
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {new Date(diag.created_at).toLocaleDateString()}
                      </span>
                      <button 
                        onClick={() => downloadReport(diag)}
                        className="flex items-center gap-2 text-primary font-black text-sm hover:gap-3 transition-all"
                      >
                        Report
                        <span className="material-symbols-outlined text-sm">download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 p-20 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800 text-center">
                <span className="material-symbols-outlined text-6xl text-slate-200 mb-6">biotech</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No Diagnoses Yet</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8">Run your first crop health check to see results here.</p>
                <Link href="/diagnosis" className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-primary/20">
                  Start Diagnosis
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
