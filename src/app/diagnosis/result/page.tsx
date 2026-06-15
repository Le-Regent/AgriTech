'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ResponsiveImage from '@/components/ui/ResponsiveImage';
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { downloadDiagnosisReport } from '@/lib/diagnosisUtils';
import { motion } from 'motion/react';

function DiagnosisResultContent() {
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);

  useEffect(() => {
    const storedReport = sessionStorage.getItem('diagnosis_report');
    const storedImage = sessionStorage.getItem('diagnosis_image');

    if (!storedReport) {
      router.push('/diagnosis');
    } else {
      setReport(JSON.parse(storedReport));
      setImage(storedImage);
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeechToggle = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(report?.recommendations || '');
      utterance.lang = 'en-US';
      utterance.rate = speechRate;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleRateChange = (rate: number) => {
    setSpeechRate(rate);
    if (isSpeaking && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(report?.recommendations || '');
      utterance.lang = 'en-US';
      utterance.rate = rate;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  if (loading || !report) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-50 dark:bg-green-500/10 text-green-500';
      case 'warning': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-500';
      case 'critical': return 'bg-red-50 dark:bg-red-500/10 text-red-500';
      default: return 'bg-slate-50 dark:bg-slate-500/10 text-slate-500';
    }
  };

  const mapIcon = (iconName: string) => {
    const mapping: Record<string, string> = {
      'scissor': 'content_cut',
      'scissors': 'content_cut',
      'rain': 'water_drop',
      'rainy': 'water_drop',
      'sun': 'light_mode',
      'sunny': 'light_mode',
      'cloud': 'cloudy',
      'temp': 'thermostat',
      'temperature': 'thermostat',
      'humidity': 'humidity_percentage',
      'wind': 'air',
      'pest': 'bug_report',
      'pests': 'bug_report',
      'bug': 'bug_report',
      'fungus': 'microbiology',
      'bacteria': 'microbiology',
      'virus': 'microbiology',
      'plant': 'eco',
      'leaf': 'eco',
      'chemical': 'science',
      'fertilizer': 'science',
    };
    return mapping[iconName.toLowerCase()] || iconName;
  };

  const handleDownload = () => {
    downloadDiagnosisReport(report);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link href="/diagnosis" className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary font-bold transition-colors cursor-pointer">
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Analysis
        </Link>
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
          <button 
            onClick={() => {
              const text = `KamerFresh Crop Diagnostic Status for ${report.cropType || 'Crop'}: *${report.diseaseName}* (${((report.confidence || report.confidence_score || 0) * 100).toFixed(1)}% confidence). Recommendations: ${report.recommendations}`;
              window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
            }}
            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">chat</span>
            Share via WhatsApp
          </button>
          <button className="flex-1 sm:flex-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">share</span>
            Share
          </button>
          <button 
            onClick={handleDownload}
            className="flex-1 sm:flex-none bg-primary text-white px-3 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">download</span>
            Download
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          <div className="diagnosis-result-report-card bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
            <div className="flex flex-col sm:flex-row items-start justify-between mb-6 sm:mb-8 gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${getStatusColor(report.status)}`}>
                    {report.status} status
                  </span>
                  {report.cropType === 'Other' && report.detectedCropType ? (
                    <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 border border-indigo-200/50 dark:border-indigo-500/20">
                      Detected Crop: {report.detectedCropType}
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {report.cropType || 'Plant'}
                    </span>
                  )}
                  {/* Small, high-visibility Confidence Score badge */}
                  <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Confidence: {((report.confidence || report.confidence_score || 0) * 100).toFixed(0)}%
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black dark:text-white">{report.diseaseName}</h2>
                {report.cropType === 'Other' && report.detectedCropType && (
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1.5 mb-2">
                    <span className="material-symbols-outlined text-[14px] text-indigo-500">grid_view</span>
                    Automatically Identified Plant: <strong className="text-indigo-600 dark:text-indigo-400 font-black">{report.detectedCropType}</strong>
                  </p>
                )}
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 italic">{report.scientificName}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-3xl sm:text-4xl font-black text-primary">{((report.confidence || report.confidence_score || 0) * 100).toFixed(1)}%</p>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Confidence Score</p>
              </div>
            </div>

            <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden mb-8">
              {image && (
                <ResponsiveImage 
                  src={image} 
                  alt="Diagnosis result" 
                  className="w-full h-full object-cover dark:opacity-80"
                  baseWidth={1200}
                  baseHeight={800}
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-bold flex items-center gap-2 dark:text-white">
                  <span className="material-symbols-outlined text-primary">info</span>
                  Symptoms Observed
                </h4>
                <ul className="space-y-3">
                  {report.symptoms.map((symptom: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mt-1.5 shrink-0"></span>
                      {symptom}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold flex items-center gap-2 dark:text-white">
                    <span className="material-symbols-outlined text-primary">psychology</span>
                    AI Recommendations
                  </h4>
                  <button 
                    onClick={handleSpeechToggle}
                    className={`p-2 rounded-xl transition-all flex items-center gap-2 group cursor-pointer ${
                      isSpeaking ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border border-amber-300/30' : 'bg-primary/10 text-primary hover:bg-primary/20'
                    }`}
                    title={isSpeaking ? "Mute / Stop reading" : "Read aloud"}
                  >
                    <span className="material-symbols-outlined text-[18px] group-active:scale-90 transition-transform">
                      {isSpeaking ? 'volume_off' : 'volume_up'}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                      {isSpeaking ? 'Stop Reading' : 'Voice Assistant'}
                    </span>
                    {isSpeaking && (
                      <span className="flex items-center gap-0.5 ml-1 select-none">
                        <span className="w-0.5 h-3 bg-amber-500 rounded-full animate-bounce [animation-delay:0.1s]"></span>
                        <span className="w-0.5 h-4 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-0.5 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                      </span>
                    )}
                  </button>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl space-y-3 transition-colors">
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {report.recommendations}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
            <h3 className="text-xl font-bold mb-6 dark:text-white">Treatment Advisory Guide</h3>
            <div className="space-y-4">
              {report.treatmentSteps.map((item: any, i: number) => (
                <div key={i} className="flex gap-6 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                  <div className="text-2xl font-black text-slate-200 dark:text-slate-800 group-hover:text-primary transition-colors">0{i + 1}</div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-bold text-sm dark:text-white">{item.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 group-hover:text-primary transition-colors">{mapIcon(item.icon)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
            <h3 className="text-xl font-bold mb-6 dark:text-white">Detailed Condition Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Potential Causes</h4>
                <div className="space-y-3">
                  {report.causes.map((cause: any, i: number) => (
                    <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors">
                      <p className="font-bold text-sm dark:text-white mb-1">{cause.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{cause.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Preventative Measures</h4>
                <div className="space-y-3">
                  {report.preventions.map((measure: any, i: number) => (
                    <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors">
                      <p className="font-bold text-sm dark:text-white mb-1">{measure.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{measure.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* AI Voice Assistant Waveform Card */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-550/10 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px] animate-pulse">waves</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm dark:text-white uppercase tracking-wider">Audio Reader</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Voice Assistant</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full transition-colors ${isSpeaking ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                {isSpeaking ? 'Narrating...' : 'Ready'}
              </span>
            </div>

            {/* Simulated Digital Waveform Display */}
            <div className="h-28 bg-slate-950 dark:bg-slate-950/80 rounded-2xl flex flex-col items-center justify-center px-6 relative overflow-hidden group">
              {/* grid background pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#022c2222_1px,transparent_1px),linear-gradient(to_bottom,#022c2222_1px,transparent_1px)] bg-[size:10px_10px] opacity-20 pointer-events-none" />
              
              <div className="flex items-end justify-between w-full h-16 max-w-[240px] gap-1 relative z-10">
                {Array.from({ length: 24 }).map((_, i) => {
                  const baseHeights = [10, 16, 24, 38, 22, 14, 20, 26, 44, 52, 34, 18, 22, 30, 48, 58, 38, 20, 14, 24, 28, 16, 12, 8];
                  const animationHeights = [
                    [12, 36, 18, 48, 24, 12],
                    [16, 48, 28, 58, 16, 10],
                    [20, 56, 14, 38, 24, 20],
                    [8, 24, 16, 32, 14, 8]
                  ][i % 4];
                  const duration = [1.2, 1.4, 0.9, 1.6, 1.1, 1.5, 1.0, 1.3, 1.7, 1.2, 1.4, 1.0, 1.3, 1.5, 0.9, 1.6, 1.3, 1.1, 1.4, 1.0, 1.2, 1.5, 0.8, 1.1][i];

                  return (
                    <motion.div
                      key={i}
                      className="w-1 rounded-full shrink-0"
                      animate={isSpeaking ? {
                        height: animationHeights,
                      } : {
                        height: 6,
                      }}
                      transition={isSpeaking ? {
                        duration: duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                      } : {
                        duration: 0.3,
                      }}
                      style={{
                        height: isSpeaking ? undefined : '6px',
                        backgroundColor: isSpeaking ? '#10b981' : '#334155',
                        boxShadow: isSpeaking ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none',
                      }}
                    />
                  );
                })}
              </div>
              <p className="text-[9px] font-mono tracking-wider text-slate-500 dark:text-slate-600 select-none mt-2 relative z-10 w-full text-center">
                {isSpeaking ? 'DYNAMIC VOCAL FREQUENCY ACTIVE' : 'SPEECH SYNTHESIS ENGINE MUTED'}
              </p>
            </div>

            {/* Quick narrative controller actions */}
            <div className="space-y-4">
              <button
                onClick={handleSpeechToggle}
                className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md active:scale-95 ${
                  isSpeaking 
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-amber-500/20' 
                    : 'bg-primary hover:bg-primary/95 text-white shadow-primary/20'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isSpeaking ? 'pause_circle' : 'volume_up'}
                </span>
                <span>{isSpeaking ? 'Stop Narration' : 'Read Recommendations'}</span>
              </button>

              {/* Reader speed settings */}
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Speech Synthesizer Speed</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleRateChange(rate)}
                      className={`py-1.5 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer border ${
                        speechRate === rate
                          ? 'bg-primary/10 border-primary/40 text-primary dark:text-emerald-400 font-black scale-102 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      {rate === 1.0 ? 'Normal' : `${rate}x`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
            <h3 className="text-xl font-bold mb-6 dark:text-white">Environmental Context</h3>
            <div className="space-y-6">
              {report.environmentalContext.map((env: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors">
                      <span className="material-symbols-outlined">{mapIcon(env.icon)}</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{env.label}</p>
                      <p className="text-lg font-black dark:text-white">{env.value}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${env.color}`}>{env.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary text-white p-8 rounded-[2.5rem] shadow-xl shadow-primary/20">
            <h3 className="text-xl font-bold mb-4">Need Expert Help?</h3>
            <p className="text-white/80 text-sm mb-6 leading-relaxed">
              Connect with a certified agronomist for a professional consultation and personalized treatment plan.
            </p>
            <button className="w-full bg-white text-primary py-3 rounded-2xl font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">chat</span>
              Talk to Expert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DiagnosisResultPage() {
  return (
    <ProtectedRoute allowedRoles={['farmer']}>
      <DiagnosisResultContent />
    </ProtectedRoute>
  );
}
