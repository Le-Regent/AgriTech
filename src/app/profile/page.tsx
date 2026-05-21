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
import ProfileSmartCard from '@/components/features/profile/ProfileSmartCard';
import Link from 'next/link';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

function ProfileContent() {
  const { theme, toggleTheme } = useTheme();
  const { user, updateProfile } = useUser();
  const [diagnoses, setDiagnoses] = useState<CropDiagnosis[]>([]);
  const [farmerProducts, setFarmerProducts] = useState<any[]>([]);
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

  const [securityTab, setSecurityTab] = useState<'info' | 'activity' | 'devices'>('info');
  const [adminKey, setAdminKey] = useState('');
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [promoting, setPromoting] = useState(false);

  // Simulation of security logs
  const securityLogs = [
    { event: 'Login successful', device: 'Chrome on MacOS', location: 'Yaoundé, CM', time: '2 mins ago', icon: 'login' },
    { event: 'Password changed', device: 'Safari on iPhone', location: 'Douala, CM', time: '2 days ago', icon: 'lock_reset' },
    { event: 'New device authorized', device: 'Firefox on Windows', location: 'Unknown', time: '1 week ago', icon: 'devices' },
  ];

  const handlePromoteAdmin = async () => {
    if (!user || adminKey !== 'AGRI_ADMIN_2026') {
      toast.error('Invalid Admin Promotion Key');
      return;
    }
    setPromoting(true);
    try {
      const { error } = await updateProfile({ is_admin: true } as any);
      if (error) {
        toast.error(error);
      } else {
        toast.success('You are now an Admin!', {
          description: 'Refresh the page to see admin features.'
        });
        setAdminKey('');
      }
    } catch (err) {
      toast.error('Failed to elevate privileges');
    } finally {
      setPromoting(false);
    }
  };

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
    async function fetchFarmerData() {
      if (isFarmer && user?.id) {
        setLoading(true);
        try {
          const [diagnosisData, productData] = await Promise.all([
            supabaseService.getDiagnoses(user.id),
            supabaseService.getProductsByFarmerId(user.id)
          ]);
          setDiagnoses(diagnosisData);
          setFarmerProducts(productData || []);
        } catch (error) {
          console.error('Failed to fetch farmer data:', error);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchFarmerData();
  }, [isFarmer, user?.id]);

  const expiringProducts = React.useMemo(() => {
    return farmerProducts.filter(p => 
      p.is_perishable && 
      (p.health_status === 'Critical' || p.health_status === 'Warning')
    );
  }, [farmerProducts]);

  useEffect(() => {
    async function fetchOrders() {
      if (user?.id) {
        setLoading(true);
        try {
          const data = await supabaseService.getOrders(user.id, user.user_type as 'farmer' | 'buyer');
          setOrders(data || []);
        } catch (error) {
          console.error('Failed to fetch orders for profile:', error);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchOrders();
  }, [user?.id, user?.user_type]);

  const [orders, setOrders] = useState<any[]>([]);
  const [profileFilter, setProfileFilter] = useState('all');
  const [profileSort, setProfileSort] = useState<'newest' | 'oldest'>('newest');

  const filteredOrders = React.useMemo(() => {
    let result = [...orders];
    if (profileFilter !== 'all') {
      result = result.filter(o => o.status === profileFilter);
    }
    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return profileSort === 'newest' ? dateB - dateA : dateA - dateB;
    });
    return result;
  }, [orders, profileFilter, profileSort]);

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
    { label: 'Diagnoses', value: diagnoses.length.toString() },
    { label: 'Sales', value: `${orders.reduce((acc, o) => acc + (o.status === 'delivered' ? o.total_amount : 0), 0).toLocaleString()} CFA` },
    { label: 'Waste Logs', value: 'View Logs', link: '/profile/waste-logs' }
  ] : [
    { label: 'Orders', value: orders.length.toString() },
    { label: 'Spent', value: `${orders.reduce((acc, o) => acc + (o.status !== 'cancelled' ? o.total_amount : 0), 0).toLocaleString()} CFA` }
  ];

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400';
      case 'processing': return 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400';
      case 'shipped': return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400';
      case 'delivered': return 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400';
      case 'cancelled': return 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400';
    }
  };

  const getSecurityHealth = () => {
    const health = [
      { label: 'Email Verified', status: !!user?.email, icon: 'email_heart' },
      { label: 'Profile Complete', status: !!user?.full_name && !!user?.bio, icon: 'person_check' },
      { label: 'Phone Linked', status: !!user?.phone_number, icon: 'phone_callback' },
      { label: 'Identified as Admin', status: !!user?.is_admin, icon: 'security' },
    ];
    const score = Math.round((health.filter(h => h.status).length / health.length) * 100);
    return { health, score };
  };

  const { health: securityHealth, score: trustScore } = getSecurityHealth();

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
      {/* Header with Title and Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="md:hidden w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <span className="material-symbols-outlined font-black">person</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight dark:text-white">Profile Settings</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="hidden sm:flex gap-2">
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
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={saving || isUploading || !hasChanges}
                className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2"
              >
                {saving || isUploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : null}
                Save
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex-1 sm:flex-none bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit Profile
            </button>
          )}
          
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing || isEditing}
            title="Force sync data from database"
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary transition-all disabled:opacity-50"
          >
            <span className={`material-symbols-outlined ${isRefreshing ? 'animate-spin' : ''}`}>sync</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Sidebar Info */}
        <div className="space-y-6 sm:space-y-8">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm text-center">
              <div className="relative inline-block mb-6">
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
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
              {stats.map((stat, i) => (
                stat.link ? (
                  <Link key={i} href={stat.link} className="bg-slate-50 dark:bg-slate-800 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 group">
                    <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-red-500 mb-1">{stat.label}</p>
                    <p className="text-base sm:text-lg font-black dark:text-white group-hover:text-red-600">{stat.value}</p>
                  </Link>
                ) : (
                  <div key={i} className="bg-slate-50 dark:bg-slate-800 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-colors">
                    <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                    <p className="text-base sm:text-lg font-black dark:text-white">{stat.value}</p>
                  </div>
                )
              ))}
            </div>
            {user && (
              <div className="pt-8 border-t border-slate-105 dark:border-slate-800 space-y-6">
                <ProfileSmartCard user={user} />
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold dark:text-white">Account Security</h4>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Score:</span>
                <span className={`text-xs font-black ${trustScore > 70 ? 'text-green-500' : trustScore > 40 ? 'text-amber-500' : 'text-red-500'}`}>{trustScore}%</span>
              </div>
            </div>
            
            <div className="flex gap-2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mb-8 overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${trustScore > 70 ? 'bg-green-500' : trustScore > 40 ? 'bg-amber-500' : 'bg-red-500'}`} 
                style={{ width: `${trustScore}%` }}
              />
            </div>

            <div className="flex gap-4 mb-6 border-b border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setSecurityTab('info')}
                className={`pb-3 text-[10px] font-black uppercase tracking-widest transition-colors relative ${securityTab === 'info' ? 'text-primary' : 'text-slate-400'}`}
              >
                Invariants
                {securityTab === 'info' && <motion.div layoutId="secTab" className="absolute bottom-0 inset-x-0 h-0.5 bg-primary" />}
              </button>
              <button 
                onClick={() => setSecurityTab('activity')}
                className={`pb-3 text-[10px] font-black uppercase tracking-widest transition-colors relative ${securityTab === 'activity' ? 'text-primary' : 'text-slate-400'}`}
              >
                Activity Log
                {securityTab === 'activity' && <motion.div layoutId="secTab" className="absolute bottom-0 inset-x-0 h-0.5 bg-primary" />}
              </button>
            </div>

            {securityTab === 'info' ? (
              <div className="space-y-4">
                {securityHealth.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[20px] ${item.status ? 'text-green-500' : 'text-slate-400'}`}>{item.icon}</span>
                      <span className="text-xs font-bold dark:text-white">{item.label}</span>
                    </div>
                    <span className={`material-symbols-outlined text-[18px] ${item.status ? 'text-green-500' : 'text-amber-400'}`}>
                      {item.status ? 'verified' : 'error'}
                    </span>
                  </div>
                ))}


              </div>
            ) : (
              <div className="space-y-4">
                {securityLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors group">
                    <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                      <span className="material-symbols-outlined text-[18px]">{log.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold dark:text-white">{log.event}</p>
                      <p className="text-[10px] text-slate-400 truncate">{log.device} · {log.location}</p>
                      <p className="text-[9px] font-black text-primary uppercase mt-1">{log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
                <span className="font-bold text-primary">Pro Tip:</span> Completing your profile and verifying your contact info increases 
                visibility and builds stronger trust with the KamerFresh community.
              </p>
              <Link href="/SECURITY.md" className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:underline">
                <span className="material-symbols-outlined text-sm">security</span>
                View Security Whitepaper
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors text-center py-8 space-y-4">
            <span className="material-symbols-outlined text-primary text-4xl">settings</span>
            <h4 className="font-bold dark:text-white">System Settings</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Theme colors, language systems, physical GPS location authorizations, and media scan permissions are now managed in the dashboard panel.
            </p>
            <Link 
              href="/settings"
              className="mt-4 w-full h-11 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">tune</span>
              Go to Settings Dashboard
            </Link>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
            <h4 className="font-bold mb-6 sm:mb-8 dark:text-white">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
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

            <h4 className="font-bold mb-6 sm:mb-8 dark:text-white pt-4 border-t border-slate-100 dark:border-slate-800">Professional Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
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

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h4 className="font-bold dark:text-white">Order History</h4>
                <div className="flex items-center gap-2">
                  <select 
                    className="text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-white/5 border-none rounded-lg px-2 py-1 outline-none dark:text-white"
                    onChange={(e) => setProfileFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button 
                    onClick={() => setProfileSort(prev => prev === 'newest' ? 'oldest' : 'newest')}
                    className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500"
                    title="Toggle Sort"
                  >
                    <span className="material-symbols-outlined text-sm">{profileSort === 'newest' ? 'south' : 'north'}</span>
                  </button>
                  <Link href="/orders" className="text-primary text-xs font-bold hover:underline flex items-center gap-1 ml-2">
                    Full History
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
              <div className="space-y-3">
                {loading && orders.length === 0 ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-5 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-primary/30 transition-all active:scale-[0.98]">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className={`w-12 h-12 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${getStatusClasses(order.status)}`}>
                          <span className="material-symbols-outlined text-[24px] sm:text-[20px]">
                            {order.status === 'delivered' ? 'check_circle' : 
                             order.status === 'pending' ? 'schedule' : 
                             order.status === 'cancelled' ? 'cancel' : 'local_shipping'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-base sm:text-sm font-bold dark:text-white truncate">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                          <p className="text-xs sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            {new Date(order.created_at).toLocaleDateString()} · <span className="text-primary font-black">{order.total_amount.toLocaleString()} CFA</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest hidden xs:inline-block ${getStatusClasses(order.status)}`}>
                          {order.status}
                        </span>
                        <Link href="/orders" className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-primary transition-colors hover:shadow-md">
                          <span className="material-symbols-outlined text-lg sm:text-sm">visibility</span>
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500">No matching orders found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
            <h4 className="font-bold mb-4 sm:mb-6 dark:text-white">{isFarmer ? 'Farm Location' : 'Preferred Delivery Area'}</h4>
            <div className="aspect-[4/3] sm:aspect-video bg-slate-100 dark:bg-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden relative transition-colors">
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

          {isFarmer && expiringProducts.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/10 p-8 rounded-[2.5rem] border border-amber-100 dark:border-amber-900/30 shadow-sm transition-colors">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-amber-600 animate-bounce">warning</span>
                  <h4 className="font-black text-amber-900 dark:text-amber-400 uppercase text-xs tracking-widest">Freshness Alert</h4>
                </div>
                <Link href="/inventory" className="text-[10px] font-black uppercase text-amber-600 hover:underline">Manage All</Link>
              </div>
              <div className="space-y-3">
                {expiringProducts.map(p => (
                  <div key={p.id} className="bg-white dark:bg-slate-900/50 p-3 rounded-2xl flex items-center justify-between border border-amber-200 dark:border-amber-800/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                        <ResponsiveImage src={p.image_url} alt={p.name} className="w-full h-full object-cover" baseWidth={100} baseHeight={100} />
                      </div>
                      <div>
                        <p className="text-xs font-bold dark:text-white truncate max-w-[120px]">{p.name}</p>
                        <p className={`text-[9px] font-black uppercase tracking-widest ${p.health_status === 'Critical' ? 'text-red-500' : 'text-amber-500'}`}>
                          {p.health_status === 'Critical' ? 'Expires in < 24h' : 'Expiring Soon'}
                        </p>
                      </div>
                    </div>
                    <Link href={`/marketplace/${p.id}`} className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-amber-200 transition-colors">
                      Update Price
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isFarmer && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
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
      {/* Sticky Action Footer when editing */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-24 left-0 right-0 z-50 px-4 md:hidden"
          >
            <div className="bg-slate-900 dark:bg-slate-800 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl flex items-center gap-3">
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
                className="flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-white/50 bg-white/5 hover:bg-white/10"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={saving || isUploading || !hasChanges}
                className="flex-[2] bg-primary text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving || isUploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[16px]">save</span>
                )}
                {saving ? 'Saving...' : isUploading ? 'Uploading...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Inline Save Controls */}
      <div className="hidden md:flex justify-end pt-4">
        {isEditing && (
          <div className="flex gap-3">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={saving || isUploading || !hasChanges}
              className="bg-primary text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2"
            >
              {saving || isUploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
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
