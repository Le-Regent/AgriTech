'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import ResponsiveImage from '@/components/ui/ResponsiveImage';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { getWeatherData, getCurrentPosition, WeatherData } from '@/lib/weatherService';
import { supabaseService } from '@/services/supabaseService';
import { useUser } from '@/context/UserContext';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';

function DiagnosisContent() {
  const router = useRouter();
  const { user } = useUser();
  const { t } = useLanguage();

  const CROP_TYPES = [
    { id: 'Tomato', label: t('tomato') },
    { id: 'Potato', label: t('potato') },
    { id: 'Corn', label: t('corn') },
    { id: 'Wheat', label: t('wheat') },
    { id: 'Rice', label: t('rice') },
    { id: 'Soybean', label: t('soybean') },
    { id: 'Apple', label: t('apple') },
    { id: 'Grape', label: t('grape') },
    { id: 'Strawberry', label: t('strawberry') },
    { id: 'Other', label: t('other') }
  ];

  const ANALYSIS_STEPS = [
    t('step_uploading'),
    t('step_analyzing'),
    t('step_patterns'),
    t('step_database'),
    t('step_treatment'),
    t('step_finalizing')
  ];
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [lowPowerMode, setLowPowerMode] = useState(false);
  const [error, setError] = useState<{ message: string; technical?: string; isQuota?: boolean } | string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown(c => c - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const position = await getCurrentPosition();
        const data = await getWeatherData(position.coords.latitude, position.coords.longitude);
        setWeather(data);
      } catch (error) {
        console.error('Failed to get weather for diagnosis:', error);
      }
    }
    fetchWeather();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size too large (max 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        if (!selectedCrop) {
          setSelectedCrop('Other');
          toast.info("No crop selected. Defaulted to 'Other'.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setError(null);
    setSuccess(null);
    try {
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions or use upload.");
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setSelectedImage(dataUrl);
        if (!selectedCrop) {
          setSelectedCrop('Other');
          toast.info("No crop selected. Defaulted to 'Other'.");
        }
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const handleDiagnose = () => {
    setError(null);
    setSuccess(null);
    if (!selectedImage) {
      setError('Please select or take a photo first.');
      return;
    }
    const crop = selectedCrop || 'Other';
    if (!selectedCrop) {
      setSelectedCrop('Other');
    }
    analyzeImage(selectedImage, crop);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isAnalyzing && !showCamera) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isAnalyzing || showCamera) return;

    setError(null);
    setSuccess(null);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please submit an image file.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size too large (max 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        if (!selectedCrop) {
          setSelectedCrop('Other');
          toast.info("No crop selected. Defaulted to 'Other'.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const [analysisStep, setAnalysisStep] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      setAnalysisStep(0);
      interval = setInterval(() => {
        setAnalysisStep(prev => (prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev));
      }, 450); // Snappier step simulation (450ms) to feel highly advanced and fast
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 384; // Optimized image dimension for super-fast API transmission
        const MAX_HEIGHT = 384;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.45)); // High quality-to-size compression
      };
    });
  };

  const analyzeImage = async (base64Data: string, cropOverride?: string) => {
    setIsAnalyzing(true);
    setError(null);
    const activeCrop = cropOverride || selectedCrop || 'Other';
    try {
      const compressedData = await compressImage(base64Data);
      
      const weatherContext = weather ? `
      Current Environmental Context:
      - Temperature: ${weather.temp}°C
      - Humidity: ${weather.humidity}%
      - Weather: ${weather.description}
      - Wind Speed: ${weather.windSpeed} m/s
      - Rain (last 1h): ${weather.rain || 0}mm
      ` : '';

      const response = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: compressedData.split(',')[1],
          cropType: activeCrop,
          weatherContext
        })
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: 'Failed to analyze image', friendlyMessage: 'An unexpected response was received from the server.' };
        }
        throw errorData;
      }

      const report = await response.json();
      report.cropType = activeCrop; // Add crop type to report
      setSuccess('Analysis complete! Redirecting to results...');
      
      // Save report and the optimized compressed image to sessionStorage (Instant!)
      // This guarantees no QuotaExceededErrors on sessionStorage writes
      sessionStorage.setItem('diagnosis_report', JSON.stringify(report));
      sessionStorage.setItem('diagnosis_image', compressedData);
      
      // Transition immediately! 0ms wait for the user to see results
      router.push('/diagnosis/result');

      // Save to Supabase in background without blocking the screen navigation
      if (user?.id) {
        const confidenceScore = typeof report.confidence === 'number' 
          ? report.confidence 
          : (typeof report.confidence_score === 'number' ? report.confidence_score : 0.85);

        const diagnosisData = {
          farmer_id: user.id,
          crop_type: activeCrop,
          image_url: compressedData, // Use highly compressed image for fast DB write!
          result_label: report.diseaseName || 'Healthy Leaf',
          confidence: confidenceScore,
          status: report.status || 'healthy',
          recommendation: report.recommendations || '',
          created_at: new Date().toISOString()
        };
        
        supabaseService.createDiagnosis(diagnosisData)
          .then(() => {
            console.log('Diagnosis successfully stored in backend history');
          })
          .catch((dbError: any) => {
            console.error('Failed to save diagnosis to database:', dbError);
          });
      }
    } catch (err: any) {
      console.error('AI Analysis failed:', err);
      const isQuota = !!err.isQuotaExceeded || err.code === 'RESOURCE_EXHAUSTED' || err.status === 429;
      setError({
        message: err.friendlyMessage || err.error || 'Analysis failed. Please try again with a clearer image.',
        technical: err.technicalDetails || err.error || err.message || err.toString() || '',
        isQuota
      });
      if (isQuota) {
        setCooldown(45);
      }
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black tracking-tight dark:text-white">{t('diagnosis_title')}</h2>
        <p className="text-slate-500 dark:text-slate-400">{t('diagnosis_subtitle')}</p>
      </div>

      <div className="max-w-md mx-auto mb-8 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-bold mb-2 dark:text-white">{t('select_crop')}</label>
          <select 
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl font-bold dark:text-white focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="">{t('all')}...</option>
            {CROP_TYPES.map(crop => (
              <option key={crop.id} value={crop.id}>{crop.label}</option>
            ))}
          </select>
        </div>

        {weather && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-blue-500">
                <span className="material-symbols-outlined">thermostat</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Local Weather</p>
                <p className="text-sm font-bold dark:text-white">{weather.temp}°C, {weather.description}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Humidity</p>
              <p className="text-sm font-bold dark:text-white">{weather.humidity}%</p>
            </div>
          </div>
        )}
      </div>

      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-slate-950 rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden shadow-2xl relative aspect-[3/4] sm:aspect-[4/3] flex items-center justify-center border transition-all duration-300 ${isDragging ? 'border-primary ring-4 ring-primary/20 scale-[0.99]' : 'border-white/5'}`}
      >
        {isDragging && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-30 flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary rounded-[2.5rem] sm:rounded-[3rem] pointer-events-none">
            <span className="material-symbols-outlined text-6xl text-primary animate-bounce mb-4">upload_file</span>
            <p className="text-lg font-black text-white uppercase italic tracking-wider">Drop leaf image here</p>
            <p className="text-xs text-slate-400 mt-2">Release file to diagnose instantly</p>
          </div>
        )}
        {!isAnalyzing ? (
          <>
            {showCamera ? (
              <div className="absolute inset-0 bg-black flex flex-col items-center justify-center">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                
                {/* Scanner Overlay */}
                <div className="diagnosis-scanner-overlay absolute inset-x-8 top-1/4 bottom-1/4 border border-primary/30 rounded-3xl overflow-hidden pointer-events-none">
                  {lowPowerMode ? (
                    <div className="absolute inset-0 border-2 border-primary/50 rounded-3xl animate-pulse bg-primary/5" />
                  ) : (
                    <>
                      <motion.div 
                        initial={{ top: '0%' }}
                        animate={{ top: '100%' }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_rgba(16,185,129,0.5)] z-20"
                      />
                      <div className="absolute inset-0 bg-primary/5"></div>
                    </>
                  )}
                </div>

                <div className="absolute top-8 left-8">
                  <button 
                    onClick={() => setLowPowerMode(!lowPowerMode)}
                    className={`h-12 px-4 rounded-2xl flex items-center justify-center gap-2 border text-xs font-black uppercase tracking-wider transition-all duration-300 transform active:scale-95 pointer-events-auto cursor-pointer ${
                      lowPowerMode 
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400 font-extrabold shadow-lg shadow-amber-500/20' 
                        : 'bg-black/40 hover:bg-black/60 backdrop-blur-xl text-white border-white/10'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px] animate-bounce">bolt</span>
                    <span>{lowPowerMode ? 'Faster Scan On' : 'Lighter Scan'}</span>
                  </button>
                </div>

                <div className="absolute top-8 right-8">
                  <button 
                    onClick={stopCamera}
                    className="w-12 h-12 bg-black/40 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white border border-white/10 cursor-pointer"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="absolute bottom-12 flex items-center gap-8 px-8 w-full justify-center">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white border border-white/10 cursor-pointer"
                  >
                    <span className="material-symbols-outlined">photo_library</span>
                  </button>
                  
                  <button 
                    onClick={capturePhoto}
                    className="w-24 h-24 bg-white rounded-full flex items-center justify-center p-2 shadow-[0_0_30px_rgba(255,255,255,0.3)] group active:scale-90 transition-transform cursor-pointer"
                  >
                    <div className="w-full h-full border-4 border-slate-900 rounded-full flex items-center justify-center">
                       <div className="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
                    </div>
                  </button>

                  <div className="w-14 h-14"></div> {/* Spacer to center the button */}
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
            ) : (
              <>
                <ResponsiveImage 
                  src={selectedImage || "https://picsum.photos/seed/plant-leaf/1200/1600"} 
                  alt="Plant leaf for analysis" 
                  className="w-full h-full object-cover opacity-60"
                  baseWidth={1200}
                  baseHeight={1600}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent flex flex-col items-center justify-center p-8">
                  {!selectedImage ? (
                    <div className="text-center space-y-4">
                      <div className="w-24 h-24 bg-primary/20 backdrop-blur-xl rounded-[2rem] border border-primary/20 flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-4xl text-primary animate-pulse">photo_camera</span>
                      </div>
                      <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Camera Ready</h3>
                      <p className="text-slate-400 text-sm max-w-[200px] mx-auto">Position the leaf within the frame and ensure good lighting.</p>
                    </div>
                  ) : (
                    <div className="absolute top-6 right-6">
                       <button onClick={() => setSelectedImage(null)} className="w-10 h-10 bg-black/40 backdrop-blur rounded-xl text-white flex items-center justify-center border border-white/10 cursor-pointer">
                          <span className="material-symbols-outlined text-sm">delete</span>
                       </button>
                    </div>
                  )}
                  
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                  />
                  
          <div className="absolute bottom-12 flex flex-col gap-3 w-full max-w-[280px]">
                    <button 
                      onClick={startCamera}
                      className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
                    >
                      <span className="material-symbols-outlined">camera</span>
                      Take Photo
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-white/10 backdrop-blur-xl text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-all cursor-pointer"
                    >
                      Choose from Gallery
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-center space-y-12 p-8 relative z-10">
             {/* Progress Rings */}
            <div className="relative w-40 h-40 mx-auto">
                <div className="absolute inset-0 border-[6px] border-primary/10 rounded-full"></div>
                <motion.div 
                  className="absolute inset-0 border-[6px] border-primary border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-8 border border-white/5 rounded-full flex items-center justify-center flex-col bg-slate-900/50 backdrop-blur-3xl">
                  <span className="text-3xl font-black text-white italic tracking-tighter">
                    {Math.round((analysisStep + 1) / ANALYSIS_STEPS.length * 100)}%
                  </span>
                  <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest mt-1">Status</span>
                </div>
            </div>

            <div className="space-y-4">
              <motion.div
                key={analysisStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white font-black text-2xl uppercase italic tracking-tight"
              >
                {ANALYSIS_STEPS[analysisStep]}
              </motion.div>
              <div className="flex justify-center gap-1.5">
                {ANALYSIS_STEPS.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-0.5 rounded-full transition-all duration-700 ${i <= analysisStep ? 'w-10 bg-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'w-2 bg-white/10'}`}
                  />
                ))}
              </div>
            </div>
            
            <p className="text-xs text-white/40 font-black uppercase tracking-[0.3em] animate-pulse">Running Neural Engine</p>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 fixed bottom-24 left-4 right-4 z-40 md:static md:bottom-auto">
        {error && (() => {
          const errorMsg = typeof error === 'string' ? error : error.message;
          const isQuota = typeof error === 'object' && error !== null && !!error.isQuota;
          const technical = typeof error === 'object' && error !== null ? error.technical : undefined;
          
          return (
            <div className="w-full max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl p-5 relative overflow-hidden flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
              {/* Highlight bar to look premium */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${isQuota ? 'bg-amber-500' : 'bg-rose-500'}`} />
              
              <div className="flex gap-4 items-start">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isQuota ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                  <span className="material-symbols-outlined text-2xl">{isQuota ? 'hourglass_disabled' : 'gpp_maybe'}</span>
                </div>
                
                <div className="flex-grow space-y-1">
                  <h3 className="font-bold text-[15px] text-slate-900 dark:text-white leading-tight">
                    {isQuota ? 'AI Assistant is Resting' : 'Action Required'}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs font-semibold leading-relaxed">
                    {errorMsg}
                  </p>
                </div>
              </div>

              {/* Countdown timer UI for rate limits */}
              {isQuota && cooldown > 0 && (
                <div className="bg-amber-50 dark:bg-amber-500/5 rounded-2xl p-3 border border-amber-100 dark:border-amber-500/10 flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    Pacing request rate...
                  </span>
                  <span>Retry in {cooldown}s</span>
                </div>
              )}

              {/* Show technical details toggle */}
              {technical && (
                <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3 mt-1">
                  <details className="group">
                    <summary className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold select-none cursor-pointer flex items-center justify-between">
                      <span>Developer Diagnostics</span>
                      <span className="material-symbols-outlined text-xs transition-transform group-open:rotate-180">expand_more</span>
                    </summary>
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800/40 text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed font-mono mt-2 overflow-auto max-h-32 whitespace-pre-wrap select-text">
                      {technical}
                    </div>
                  </details>
                </div>
              )}
            </div>
          );
        })()}
        
        {success && (
          <div className="w-full max-w-md bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-2xl border border-green-100 dark:border-green-800 flex items-center gap-3">
            <span className="material-symbols-outlined">check_circle</span>
            <p className="text-sm font-bold">{success}</p>
          </div>
        )}
        <button 
          onClick={handleDiagnose}
          disabled={!selectedImage || !selectedCrop || isAnalyzing || cooldown > 0}
          className="w-full max-w-md bg-primary text-white py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-4 cursor-pointer"
        >
          <span className="material-symbols-outlined text-3xl">biotech</span>
          {isAnalyzing ? t('analyzing') : cooldown > 0 ? `Cooling Down (${cooldown}s)` : t('start_analysis')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: 'light_mode', title: 'Good Lighting', desc: 'Ensure the leaf is well-lit but avoid direct glare.' },
          { icon: 'center_focus_strong', title: 'Steady Focus', desc: 'Keep the camera 10-15cm away from the surface.' },
          { icon: 'filter_center_focus', title: 'Single Leaf', desc: 'Focus on one leaf at a time for better accuracy.' },
        ].map((tip, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex gap-4 transition-all">
            <div className="w-10 h-10 shrink-0 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined">{tip.icon}</span>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-1 dark:text-white">{tip.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{tip.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DiagnosisPage() {
  return (
    <ProtectedRoute allowedRoles={['farmer']}>
      <DiagnosisContent />
    </ProtectedRoute>
  );
}
