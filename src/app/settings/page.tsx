'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useLanguage } from '@/context/LanguageContext';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { toast } from 'sonner';
import { 
  Settings, 
  MapPin, 
  Camera, 
  Database, 
  Globe, 
  Moon, 
  Sun, 
  ShieldCheck, 
  UserRound, 
  ChevronLeft, 
  Bell, 
  Key, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Eye, 
  EyeOff 
} from 'lucide-react';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}

function SettingsContent() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, updateProfile } = useUser();
  const { language, setLanguage, t } = useLanguage();
  
  const isFarmer = user?.user_type === 'farmer';

  // Permission States
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isCameraLive, setIsCameraLive] = useState(false);
  const [storageUsage, setStorageUsage] = useState<number>(0);
  
  // Media Stream Ref for camera testing
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Profile preferences toggles
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);
  const [offlineSync, setOfflineSync] = useState(true);

  // Admin Activation Form info
  const [adminKey, setAdminKey] = useState('');
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [promoting, setPromoting] = useState(false);

  // Calculate local storage size on mount and on clear
  const updateStorageUsage = () => {
    let bytes = 0;
    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          bytes += (localStorage[key] || '').length * 2; // Approximate byte size UTF-16
        }
      }
      setStorageUsage(Math.round((bytes / 1024) * 100) / 100); // KB
    } catch (e) {
      setStorageUsage(0);
    }
  };

  useEffect(() => {
    updateStorageUsage();
    
    // Check initial API permission query state if supported
    if (typeof navigator !== 'undefined' && navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' as any }).then(result => {
        setLocationPermission(result.state as any);
      }).catch(() => {});

      navigator.permissions.query({ name: 'camera' as any }).then(result => {
        setCameraPermission(result.state as any);
      }).catch(() => {});
    }
  }, []);

  // Location handler
  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCoordinates(coords);
        setLocationPermission('granted');
        toast.success(language === 'fr' ? 'Localisation accordée avec succès' : 'Location accessed successfully', {
          description: `Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}`
        });
      },
      (error) => {
        setLocationPermission('denied');
        console.error('Location permission request error:', error);
        toast.error(language === 'fr' ? 'Accès à la localisation refusé' : 'Location access denied');
      }
    );
  };

  // Camera Handler
  const startCameraTest = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      setCameraPermission('granted');
      setIsCameraLive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      toast.success(language === 'fr' ? 'Caméra connectée' : 'Camera started', {
        description: language === 'fr' ? 'Le flux vidéo test est en direct' : 'Live stream is running successfully.'
      });
    } catch (error) {
      setCameraPermission('denied');
      setIsCameraLive(false);
      console.error('Camera authorization error:', error);
      toast.error(language === 'fr' ? 'Impossible d\'accéder à la caméra' : 'Failed to access camera stream');
    }
  };

  const stopCameraTest = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraLive(false);
    toast.info(language === 'fr' ? 'Test caméra désactivé' : 'Camera test stopped');
  };

  // Clear App Cache Storage
  const clearAppCache = () => {
    if (!confirm(language === 'fr' ? 'Êtes-vous sûr de vouloir vider le cache de l\'application ? Cela réinitialisera vos préférences.' : 'Are you sure you want to clear the application cache? This will reset local configurations.')) return;
    
    // Maintain Auth Session, clear auxiliary storage
    const keepKeys = ['supabase.auth.token', 'user_session'];
    const backup: Record<string, string> = {};
    
    keepKeys.forEach(k => {
      const item = localStorage.getItem(k);
      if (item) backup[k] = item;
    });

    localStorage.clear();
    
    Object.entries(backup).forEach(([k, v]) => {
      localStorage.setItem(k, v);
    });

    updateStorageUsage();
    toast.success(language === 'fr' ? 'Cache vidé avec succès' : 'App cache pruned successfully');
  };

  // Admin Promotion key elevated action
  const handlePromoteAdmin = async () => {
    if (!user || adminKey !== 'AGRI_ADMIN_2026') {
      toast.error(language === 'fr' ? 'Clé de promotion invalide' : 'Invalid Admin Activation Key');
      return;
    }
    setPromoting(true);
    try {
      const { error } = await updateProfile({ is_admin: true } as any);
      if (error) {
        toast.error(error);
      } else {
        toast.success(language === 'fr' ? 'Félicitations, vous êtes administrateur !' : 'Congratulations! You are now an Admin.', {
          description: language === 'fr' ? 'Rafraîchissez pour charger les fonctionnalités d\'administration.' : 'Refresh database bindings to use dashboard tools.'
        });
        setAdminKey('');
      }
    } catch (err) {
      toast.error(language === 'fr' ? 'Échec de l\'élévation de privilèges' : 'Failed to elevate privileges');
    } finally {
      setPromoting(false);
    }
  };

  // Cleanup stream on close/unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header with Title and Dashboard Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/')}
            className="w-10 h-10 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
            title="Back to Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight dark:text-white">
              {language === 'fr' ? 'Paramètres & Permissions' : 'Settings & Permissions'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'fr' ? 'Gérer les préférences de l\'application et les accès matériels' : 'Manage your system preferences and hardware integrations'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column: Visuals & Localization */}
        <div className="space-y-6 lg:col-span-1">
          {/* Section 1: Visual Themes & Localization */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              {language === 'fr' ? 'Localisation & Thème' : 'Vibe & Localization'}
            </h3>

            {/* Language Toggle Selector */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {language === 'fr' ? 'Langue de l\'application' : 'App Language'}
              </label>
              <div className="grid grid-cols-2 bg-slate-50 dark:bg-white/5 p-1 rounded-2xl border border-slate-150 dark:border-slate-800">
                <button
                  onClick={() => {
                    setLanguage('en');
                    toast.success('App language updated to English');
                  }}
                  className={`py-2 rounded-xl text-xs font-black transition-all ${
                    language === 'en' 
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => {
                    setLanguage('fr');
                    toast.success('Langue mise à jour en Français');
                  }}
                  className={`py-2 rounded-xl text-xs font-black transition-all ${
                    language === 'fr' 
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Français
                </button>
              </div>
            </div>

            {/* Dark Mode Theme Selector */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-350">
                  {theme === 'dark' ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                </div>
                <div>
                  <p className="text-xs font-bold dark:text-white">
                    {language === 'fr' ? 'Mode Sombre' : 'Dark Theme'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {language === 'fr' ? 'Économiser l\'énergie' : 'Comfortable for eyes'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={toggleTheme}
                className={`w-11 h-6 rounded-full p-1 relative flex items-center transition-colors duration-300 outline-none ${
                  theme === 'dark' ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <motion.div
                  layout
                  className="w-4 h-4 rounded-full bg-white shadow-sm"
                  animate={{ x: theme === 'dark' ? 20 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          </div>

          {/* Section 2: Channel Notifications Preferences */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-500" />
              {language === 'fr' ? 'Alertes & Transits' : 'Alerts & Messages'}
            </h3>

            <div className="space-y-4">
              {[
                { 
                  label: language === 'fr' ? 'Notifications Web push' : 'Critical Web Push', 
                  desc: language === 'fr' ? 'Mises à jour des séquestres' : 'Instant escrow updates', 
                  state: emailNotif, 
                  setter: setEmailNotif 
                },
                { 
                  label: language === 'fr' ? 'Alertes SMS Directes' : 'Direct SMS Logistics', 
                  desc: language === 'fr' ? 'Suivi de transit Cameroun' : 'Cameroon network transit updates', 
                  state: smsNotif, 
                  setter: setSmsNotif 
                },
                { 
                  label: language === 'fr' ? 'Double authentification' : 'Two-Factor Auth', 
                  desc: language === 'fr' ? 'Sécurité bancaire renforcée' : 'Escrow protection level', 
                  state: twoFactor, 
                  setter: setTwoFactor 
                },
                { 
                  label: language === 'fr' ? 'Synchronisation offline' : 'Dynamic Offline Sync', 
                  desc: language === 'fr' ? 'Mise en cache automatique' : 'Automatic offline database mode', 
                  state: offlineSync, 
                  setter: setOfflineSync 
                },
              ].map((pref, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold dark:text-white">{pref.label}</p>
                    <p className="text-[9px] text-slate-400">{pref.desc}</p>
                  </div>
                  <button
                    onClick={() => pref.setter(!pref.state)}
                    className={`w-9 h-5 rounded-full p-0.5 relative flex items-center transition-colors duration-200 outline-none ${
                      pref.state ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <motion.div
                      layout
                      className="w-4 h-4 rounded-full bg-white shadow-xs"
                      animate={{ x: pref.state ? 16 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Columns: Hardware Permissions, Storage, Mode Toggles, and Admin Privileges */}
        <div className="space-y-8 lg:col-span-2">
          
          {/* Section 3: Hardware Integrations & Core App Permissions */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-base font-black dark:text-white tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              {language === 'fr' ? 'Accès Matériel & Autorisations' : 'Hardware & Core Permissions'}
            </h3>
            
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {language === 'fr' 
                ? 'Ces réglages contrôlent l\'accès physique de votre appareil aux API de positionnement pour le suivi logistique et à l\'appareil photo pour le crop doctor.'
                : 'Configure physical integrations utilized by KamerFresh for geographical cargo tracking, leaf scanning, and offline data storage.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Geolocation Control Card */}
              <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-slate-850 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/20 text-orange-500 flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                      locationPermission === 'granted' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' 
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-450'
                    }`}>
                      {locationPermission === 'granted' ? 'Granted' : 'Prompt / Denied'}
                    </span>
                  </div>
                  
                  <h4 className="text-sm font-black dark:text-white">
                    {language === 'fr' ? 'Localisation GPS' : 'GPS Tracking'}
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    {language === 'fr' 
                      ? 'Recommandé pour afficher les coordonnées des fermes et suivre les expéditions de cacao/fruits.' 
                      : 'Used for validating exact cooperative coordinates and measuring agricultural dispatch routes.'}
                  </p>
                </div>

                <div className="pt-2">
                  {coordinates ? (
                    <div className="bg-white dark:bg-slate-950/50 p-2.5 rounded-xl text-[9px] font-mono text-slate-500 dark:text-slate-400 border border-slate-150 dark:border-slate-800 flex items-center justify-between mb-2">
                      <span className="font-extrabold text-orange-500">REAL LAT/LNG:</span>
                      <span>{coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}</span>
                    </div>
                  ) : null}

                  <button
                    onClick={requestLocation}
                    className="w-full h-10 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-98"
                  >
                    <MapPin className="w-3.5 h-3.5 text-orange-500" />
                    {language === 'fr' ? 'Vérifier la Position' : 'Grant Geolocation'}
                  </button>
                </div>
              </div>

              {/* Camera Scanner Permission Card */}
              <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-slate-850 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/20 text-sky-500 flex items-center justify-center">
                      <Camera className="w-4 h-4" />
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                      cameraPermission === 'granted' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' 
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-450'
                    }`}>
                      {cameraPermission === 'granted' ? 'Granted' : 'Prompt / Denied'}
                    </span>
                  </div>
                  
                  <h4 className="text-sm font-black dark:text-white">
                    {language === 'fr' ? 'Caméra / Scanner' : 'Diagnosis Camera'}
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    {language === 'fr' 
                      ? 'Nécessaire pour l\'appareil photo LeafScanner afin de diagnostiquer instantanément les maladies.' 
                      : 'Vital for snapping immediate plant-leaf photos to feed the AI Leaf-Disease Crop Doctor.'}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={isCameraLive ? stopCameraTest : startCameraTest}
                    className={`w-full h-10 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-98 ${
                      isCameraLive 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 text-sky-450" />
                    {isCameraLive 
                      ? (language === 'fr' ? 'Arrêter la Caméra' : 'Stop Video Feed') 
                      : (language === 'fr' ? 'Activer Test Caméra' : 'Enable live stream')}
                  </button>
                </div>
              </div>

            </div>

            {/* Live streaming video testing widget - Dynamic HTML/IFrame compatible */}
            <AnimatePresence>
              {isCameraLive && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden border border-slate-150 dark:border-slate-800 p-4 bg-slate-950 rounded-3xl"
                >
                  <p className="text-[10px] font-mono text-emerald-400 mb-2 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    LIVE SCAN FEED: TESTING INTEGRATION OK
                  </p>
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    className="w-full max-h-56 object-cover rounded-2xl bg-black border border-white/5"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Storage space and clear auxiliary caches */}
            <div className="flex flex-col sm:flex-row items-center sm:justify-between p-4 bg-yellow-550/5 dark:bg-yellow-500/5 rounded-3xl border border-yellow-550/15 dark:border-yellow-500/10 gap-4 mt-6">
              <div className="flex items-center gap-3.5 text-left w-full sm:w-auto">
                <span className="p-2.5 rounded-xl bg-yellow-100 dark:bg-yellow-905/10 text-yellow-500 shrink-0">
                  <Database className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-xs font-black dark:text-white uppercase tracking-wider">
                    {language === 'fr' ? 'Stockage Local du Navigateur' : 'Local Browser Cache DB'}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {language === 'fr' 
                      ? `Données de catalogue et diagnostics mis en cache : ${storageUsage} KB`
                      : `Offline assets, diagnostic reports, and products cached: ${storageUsage} KB`}
                  </p>
                </div>
              </div>
              <button
                onClick={clearAppCache}
                className="w-full sm:w-auto h-10 px-5 border border-yellow-500/30 hover:border-yellow-500 text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {language === 'fr' ? 'Vider le cache' : 'Clear Prune Storage'}
              </button>
            </div>
          </div>

          {/* Section 4: Account Switch Mode Toggle Option (Moved Redundantly from Profile) */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-base font-black dark:text-white tracking-tight flex items-center gap-2.5">
              <UserRound className="w-5 h-5 text-indigo-500" />
              {language === 'fr' ? 'Mode du Compte & Échange' : 'Workspace Mode Swapper'}
            </h3>

            <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-slate-800/80 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {language === 'fr' ? 'Rôle de travail actif' : 'Currently Active Interface'}
                </span>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                  isFarmer 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' 
                    : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-400'
                }`}>
                  {isFarmer ? (language === 'fr' ? 'Producteur' : 'Farmer') : (language === 'fr' ? 'Acheteur' : 'Buyer')}
                </span>
              </div>
              
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                {isFarmer 
                  ? (language === 'fr' 
                      ? 'Vous êtes configuré en tant que Producteur agricole. Vous gérez les récoltes, l\'inventaire et les demandes d\'escrow de vos acheteurs.'
                      : 'You are viewing options as a Farmer. This enables crop catalogs creation, plant scans, and escrows delivery logs.') 
                  : (language === 'fr'
                      ? 'Vous naviguez en tant qu\'Acheteur coopératif. Vous pouvez acheter en gros, approvisionner le séquestre et libérer les fonds de livraison.'
                      : 'You are browsing KamerFresh as a Buyer, enabling food purchasing, marketplace shopping, and checkout-escrow protection.')}
              </p>
              
              <button
                onClick={async () => {
                  const targetRole = isFarmer ? 'buyer' : 'farmer';
                  const res = await updateProfile({ user_type: targetRole });
                  if (res?.error) {
                    toast.error(res.error);
                  } else {
                    toast.success(
                      language === 'fr' 
                        ? `Mode Actif: Workspace ${targetRole === 'farmer' ? 'Producteur' : 'Acheteur'}`
                        : `Workspace changed: ${targetRole === 'farmer' ? 'Farmer' : 'Buyer'}`, 
                      {
                        description: language === 'fr' ? `Interface basculée avec succès.` : `Successfully loaded the ${targetRole} pipeline.`
                      }
                    );
                  }
                }}
                className="w-full h-11 bg-slate-900 border border-slate-800 hover:bg-primary dark:bg-slate-800 dark:hover:bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2"
              >
                <Database className="w-3.5 h-3.5" />
                {language === 'fr' ? 'Changer de Mode' : 'Switch Workspace Mode'}
              </button>
            </div>
          </div>

          {/* Section 5: Admin Elevate Activation (Securing and moving Admin keys) */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-base font-black dark:text-white tracking-tight flex items-center gap-2.5">
              <Key className="w-5 h-5 text-amber-500" />
              {language === 'fr' ? 'Droits d\'Administration' : 'Administrative Elevation'}
            </h3>

            {!user?.is_admin ? (
              <div className="space-y-4 text-left">
                <p className="text-[11px] text-slate-500 leading-snug">
                  {language === 'fr'
                    ? 'Entrez une clé d\'administration autorisée pour activer l\'accès aux dashboards consolidés de KamerFresh.'
                    : 'Activate centralized governance mode by validating an authorized KamerFresh administrator lock code.'}
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input 
                      type={showAdminKey ? "text" : "password"}
                      placeholder="Admin Code: e.g., AGRI_ADMIN_2026"
                      value={adminKey}
                      onChange={(e) => setAdminKey(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-150 dark:border-slate-800 rounded-xl pl-4 pr-10 py-3.5 text-xs font-bold outline-none dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminKey(!showAdminKey)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-150 transition-colors"
                    >
                      {showAdminKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button 
                    onClick={handlePromoteAdmin}
                    disabled={promoting || !adminKey}
                    className="h-[46px] min-w-[120px] bg-slate-950 dark:bg-white dark:text-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 active:scale-97 transition-transform flex items-center justify-center"
                  >
                    {promoting ? 'Promoting...' : (language === 'fr' ? 'Activer' : 'Elevate Privilege')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 animate-bounce shrink-0" />
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                    {language === 'fr' ? 'Vérifié : Administrateur' : 'Verified: Administrator Active'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-emerald-500/80 leading-snug">
                    {language === 'fr' 
                      ? 'Votre compte possède d\'ores et déjà les privilèges super-administrateur KamerFresh globaux.'
                      : 'You already possess global administrator access. Use the sidebar link to view logistics terminals.'}
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
