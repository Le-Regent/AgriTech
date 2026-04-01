'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ResponsiveImage from '../../src/components/ResponsiveImage';
import { GoogleGenAI, Type } from "@google/genai";
import ProtectedRoute from '../components/ProtectedRoute';
import { getWeatherData, getCurrentPosition, WeatherData } from '../../src/lib/weatherService';
import { supabaseService } from '../../src/services/supabaseService';
import { useUser } from '../../src/context/UserContext';
import { toast } from 'sonner';

const CROP_TYPES = [
  'Tomato', 'Potato', 'Corn', 'Wheat', 'Rice', 'Soybean', 'Apple', 'Grape', 'Strawberry', 'Other'
];

const ANALYSIS_STEPS = [
  "Uploading leaf image...",
  "Analyzing symptoms...",
  "Identifying disease patterns...",
  "Consulting agricultural database...",
  "Generating treatment plan...",
  "Finalizing report..."
];

function DiagnosisContent() {
  const router = useRouter();
  const { user } = useUser();
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
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key is missing.');
      }
      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-flash-latest";
      
      const weatherContext = weather ? `
      Current Environmental Context:
      - Temperature: ${weather.temp}°C
      - Humidity: ${weather.humidity}%
      - Weather: ${weather.description}
      - Wind Speed: ${weather.windSpeed} m/s
      - Rain (last 1h): ${weather.rain || 0}mm
      ` : '';

      const prompt = `Analyze this ${selectedCrop} leaf image for diseases or health issues. 
      ${weatherContext}
      Provide a detailed report in JSON format.
      IMPORTANT: For all "icon" fields, use ONLY valid Material Symbol names (e.g., 'content_cut' for scissors, 'water_drop' for rain, 'thermostat' for temperature, 'eco' for plants, 'bug_report' for pests, 'science' for chemicals). Do NOT use generic words like 'scissor' or 'rain' if they are not exact Material Symbol identifiers.`;

      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: compressedData.split(',')[1]
              }
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              diseaseName: { type: Type.STRING },
              scientificName: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              status: { type: Type.STRING, enum: ["healthy", "warning", "critical"] },
              description: { type: Type.STRING },
              symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendations: { type: Type.STRING },
              treatmentSteps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    desc: { type: Type.STRING },
                    icon: { type: Type.STRING }
                  },
                  required: ["title", "desc", "icon"]
                }
              },
              causes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    desc: { type: Type.STRING }
                  },
                  required: ["title", "desc"]
                }
              },
              preventions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    desc: { type: Type.STRING }
                  },
                  required: ["title", "desc"]
                }
              },
              environmentalContext: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.STRING },
                    status: { type: Type.STRING },
                    color: { type: Type.STRING },
                    icon: { type: Type.STRING }
                  },
                  required: ["label", "value", "status", "color", "icon"]
                }
              }
            },
            required: ["diseaseName", "confidence", "status", "description", "symptoms", "recommendations", "treatmentSteps", "causes", "preventions", "environmentalContext"]
          }
        }
      });

      if (!response.text) {
        throw new Error('AI returned an empty response.');
      }

      const report = JSON.parse(response.text);
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
          
          console.log('Saving diagnosis to Supabase:', diagnosisData);
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
        <h2 className="text-3xl font-black tracking-tight dark:text-white">AI Plant Diagnosis</h2>
        <p className="text-slate-500 dark:text-slate-400">Upload a photo of the affected area for a detailed AI health analysis.</p>
      </div>

      <div className="max-w-md mx-auto mb-8 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-bold mb-2 dark:text-white">Select Crop Type</label>
          <select 
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl font-bold dark:text-white focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="">Choose a crop...</option>
            {CROP_TYPES.map(crop => (
              <option key={crop} value={crop}>{crop}</option>
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

      <div className="bg-background-dark rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-2xl relative aspect-square sm:aspect-[4/3] flex items-center justify-center">
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
                <div className="absolute bottom-8 flex gap-4">
                  <button 
                    onClick={stopCamera}
                    className="w-14 h-14 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                  <button 
                    onClick={capturePhoto}
                    className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-primary shadow-xl"
                  >
                    <div className="w-16 h-16 border-4 border-primary rounded-full"></div>
                  </button>
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
            ) : (
              <>
                <ResponsiveImage 
                  src={selectedImage || "https://picsum.photos/seed/plant-leaf/1200/900"} 
                  alt="Plant leaf for analysis" 
                  className="w-full h-full object-cover opacity-60"
                  baseWidth={1200}
                  baseHeight={900}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/20">
                  <div className="w-full max-w-[256px] aspect-square border-2 border-primary border-dashed rounded-3xl relative mb-8">
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                  </div>
                  
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                  />
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white/10 backdrop-blur text-white px-6 py-3 rounded-2xl font-bold border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined">upload_file</span>
                      Upload
                    </button>
                    <button 
                      onClick={startCamera}
                      className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-primary/40 hover:scale-105 transition-all flex items-center gap-3"
                    >
                      <span className="material-symbols-outlined">photo_camera</span>
                      Take Photo
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-center space-y-6 p-8">
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div 
                className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"
                style={{ animationDuration: '1.5s' }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-primary font-black text-xl">{Math.round((analysisStep + 1) / ANALYSIS_STEPS.length * 100)}%</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-white font-bold text-xl animate-pulse">{ANALYSIS_STEPS[analysisStep]}</p>
              <p className="text-white/60 text-sm">Please stay on this page while our AI expert analyzes your crop&apos;s health.</p>
            </div>
            <div className="flex justify-center gap-1">
              {ANALYSIS_STEPS.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 rounded-full transition-all duration-500 ${i <= analysisStep ? 'w-8 bg-primary' : 'w-2 bg-white/20'}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 pt-4">
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
          {isAnalyzing ? 'Analyzing...' : 'Start Diagnosis'}
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
