'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import ResponsiveImage from '@/components/ui/ResponsiveImage';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { supabaseService } from '@/services/supabaseService';
import { profileService } from '@/services/profileService';
import { CropDiagnosis } from '@/types';
import { downloadDiagnosisReport } from '@/lib/diagnosisUtils';
import Link from 'next/link';
import { toast } from 'sonner';

function ProfileContent() {
  const { theme, toggleTheme } = useTheme();
  const { user, updateProfile } = useUser();
  const [diagnoses, setDiagnoses] = useState<CropDiagnosis[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    location_name: '',
    avatar_url: '',
    phone_number: '',
    bio: '',
    farm_name: '',
    website: ''
  });

  const isFarmer = user?.user_type === 'farmer';

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        location_name: user.location_name || '',
        avatar_url: user.avatar_url || '',
        phone_number: user.phone_number || '',
        bio: user.bio || '',
        farm_name: user.farm_name || '',
        website: user.website || ''
      });
      setPreviewUrl(null);
    }
  }, [user]);

  const hasChanges = user && (
    formData.full_name !== (user.full_name || '') ||
    formData.location_name !== (user.location_name || '') ||
    formData.avatar_url !== (user.avatar_url || '') ||
    formData.phone_number !== (user.phone_number || '') ||
    formData.bio !== (user.bio || '') ||
    formData.farm_name !== (user.farm_name || '') ||
    formData.website !== (user.website || '')
  );

  useEffect(() => {
    async function fetchDiagnoses() {
      if (isFarmer && user?.id) {
        setLoading(true);
        try {
          const data = await supabaseService.getDiagnoses(user.id);
          setDiagnoses(data);
        } catch (error) {
          console.error('Failed to fetch diagnoses for profile:', error);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchDiagnoses();
  }, [isFarmer, user?.id]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await updateProfile({
        full_name: formData.full_name,
        location_name: formData.location_name,
        avatar_url: formData.avatar_url,
        phone_number: formData.phone_number,
        bio: formData.bio,
        farm_name: formData.farm_name,
        website: formData.website,
      });
      if (error) {
        toast.error(error);
      } else {
        toast.success('Profile updated successfully');
        setIsEditing(false);
        setPreviewUrl(null);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // 1. Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setIsUploading(true);

    try {
      // 2. Upload in background
      let publicUrl;
      try {
        publicUrl = await supabaseService.uploadImage(file, 'avatars');
      } catch (error) {
        console.warn('Failed to upload to avatars bucket, trying products bucket');
        publicUrl = await supabaseService.uploadImage(file, 'products');
      }

      // 3. Update form data with the final URL
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Photo ready. Click Save Changes to apply.');
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      toast.error('Failed to upload image. Please try again.');
      setPreviewUrl(null); // Revert preview on failure
    } finally {
      setIsUploading(false);
    }
  };

  const handleRefresh = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const profile = await profileService.getProfile(user.id);
      if (profile) {
        toast.success('Successfully synced with server');
        setFormData({
          full_name: profile.full_name || '',
          location_name: profile.location_name || '',
          avatar_url: profile.avatar_url || '',
          phone_number: profile.phone_number || '',
          bio: profile.bio || '',
          farm_name: profile.farm_name || '',
          website: profile.website || ''
        });
      }
    } catch (error) {
      toast.error('Failed to sync. Check your connection.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const stats = isFarmer ? [
    { label: 'Diagnoses', value: '124' },
    { label: 'Sales', value: '$12.4k' }
  ] : [
    { label: 'Orders', value: '42' },
    { label: 'Spent', value: '$3.2k' }
  ];

  const personalFields = [
    { label: 'Full Name', value: formData.full_name, icon: 'person', key: 'full_name' },
    { label: 'Email Address', value: user?.email || '', icon: 'alternate_email', key: 'email', readOnly: true },
    { label: 'Phone Number', value: formData.phone_number, icon: 'call', key: 'phone_number' },
    { label: isFarmer ? 'Farm Location' : 'Shipping Address', value: formData.location_name, icon: 'location_on', key: 'location_name' },
  ];

  const professionalFields = [
    { label: 'Farm Name', value: formData.farm_name, icon: 'agriculture', key: 'farm_name', farmerOnly: true },
    { label: 'Website', value: formData.website, icon: 'language', key: 'website' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight dark:text-white">User Profile</h2>
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setPreviewUrl(null);
                  if (user) {
                    setFormData({
                      full_name: user.full_name || '',
                      location_name: user.location_name || '',
                      avatar_url: user.avatar_url || '',
                      phone_number: user.phone_number || '',
                      bio: user.bio || '',
                      farm_name: user.farm_name || '',
                      website: user.website || ''
                    });
                  }
                }}
                className="px-6 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={saving || isUploading || !hasChanges}
                className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </>
                ) : 'Save Changes'}
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Edit Profile
            </button>
          )}
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing || isEditing}
            title="Force sync data from database"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary transition-all disabled:opacity-50"
          >
            <span className={`material-symbols-outlined ${isRefreshing ? 'animate-spin' : ''}`}>sync</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="space-y-6 sm:space-y-8">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm text-center transition-colors">
              <div className="relative inline-block mb-4 sm:mb-6">
                <div className="relative">
                  <ResponsiveImage
                    src={previewUrl || formData.avatar_url || `https://picsum.photos/seed/${user?.user_type || 'user'}/200/200`}
                    alt={`Profile picture of ${formData.full_name}`}
                    className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-primary/20 transition-all duration-300 ${isUploading ? 'opacity-50 grayscale-[0.5]' : 'opacity-100'}`}
                    baseWidth={200}
                    baseHeight={200}
                  />
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  {hasChanges && !isUploading && (
                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg animate-bounce flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">edit</span>
                      UNSAVED
                    </div>
                  )}
                </div>
                {isEditing && (
                  <label className={`absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 bg-primary text-white rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <span className="material-symbols-outlined text-[16px] sm:text-[20px]">photo_camera</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={saving || isUploading}
                    />
                  </label>
                )}
              </div>
            <h3 className="text-lg sm:text-xl font-black dark:text-white">{user?.full_name}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-4 sm:mb-6 capitalize">{user?.user_type} · Premium Member since 2024</p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {stats.map((stat, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-colors">
                  <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                  <p className="text-base sm:text-lg font-black dark:text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
            <h4 className="font-bold mb-6 dark:text-white">Account Preferences</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400">dark_mode</span>
                  <span className="text-sm font-bold dark:text-white">Dark Mode</span>
                </div>
                <div 
                  onClick={toggleTheme}
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${theme === 'dark' ? 'left-6' : 'left-1'}`}></div>
                </div>
              </div>
              {[
                { label: 'Email Notifications', icon: 'mail', checked: true },
                { label: 'SMS Alerts', icon: 'sms', checked: false },
                { label: 'Two-Factor Auth', icon: 'security', checked: true },
              ].map((pref, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-400">{pref.icon}</span>
                    <span className="text-sm font-bold dark:text-white">{pref.label}</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${pref.checked ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${pref.checked ? 'left-6' : 'left-1'}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
            <h4 className="font-bold mb-8 dark:text-white">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {personalFields.map((field, i) => (
                <div key={i} className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{field.label}</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">{field.icon}</span>
                    <input
                      type="text"
                      value={field.value}
                      readOnly={!isEditing || field.readOnly}
                      disabled={saving}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      className={`w-full pl-12 pr-4 py-3 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none dark:text-white transition-colors ${!isEditing || field.readOnly ? 'bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed' : 'bg-slate-100 dark:bg-slate-800'} ${saving ? 'opacity-50' : ''}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-8">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">About / Bio</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-4 text-slate-400 text-[20px]">description</span>
                <textarea
                  value={formData.bio}
                  readOnly={!isEditing}
                  disabled={saving}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself or your farm..."
                  className={`w-full pl-12 pr-4 py-3 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none dark:text-white transition-colors min-h-[100px] resize-none ${!isEditing ? 'bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed' : 'bg-slate-100 dark:bg-slate-800'} ${saving ? 'opacity-50' : ''}`}
                />
              </div>
            </div>

            <h4 className="font-bold mb-8 dark:text-white pt-4 border-t border-slate-100 dark:border-slate-800">Professional Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {professionalFields.filter(f => !f.farmerOnly || isFarmer).map((field, i) => (
                <div key={i} className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{field.label}</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">{field.icon}</span>
                    <input
                      type="text"
                      value={field.value}
                      readOnly={!isEditing}
                      disabled={saving}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      className={`w-full pl-12 pr-4 py-3 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none dark:text-white transition-colors ${!isEditing ? 'bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed' : 'bg-slate-100 dark:bg-slate-800'} ${saving ? 'opacity-50' : ''}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
            <h4 className="font-bold mb-6 dark:text-white">{isFarmer ? 'Farm Location' : 'Preferred Delivery Area'}</h4>
            <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden relative transition-colors">
              <ResponsiveImage 
                src={`https://picsum.photos/seed/${isFarmer ? 'farm' : 'city'}-location/1000/600`} 
                alt="Map showing location" 
                className="w-full h-full object-cover opacity-60 dark:opacity-40"
                baseWidth={1000}
                baseHeight={600}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                  <span className="material-symbols-outlined text-primary text-3xl fill-1">location_on</span>
                </div>
              </div>
              <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-4 py-2 rounded-xl shadow-sm transition-colors">
                <p className="text-xs font-bold dark:text-white">
                  {isFarmer ? 'GPS: 43.6150° N, 116.2023° W' : 'Zone: Downtown Metro'}
                </p>
              </div>
            </div>
          </div>

          {isFarmer && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold dark:text-white">Diagnosis History</h4>
                <Link href="/diagnosis" className="text-primary text-xs font-bold hover:underline">New Scan</Link>
              </div>
              <div className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : diagnoses.length > 0 ? (
                  diagnoses.slice(0, 5).map((diagnosis) => (
                    <div key={diagnosis.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                        <ResponsiveImage 
                          src={diagnosis.image_url} 
                          alt={diagnosis.crop_type} 
                          className="w-full h-full object-cover"
                          baseWidth={100}
                          baseHeight={100}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className="font-bold text-sm dark:text-white truncate">{diagnosis.crop_type}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            diagnosis.status === 'healthy' ? 'bg-green-100 text-green-600' :
                            diagnosis.status === 'warning' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {diagnosis.result_label || diagnosis.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Confidence: {((diagnosis.confidence || 0) * 100).toFixed(0)}%</p>
                          <p className="text-[10px] text-slate-400">{new Date(diagnosis.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => downloadDiagnosisReport(diagnosis)}
                          className="material-symbols-outlined text-slate-400 hover:text-primary transition-colors"
                          title="Download Report"
                        >
                          download
                        </button>
                        <Link href={`/diagnosis/result?id=${diagnosis.id}`} className="material-symbols-outlined text-slate-400 hover:text-primary transition-colors">chevron_right</Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">biotech</span>
                    <p className="text-sm text-slate-500">No diagnoses yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
