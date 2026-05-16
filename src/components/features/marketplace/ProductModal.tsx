import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '@/types';
import { supabaseService } from '@/services/supabaseService';
import { toast } from 'sonner';
import { formatUnit } from '@/lib/unitUtils';
import ResponsiveImage from '@/components/ui/ResponsiveImage';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => Promise<void>;
  initialData?: Partial<Product>;
  farmerId: string;
}

const CATEGORIES = ['Foodstuff', 'Grains & Beans', 'Spices & Pepper', 'Oils', 'Vegetables', 'Fruits', 'Meat & Eggs'];
const UNITS = ['bag', 'bucket', 'crate', 'bunch', 'jerrycan', 'bottle', 'liter', 'mesh_bag', 'heap', 'piece', 'kg', 'g', 'ton'];
const SEASONS = ['Raining', 'Dry', 'Year round'];
const HEALTH_STATUSES = ['Healthy', 'Warning', 'Critical', 'N/A'];

const DEFAULT_FORM_DATA: Partial<Product> = {
  name: '',
  description: '',
  category: 'Foodstuff',
  price: 0,
  unit: 'bag',
  stock_quantity: 0,
  initial_stock_quantity: 0,
  harvest_season: 'Year round',
  health_status: 'Healthy',
  certifications: [],
  location: '',
  image_url: '',
  is_verified: false,
  is_perishable: false,
  expiry_date: '',
};

export default function ProductModal({ isOpen, onClose, onSave, initialData, farmerId }: ProductModalProps) {
  const [formData, setFormData] = useState<Partial<Product>>(() => {
    if (!initialData) return { ...DEFAULT_FORM_DATA, farmer_id: farmerId };
    return {
      ...DEFAULT_FORM_DATA,
      ...initialData,
      farmer_id: farmerId,
      price: isNaN(Number(initialData.price)) ? 0 : Number(initialData.price),
      stock_quantity: isNaN(Number(initialData.stock_quantity)) ? 0 : Number(initialData.stock_quantity),
      initial_stock_quantity: isNaN(Number(initialData.initial_stock_quantity)) ? 0 : Number(initialData.initial_stock_quantity)
    };
  });

  const [generatingImage, setGeneratingImage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [aiProgress, setAiProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...DEFAULT_FORM_DATA,
          ...initialData,
          farmer_id: farmerId,
          price: isNaN(Number(initialData.price)) ? 0 : Number(initialData.price),
          stock_quantity: isNaN(Number(initialData.stock_quantity)) ? 0 : Number(initialData.stock_quantity),
          initial_stock_quantity: isNaN(Number(initialData.initial_stock_quantity)) ? (Number(initialData.stock_quantity) || 0) : Number(initialData.initial_stock_quantity)
        });
      } else {
        setFormData({ ...DEFAULT_FORM_DATA, farmer_id: farmerId });
      }
      setErrors({});
      setUploadProgress(0);
      setAiProgress(0);
    }
  }, [isOpen, initialData, farmerId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = 'Product name is required';
    if (!formData.description?.trim()) newErrors.description = 'Description is required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (formData.stock_quantity === undefined || formData.stock_quantity < 0) newErrors.stock_quantity = 'Stock quantity cannot be negative';
    if (!formData.location?.trim()) newErrors.location = 'Location is required';
    if (!formData.image_url) newErrors.image_url = 'Product image is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    
    if (type === 'number') {
      if (value === '') {
        finalValue = '';
      } else {
        const parsed = parseFloat(value);
        finalValue = isNaN(parsed) ? 0 : parsed;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleCertificationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const certs = e.target.value.split(',').map(c => c.trim()).filter(c => c !== '');
    setFormData(prev => ({ ...prev, certifications: certs }));
  };

  const generateAIImage = async () => {
    if (!formData.name) {
      toast.error('Please enter a product name first to generate an image.');
      return;
    }

    setGeneratingImage(true);
    setAiProgress(10);
    try {
      setAiProgress(30);
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: formData.name })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }

      setAiProgress(80);
      const { image } = await response.json();
      
      if (image) {
        setFormData(prev => ({ ...prev, image_url: image }));
        setAiProgress(100);
        toast.success('AI Image generated successfully!');
      }
    } catch (error: any) {
      console.error('Image generation failed:', error);
      const errorMessage = error.message || 'Failed to generate image. Please try again.';
      toast.error(errorMessage);
    } finally {
      setTimeout(() => {
        setGeneratingImage(false);
        setAiProgress(0);
      }, 500);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadProgress(20);
    try {
      // Simulate progress since Supabase upload doesn't provide it easily in this wrapper
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const publicUrl = await supabaseService.uploadImage(file);
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success('Image uploaded successfully!');
    } catch (error: any) {
      console.error('Image upload failed:', error);
      toast.error(error.message || 'Failed to upload image. Please ensure it is a valid image file and try again.');
    } finally {
      setTimeout(() => {
        setUploadingImage(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form.');
      return;
    }

    setSaving(true);
    try {
      // Calculate initial_stock_quantity for threshold monitoring
      const isNew = !initialData?.id;
      const currentStock = Number(formData.stock_quantity) || 0;
      const oldStock = Number(initialData?.stock_quantity) || 0;
      const oldInitialStock = Number(initialData?.initial_stock_quantity) || oldStock;

      const payload = {
        ...formData,
        initial_stock_quantity: (isNew || currentStock > oldStock)
          ? currentStock
          : oldInitialStock
      };

      await onSave(payload);

      // Broadcast proposition to buyers if it's a new product
      if (isNew) {
        supabaseService.broadcastNotification({
          title: `New Arrival: ${payload.name} 🥗`,
          message: `Freshly harvested ${payload.name} is now available in ${payload.category}. Check it out!`,
          category: 'proposition',
          type: 'proposition',
          link: '/marketplace'
        }, 'buyer').catch(err => console.error('Broadcast failed:', err));
      }

      toast.success(isNew ? 'Product listed successfully!' : 'Product updated successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to save product:', error);
      toast.error('Failed to save product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh]"
          >
            <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black dark:text-white">
                {initialData?.id ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 pb-24 sm:pb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Product Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Organic Hass Avocados"
                      className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border ${errors.name ? 'border-red-500' : 'border-slate-100 dark:border-slate-700'} focus:border-primary outline-none transition-all dark:text-white`}
                    />
                    {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{errors.name}</p>}
                  </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:border-primary outline-none transition-all dark:text-white"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe your product's quality, origin, and any special features..."
                  className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border ${errors.description ? 'border-red-500' : 'border-slate-100 dark:border-slate-700'} focus:border-primary outline-none transition-all dark:text-white resize-none`}
                />
                {errors.description && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border ${errors.price ? 'border-red-500' : 'border-slate-100 dark:border-slate-700'} focus:border-primary outline-none transition-all dark:text-white`}
                  />
                  {errors.price && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{errors.price}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Unit</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:border-primary outline-none transition-all dark:text-white"
                  >
                    {UNITS.map(unit => <option key={unit} value={unit}>{formatUnit(unit)}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Stock Qty</label>
                  <input
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border ${errors.stock_quantity ? 'border-red-500' : 'border-slate-100 dark:border-slate-700'} focus:border-primary outline-none transition-all dark:text-white`}
                  />
                  {errors.stock_quantity && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{errors.stock_quantity}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Harvest Season</label>
                  <select
                    name="harvest_season"
                    value={formData.harvest_season}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:border-primary outline-none transition-all dark:text-white"
                  >
                    {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Health Status</label>
                  <select
                    name="health_status"
                    value={formData.health_status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:border-primary outline-none transition-all dark:text-white"
                  >
                    {HEALTH_STATUSES.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.is_perishable ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                      <span className="material-symbols-outlined">{formData.is_perishable ? 'timer' : 'hourglass_disabled'}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black dark:text-white">Perishable Item</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Requires freshness tracking</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_perishable: !prev.is_perishable }))}
                    className={`w-12 h-6 rounded-full transition-all relative ${formData.is_perishable ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.is_perishable ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                {formData.is_perishable && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/5"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400">Expiration Date</label>
                      <input
                        type="datetime-local"
                        name="expiry_date"
                        value={formData.expiry_date || ''}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border ${errors.expiry_date ? 'border-red-500' : 'border-slate-100 dark:border-slate-700'} focus:border-primary outline-none transition-all dark:text-white`}
                      />
                      <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">
                        Note: Perishable items are automatically removed from the shop once they reach their expiry date.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Michoacán, Mexico"
                    className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border ${errors.location ? 'border-red-500' : 'border-slate-100 dark:border-slate-700'} focus:border-primary outline-none transition-all dark:text-white`}
                  />
                  {errors.location && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{errors.location}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Certifications (comma separated)</label>
                  <input
                    type="text"
                    value={formData.certifications?.join(', ')}
                    onChange={handleCertificationsChange}
                    placeholder="e.g. Organic, Fair Trade"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:border-primary outline-none transition-all dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Product Image</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage || generatingImage}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 hover:border-primary transition-all flex flex-col items-center justify-center gap-2 text-sm font-bold dark:text-white group"
                      >
                        <div className="flex items-center gap-2">
                          {uploadingImage ? (
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">upload</span>
                          )}
                          Upload Picture
                        </div>
                        {uploadingImage && (
                          <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                              className="h-full bg-primary"
                            />
                          </div>
                        )}
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={generateAIImage}
                        disabled={generatingImage || uploadingImage}
                        className="w-full px-4 py-3 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all flex flex-col items-center justify-center gap-2 text-sm font-bold group"
                      >
                        <div className="flex items-center gap-2">
                          {generatingImage ? (
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">auto_awesome</span>
                          )}
                          Generate with AI
                        </div>
                        {generatingImage && (
                          <div className="w-full h-1 bg-primary/20 rounded-full mt-1 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${aiProgress}%` }}
                              className="h-full bg-primary"
                            />
                          </div>
                        )}
                      </button>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-100 dark:border-slate-800"></span>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase tracking-widest font-black text-slate-400 bg-white dark:bg-slate-900 px-2">
                        OR
                      </div>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        name="image_url"
                        value={formData.image_url}
                        onChange={handleChange}
                        placeholder="Paste image URL here..."
                        className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border ${errors.image_url ? 'border-red-500' : 'border-slate-100 dark:border-slate-700'} focus:border-primary outline-none transition-all dark:text-white text-sm`}
                      />
                      {errors.image_url && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{errors.image_url}</p>}
                    </div>
                  </div>

                  <div className="aspect-video sm:aspect-square bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden relative flex items-center justify-center group">
                    {formData.image_url ? (
                      <>
                        <ResponsiveImage 
                          src={formData.image_url} 
                          alt="Preview" 
                          fill
                          className="object-cover" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                            className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                            Remove Image
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center space-y-2 text-slate-400">
                        <span className="material-symbols-outlined text-4xl">image</span>
                        <p className="text-[10px] font-black uppercase tracking-widest">Image Preview</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>

            <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-4 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl text-sm font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-8 py-3 bg-primary text-white rounded-xl text-sm font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {saving ? 'Saving...' : initialData?.id ? 'Update Product' : 'List Product'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
