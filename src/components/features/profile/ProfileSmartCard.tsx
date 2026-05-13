'use client';

import React from 'react';
import { motion } from 'motion/react';
import { User } from '@/types';
import ResponsiveImage from '@/components/ui/ResponsiveImage';

interface ProfileSmartCardProps {
  user: User;
}

export default function ProfileSmartCard({ user }: ProfileSmartCardProps) {
  const trustScore = 85; // This could be calculated dynamically

  return (
    <div className="relative group perspective-1000">
      <motion.div
        whileHover={{ rotateY: 5, rotateX: -5, scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="relative w-full aspect-[1.618/1] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2rem] p-6 sm:p-8 text-white shadow-2xl overflow-hidden border border-white/10"
      >
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px]" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        </div>

        {/* Card Chip & Logos */}
        <div className="relative z-10 flex justify-between items-start mb-8">
          <div className="space-y-4">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 backdrop-blur rounded-xl flex items-center justify-center border border-primary/30">
                    <span className="material-symbols-outlined text-primary text-2xl font-black">eco</span>
                </div>
                <div className="leading-tight">
                    <h2 className="text-xl font-black tracking-tighter uppercase italic">KamerFresh</h2>
                    <p className="text-[8px] font-black tracking-[0.3em] uppercase text-primary opacity-80">Digital Identity Card</p>
                </div>
             </div>
             <div className="w-12 h-9 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.5)_2px,rgba(0,0,0,0.5)_4px)]" />
             </div>
          </div>
          <div className="text-right">
            <div className="bg-white/5 backdrop-blur px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-widest text-white/70">Verified Farmer</span>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="relative z-10 flex gap-6 mt-8">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-white/20 overflow-hidden shadow-2xl">
                <ResponsiveImage 
                    src={user.avatar_url || `https://picsum.photos/seed/${user.id}/200/200`} 
                    alt={user.full_name || 'User'} 
                    className="w-full h-full object-cover"
                    baseHeight={200}
                    baseWidth={200}
                />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className="text-xl sm:text-2xl font-black truncate">{user.full_name || 'KamerFresh Member'}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-4">{user.farm_name || 'Independant Farmer'}</p>
                <div className="flex items-center gap-6">
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-0.5">Member ID</p>
                        <p className="text-xs font-black font-mono">KF-{user.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-0.5">Trust Score</p>
                        <p className="text-xs font-black font-mono text-primary">{trustScore}%</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Bottom Bar */}
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between z-10">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 backdrop-blur rounded-xl border border-white/10">
                    <span className="material-symbols-outlined text-[20px] text-white/40">nfc</span>
                </div>
                <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/30">NFC Active</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/70">Tap for Proof of Freshness</p>
                </div>
            </div>
            <div className="w-12 h-12 bg-white rounded-lg p-1">
                <div className="w-full h-full bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=kamerfresh-verify')] bg-cover opacity-80" />
            </div>
        </div>
      </motion.div>
    </div>
  );
}
