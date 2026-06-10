'use client';
import React from 'react';

export default function EscrowSecurityCard() {
  return (
    <div id="escrow-security-card" className="bg-slate-950 border border-white/5 text-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden text-left space-y-4">
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-sm">verified_user</span>
        </span>
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 leading-none">
            Guaranteed Escrow
          </h4>
          <p className="text-[8px] text-slate-400 mt-1 uppercase tracking-wider">Trusted Agri-Trade</p>
        </div>
      </div>

      <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
        Your payment is buffered in a secure, digital hold when you order. Funds are only cleared once you verify your goods:
      </p>

      <div className="space-y-2 border-t border-white/5 pt-3">
        {[
          'Farmer ships fresh bags down transit corridors',
          'You check food health at the Douala/Yaoundé zone',
          'Confirm satisfaction to dispatch payments'
        ].map((step, idx) => (
          <div key={idx} className="flex items-start gap-2 text-[10px] text-slate-300">
            <span className="material-symbols-outlined text-xs text-primary shrink-0 mt-0.5">check_circle</span>
            <p className="leading-tight">{step}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[8px] font-black uppercase text-slate-500 border-t border-white/5 pt-3">
        <span>VERIFICATION CODE</span>
        <span className="text-emerald-400 font-bold">100% SECURED</span>
      </div>
    </div>
  );
}
