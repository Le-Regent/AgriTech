'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useOffline } from '@/context/OfflineContext';
import { useUser } from '@/context/UserContext';
import ResponsiveImage from '@/components/ui/ResponsiveImage';
import { supabaseService } from '@/services/supabaseService';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export default function HistoryContent() {
  const { isOnline, getFromCache, saveToCache } = useOffline();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') as 'transactions' | 'diagnoses' | 'trends';
  const isFarmer = user?.role === 'farmer';
  
  const [activeTab, setActiveTab] = useState<'transactions' | 'diagnoses' | 'trends'>(initialTab || 'transactions');
  const [history, setHistory] = useState<any[]>([]);
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  const [sensorHistory, setSensorHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchHistory = async () => {
      if (!user) return;
      
      // Load from cache first for zero-latency UI
      const [
        cachedDiagnoses,
        cachedSensor,
        cachedHistory
      ] = await Promise.all([
        getFromCache(`diagnoses_${user.id}`),
        getFromCache(`sensor_data_${user.id}`),
        getFromCache(`history_combined_${user.id}`)
      ]);

      if (cachedDiagnoses) setDiagnoses(cachedDiagnoses);
      if (cachedSensor) setSensorHistory(cachedSensor);
      if (cachedHistory) {
        setHistory(cachedHistory);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        if (isOnline) {
          if (isFarmer) {
            const [diagData, salesData, purchaseData, sensorData] = await Promise.all([
              supabaseService.getDiagnoses(user.id).catch(() => []),
              supabaseService.getOrders(user.id, 'farmer').catch(() => []),
              supabaseService.getOrders(user.id, 'buyer').catch(() => []),
              supabaseService.getSensorData(user.id).catch(() => [])
            ]);
            
            const freshDiagnoses = diagData || [];
            const freshSensor = (sensorData || []).map((log: any) => ({
              ...log,
              soil_moisture: log.soil_moisture || 0,
              temperature: log.temperature || 0,
              humidity: log.humidity || 0,
              field_sector: log.field_sector || 'Main'
            }));
            
            setDiagnoses(freshDiagnoses);
            setSensorHistory(freshSensor);
            saveToCache(`diagnoses_${user.id}`, freshDiagnoses);
            saveToCache(`sensor_data_${user.id}`, freshSensor);
            
            // Combine sales and purchases for farmers
            const mappedSales = (salesData || []).map((order: any) => {
              const productName = order.order_items?.[0]?.products?.name;
              const extraCount = (order.order_items?.length || 0) - 1;
              const cropLabel = productName 
                ? (extraCount > 0 ? `${productName} + ${extraCount} more` : productName)
                : 'Produce';

              return {
                id: order.id,
                date: order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A',
                type: 'Sale',
                crop: cropLabel,
                amount: order.total_amount || 0,
                status: order.status ? (order.status.charAt(0).toUpperCase() + order.status.slice(1)) : 'Pending',
                originalStatus: order.status || 'pending',
                buyer: order.profiles?.full_name || 'Anonymous Buyer'
              };
            });

            const mappedPurchases = (purchaseData || []).map((order: any) => {
              const productName = order.order_items?.[0]?.products?.name;
              const extraCount = (order.order_items?.length || 0) - 1;
              const cropLabel = productName 
                ? (extraCount > 0 ? `${productName} + ${extraCount} more` : productName)
                : 'Market Buy';

              return {
                id: order.id,
                date: order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A',
                type: 'Purchase',
                crop: cropLabel,
                amount: order.total_amount || 0,
                status: order.status ? (order.status.charAt(0).toUpperCase() + order.status.slice(1)) : 'Pending',
                originalStatus: order.status || 'pending',
                seller: order.order_items?.[0]?.products?.profiles?.full_name || 'Vendor'
              };
            });

            const combinedHistory = [...mappedSales, ...mappedPurchases].sort((a,b) => {
              const timeA = (salesData.find((s: any) => s.id === a.id) || purchaseData.find((p: any) => p.id === a.id))?.created_at;
              const timeB = (salesData.find((s: any) => s.id === b.id) || purchaseData.find((p: any) => p.id === b.id))?.created_at;
              return new Date(timeB || 0).getTime() - new Date(timeA || 0).getTime();
            });
            setHistory(combinedHistory);
            saveToCache(`history_combined_${user.id}`, combinedHistory);
          } else {
            const purchaseData = await supabaseService.getOrders(user.id, 'buyer');
            const mappedPurchases = (purchaseData || []).map((order: any) => ({
              id: order.id,
              date: order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A',
              type: 'Purchase',
              crop: order.order_items?.[0]?.products?.name || 'Produce',
              amount: order.total_amount || 0,
              status: order.status ? (order.status.charAt(0).toUpperCase() + order.status.slice(1)) : 'Pending',
              originalStatus: order.status || 'pending'
            })).sort((a: any, b: any) => {
              const timeA = purchaseData.find((p: any) => p.id === a.id)?.created_at;
              const timeB = purchaseData.find((p: any) => p.id === b.id)?.created_at;
              return new Date(timeB || 0).getTime() - new Date(timeA || 0).getTime();
            });
            const freshHistory = mappedPurchases;
            setHistory(freshHistory);
            saveToCache(`history_combined_${user.id}`, freshHistory);
          }
        }
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, isFarmer, isOnline, saveToCache, getFromCache]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!isOnline) {
      toast.error('You need an internet connection to update order status.');
      return;
    }

    setIsUpdatingStatus(orderId);
    try {
      await supabaseService.updateOrderStatus(orderId, newStatus as any);
      setHistory(prev => prev.map(item => 
        item.id === orderId 
          ? { ...item, status: newStatus.charAt(0).toUpperCase() + newStatus.slice(1), originalStatus: newStatus } 
          : item
      ));
      toast.success(`Order marked as ${newStatus}`);
      // Refresh cache
      if (user) {
        const updatedHistory = history.map(item => 
          item.id === orderId 
            ? { ...item, status: newStatus.charAt(0).toUpperCase() + newStatus.slice(1), originalStatus: newStatus } 
            : item
        );
        saveToCache(`history_combined_${user.id}`, updatedHistory);
      }
    } catch (err) {
      toast.error('Failed to update status. Please try again.');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

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
            <>
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
              <button 
                onClick={() => setActiveTab('trends')}
                className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                  activeTab === 'trends' 
                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Field Trends
              </button>
            </>
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
                {loading && history.length === 0 ? (
                  <div className="h-10 w-32 bg-slate-100 dark:bg-slate-800 rounded-lg mt-3 animate-pulse"></div>
                ) : (
                  <p className="text-4xl font-black text-slate-900 dark:text-white mt-3">
                    {(history.reduce((acc, curr) => acc + (curr.type === 'Sale' || !isFarmer ? curr.amount : 0), 0) || 0).toLocaleString()} CFA
                  </p>
                )}
                <div className="mt-4 flex items-center text-xs text-green-600 font-black">
                  <span className="material-symbols-outlined text-sm mr-1">trending_up</span>
                  <span>+12.5% from last month</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transactions</p>
                {loading && history.length === 0 ? (
                  <div className="h-10 w-16 bg-slate-100 dark:bg-slate-800 rounded-lg mt-3 animate-pulse"></div>
                ) : (
                  <p className="text-4xl font-black text-slate-900 dark:text-white mt-3">{history.length}</p>
                )}
                <div className="mt-4 flex items-center text-xs text-blue-600 font-black">
                  <span className="material-symbols-outlined text-sm mr-1">check_circle</span>
                  <span>All systems operational</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Actions</p>
                {loading && history.length === 0 ? (
                  <div className="h-10 w-12 bg-slate-100 dark:bg-slate-800 rounded-lg mt-3 animate-pulse"></div>
                ) : (
                  <p className="text-4xl font-black text-slate-900 dark:text-white mt-3">0</p>
                )}
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
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {loading && history.length === 0 ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-8 py-5"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24"></div></td>
                          <td className="px-8 py-5"><div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full w-16"></div></td>
                          <td className="px-8 py-5">
                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-32 mb-1"></div>
                            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-20"></div>
                          </td>
                          <td className="px-8 py-5"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-20 ml-auto"></div></td>
                          <td className="px-8 py-5"><div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full w-20 mx-auto"></div></td>
                          <td className="px-8 py-5"><div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl w-24 ml-auto"></div></td>
                        </tr>
                      ))
                    ) : (
                      history.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-8 py-5 text-sm text-slate-500 dark:text-slate-400 font-medium">
                            {item.date}
                          </td>
                          <td className="px-8 py-5">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              item.type === 'Sale' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">{item.crop || item.item}</span>
                              {item.type === 'Sale' && item.buyer && (
                                <span className="text-[10px] text-slate-400 font-black uppercase">To: {item.buyer}</span>
                              )}
                              {item.type === 'Purchase' && item.seller && (
                                <span className="text-[10px] text-slate-400 font-black uppercase">From: {item.seller}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-5 text-sm text-slate-900 dark:text-white text-right font-black">{item.amount.toLocaleString()} CFA</td>
                          <td className="px-8 py-5 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              item.status === 'Delivered' || item.status === 'Completed' ? 'bg-green-50 text-green-600' : 
                              item.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            {isFarmer && item.type === 'Sale' && item.originalStatus !== 'delivered' && item.originalStatus !== 'completed' ? (
                              <button
                                onClick={() => updateOrderStatus(item.id, 'delivered')}
                                disabled={isUpdatingStatus === item.id || !isOnline}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                  isUpdatingStatus === item.id || !isOnline
                                    ? 'bg-slate-100 text-slate-400'
                                    : 'bg-primary text-white hover:shadow-lg hover:shadow-primary/20 cursor-pointer'
                                }`}
                              >
                                {isUpdatingStatus === item.id ? 'Updating...' : 'Mark Delivered'}
                              </button>
                            ) : (
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Complete</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'diagnoses' ? (
          <motion.div
            key="diagnoses"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {loading && diagnoses.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 animate-pulse">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
                      <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                    </div>
                    <div className="h-6 w-3/4 bg-slate-100 dark:bg-slate-800 rounded mb-2"></div>
                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded mb-6"></div>
                    <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-between">
                      <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded"></div>
                      <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : diagnoses.length > 0 ? (
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
        ) : (
          <motion.div
            key="trends"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Soil Moisture Trend</h3>
                    <p className="text-xs text-slate-500 font-medium">Historical moisture readings across sectors</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined">water_drop</span>
                  </div>
                </div>
                {loading && sensorHistory.length === 0 ? (
                  <div className="h-[300px] w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl animate-pulse"></div>
                ) : (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[...sensorHistory].reverse()}>
                        <defs>
                          <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="recorded_at" 
                          tickFormatter={(str) => new Date(str).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          fontSize={10}
                          fontWeight={900}
                          axisLine={false}
                          tickLine={false}
                          dy={10}
                        />
                        <YAxis fontSize={10} fontWeight={900} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="soil_moisture" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorMoisture)" 
                          name="Moisture %"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Temperature vs Humidity</h3>
                    <p className="text-xs text-slate-500 font-medium">Environmental balance over time</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined">thermostat</span>
                  </div>
                </div>
                {loading && sensorHistory.length === 0 ? (
                  <div className="h-[300px] w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl animate-pulse"></div>
                ) : (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[...sensorHistory].reverse()}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="recorded_at" 
                          tickFormatter={(str) => new Date(str).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          fontSize={10}
                          fontWeight={900}
                          axisLine={false}
                          tickLine={false}
                          dy={10}
                        />
                        <YAxis fontSize={10} fontWeight={900} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="temperature" 
                          stroke="#f59e0b" 
                          strokeWidth={3} 
                          dot={false}
                          name="Temp °C"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="humidity" 
                          stroke="#10b981" 
                          strokeWidth={3} 
                          dot={false}
                          name="Humidity %"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Raw Sensor Logs</h3>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black text-slate-400">
                  {loading && sensorHistory.length === 0 ? 'Updating records...' : `Last ${sensorHistory.length} readings`}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                      <th className="py-4">Time</th>
                      <th className="py-4">Sector</th>
                      <th className="py-4">Moisture</th>
                      <th className="py-4">Temp</th>
                      <th className="py-4">Humidity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {loading && sensorHistory.length === 0 ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-4"><div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded"></div></td>
                          <td className="py-4"><div className="h-4 w-12 bg-slate-100 dark:bg-slate-800 rounded"></div></td>
                          <td className="py-4"><div className="h-4 w-10 bg-slate-100 dark:bg-slate-800 rounded"></div></td>
                          <td className="py-4"><div className="h-4 w-10 bg-slate-100 dark:bg-slate-800 rounded"></div></td>
                          <td className="py-4"><div className="h-4 w-10 bg-slate-100 dark:bg-slate-800 rounded"></div></td>
                        </tr>
                      ))
                    ) : (
                      sensorHistory.map((log) => (
                        <tr key={log.id} className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          <td className="py-4">{new Date(log.recorded_at).toLocaleTimeString() || 'N/A'}</td>
                          <td className="py-4 uppercase font-black text-xs text-slate-900 dark:text-white">{log.field_sector || 'Main'}</td>
                          <td className="py-4">{log.soil_moisture || 0}%</td>
                          <td className="py-4">{log.temperature || 0}°C</td>
                          <td className="py-4">{log.humidity || 0}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
