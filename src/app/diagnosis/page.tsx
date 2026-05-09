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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    if (!selectedCrop) {
      setError('Please select a crop type first.');
      return;
    }
    analyzeImage(selectedImage);
  };

  const [analysisStep, setAnalysisStep] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      setAnalysisStep(0);
      interval = setInterval(() => {
        setAnalysisStep(prev => (prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev));
      }, 900); // Further reduced to 900ms for snappier feel
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 512;
        const MAX_HEIGHT = 512;
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
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
    });
  };

  const analyzeImage = async (base64Data: string) => {
    setIsAnalyzing(true);
    setError(null);
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
          cropType: selectedCrop,
          weatherContext
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze image');
      }

      const report = await response.json();
      report.cropType = selectedCrop; // Add crop type to report
      setSuccess('Analysis complete! Redirecting to results...');
      
      // Save to Supabase
      if (user?.id) {
        try {
          const diagnosisData = {
            farmer_id: user.id,
            crop_type: selectedCrop,
            image_url: base64Data,
            result_label: report.diseaseName,
            confidence: report.confidence || report.confidence_score,
            status: report.status,
            recommendation: report.recommendations,
            created_at: new Date().toISOString()
          };
          
          await supabaseService.createDiagnosis(diagnosisData);
          toast.success('Diagnosis saved to your history');
        } catch (dbError: any) {
          console.error('Failed to save diagnosis to database:', dbError);
          toast.error(`Failed to save diagnosis: ${dbError.message || 'Unknown error'}`);
          // We still proceed to the result page even if DB save fails
        }
      }

      sessionStorage.setItem('diagnosis_report', JSON.stringify(report));
      sessionStorage.setItem('diagnosis_image', base64Data);
      
      router.push('/diagnosis/result');
    } catch (error: any) {
      console.error('AI Analysis failed:', error);
      setError(error.message || 'Analysis failed. Please try again with a clearer image.');
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

      <div className="bg-slate-950 rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden shadow-2xl relative aspect-[3/4] sm:aspect-[4/3] flex items-center justify-center border border-white/5">
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
                <div className="absolute inset-x-8 top-1/4 bottom-1/4 border border-primary/30 rounded-3xl overflow-hidden pointer-events-none">
                  <motion.div 
                    initial={{ top: '0%' }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_rgba(16,185,129,0.5)] z-20"
                  />
                  <div className="absolute inset-0 bg-primary/5"></div>
                </div>

                <div className="absolute top-8 right-8">
                  <button 
                    onClick={stopCamera}
                    className="w-12 h-12 bg-black/40 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white border border-white/10"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="absolute bottom-12 flex items-center gap-8 px-8 w-full justify-center">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white border border-white/10"
                  >
                    <span className="material-symbols-outlined">photo_library</span>
                  </button>
                  
                  <button 
                    onClick={capturePhoto}
                    className="w-24 h-24 bg-white rounded-full flex items-center justify-center p-2 shadow-[0_0_30px_rgba(255,255,255,0.3)] group active:scale-90 transition-transform"
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
                       <button onClick={() => setSelectedImage(null)} className="w-10 h-10 bg-black/40 backdrop-blur rounded-xl text-white flex items-center justify-center border border-white/10">
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
                      className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      <span className="material-symbols-outlined">camera</span>
                      Take Photo
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-white/10 backdrop-blur-xl text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-all"
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
        {error && (
          <div className="w-full max-w-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl border border-red-100 dark:border-red-800 flex items-center gap-3">
            <span className="material-symbols-outlined">error</span>
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}
        {success && (
          <div className="w-full max-w-md bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-2xl border border-green-100 dark:border-green-800 flex items-center gap-3">
            <span className="material-symbols-outlined">check_circle</span>
            <p className="text-sm font-bold">{success}</p>
          </div>
        )}
        <button 
          onClick={handleDiagnose}
          disabled={!selectedImage || !selectedCrop || isAnalyzing}
          className="w-full max-w-md bg-primary text-white py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-4"
        >
          <span className="material-symbols-outlined text-3xl">biotech</span>
          {isAnalyzing ? t('analyzing') : t('start_analysis')}
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
