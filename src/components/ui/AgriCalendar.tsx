'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns';

interface AgriTip {
  date: string;
  title: string;
  type: 'planting' | 'harvesting' | 'maintenance' | 'warning';
  desc: string;
}

const AGRI_TIPS: AgriTip[] = [
  { date: '2026-04-15', title: 'Maize Planting', type: 'planting', desc: 'Optimal time for maize planting in the Northwest region.' },
  { date: '2026-04-20', title: 'Soil Preparation', type: 'maintenance', desc: 'Prepare your cassava beds before the heavy rains start.' },
  { date: '2026-05-02', title: 'Pest Scouter', type: 'warning', desc: 'Keep an eye out for armyworms during late spring.' },
  { date: '2026-05-10', title: 'Cocoa Harvesting', type: 'harvesting', desc: 'Main harvest season approaching for cocoa in Littoral.' },
  { date: '2026-04-30', title: 'Fertilizer Application', type: 'maintenance', desc: 'Apply nitrogen-based fertilizer to young plantains today.' },
];

export default function AgriCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const getTipForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return AGRI_TIPS.find(tip => tip.date === dateStr);
  };

  const selectedTip = getTipForDate(new Date());

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black dark:text-white uppercase italic tracking-tighter flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">calendar_month</span>
            Farmer&apos;s Calendar
          </h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{format(currentDate, 'MMMM yyyy')}</p>
        </div>
        <div className="flex gap-2 text-slate-400">
          <button onClick={handlePrevMonth} className="hover:text-primary transition-colors">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button onClick={handleNextMonth} className="hover:text-primary transition-colors">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
      
      <div className="p-4 flex-1">
        <div className="grid grid-cols-7 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
            <div key={day} className="text-center text-[10px] font-black text-slate-400 p-1">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: getDay(monthStart) }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map(day => {
            const tip = getTipForDate(day);
            const isToday = isSameDay(day, new Date());
            return (
              <div 
                key={day.toString()} 
                className={`relative aspect-square flex items-center justify-center text-[11px] font-bold rounded-lg transition-all ${
                  isToday ? 'bg-primary text-white' : 'hover:bg-slate-50 dark:hover:bg-white/5 dark:text-slate-400'
                }`}
              >
                {format(day, 'd')}
                {tip && !isToday && (
                  <div className={`absolute bottom-1 w-1 h-1 rounded-full ${
                    tip.type === 'planting' ? 'bg-green-500' :
                    tip.type === 'warning' ? 'bg-red-500' :
                    tip.type === 'harvesting' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-white/5 mt-auto">
        <AnimatePresence mode="wait">
          {selectedTip ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-primary">Today&apos;s Advice</span>
                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${
                  selectedTip.type === 'planting' ? 'bg-green-100 text-green-700' :
                  selectedTip.type === 'warning' ? 'bg-red-100 text-red-700' :
                  selectedTip.type === 'harvesting' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {selectedTip.type}
                </span>
              </div>
              <h4 className="text-sm font-black dark:text-white leading-tight">{selectedTip.title}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{selectedTip.desc}</p>
            </motion.div>
          ) : (
            <div className="text-center py-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              No specific tasks for today
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
