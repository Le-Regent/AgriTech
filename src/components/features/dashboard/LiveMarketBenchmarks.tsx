'use client';
import React from 'react';
import { motion } from 'motion/react';

interface LiveMarketBenchmarksProps {
  language: string;
}

export default function LiveMarketBenchmarks({ language }: LiveMarketBenchmarksProps) {
  const benchmarks = [
    { name: 'Cocoa Beans (Kumba)', price: '1,850 FCFA/kg', change: '+2.4%', up: true },
    { name: 'Irish Potatoes (Foumbot)', price: '18,500 FCFA/sac', change: '+4.0%', up: true },
    { name: 'Plantains (Makenene)', price: '3,800 FCFA/reg', change: '-1.5%', up: false },
    { name: 'Garri (Buea)', price: '12,000 FCFA/sac', change: '+1.1%', up: true },
    { name: 'Arabica Coffee (Bafoussam)', price: '2,100 FCFA/kg', change: 'Stable', up: null },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      id="live-benchmarks"
      className="bg-slate-900 border border-white/5 text-white rounded-[2rem] p-5 sm:p-6 shadow-xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3 shrink-0">
          <span className="w-9 h-9 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-white/5">
            <span className="material-symbols-outlined text-[18px]">trending_up</span>
          </span>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Live Farm-Gate Benchmarks
            </h4>
            <p className="text-[9px] text-slate-400 md:max-w-xs">
              Updated local wholesale rates in Main Food Sourcing Hubs
            </p>
          </div>
        </div>

        {/* Price Cards Horizontal Row */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1.5 no-scrollbar -mx-5 px-5 md:mx-0 md:px-0 scroll-smooth">
          {benchmarks.map((bench, idx) => (
            <div key={idx} className="bg-white/5 border border-white/5 p-2.5 rounded-xl flex flex-col justify-between shrink-0 min-w-[135px] sm:min-w-[155px]">
              <span className="text-[8px] font-bold text-slate-400 truncate tracking-tight uppercase">{bench.name}</span>
              <div className="flex items-baseline justify-between gap-1 mt-1">
                <span className="text-[11px] font-black text-white">{bench.price}</span>
                <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-md ${
                  bench.up === true ? 'text-emerald-400 bg-emerald-500/15' :
                  bench.up === false ? 'text-red-400 bg-red-500/15' : 'text-slate-400 bg-white/10'
                }`}>
                  {bench.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
