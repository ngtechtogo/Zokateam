import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Ad, Category } from '../types';
import { PlusCircle, Search, AlertCircle, Camera, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdCard } from '../components/AdCard';
import { NewsFeed } from '../components/NewsFeed';
import { cn } from '../lib/utils';

export const Home = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalAds: 0 });
  const { user, token, updateUser } = useAuth();

  const fetchAds = (page = 1) => {
    setLoading(true);
    fetch(`/api/ads?page=${page}&limit=10`)
      .then(res => res.json())
      .then(data => {
        setAds(data.ads);
        setPagination(data.pagination);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAds(pagination.currentPage);
    fetch('/api/categories').then(res => res.json()).then(setCategories);
  }, [pagination.currentPage]);

  const locations = Array.from(new Set(ads.map(ad => ad.location))).sort();

  const filteredAds = ads.filter(ad => {
    const matchesSearch = ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || ad.category === selectedCategory;
    const matchesLocation = selectedLocation === 'All' || ad.location === selectedLocation;

    return matchesSearch && matchesCategory && matchesLocation;
  });

  const handlePublish = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPublishError('');
    setIsPublishing(true);
    
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    try {
      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...data, images: selectedImages })
      });

      const result = await res.json();

      if (res.ok) {
        fetchAds(1);
        updateUser({ walletBalance: result.newBalance });
        setShowCreateModal(false);
        setSelectedImages([]);
      } else {
        setPublishError(result.error || "Une erreur est survenue.");
      }
    } catch (err) {
      setPublishError("Impossible de contacter le serveur.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          if (newImages.length === files.length) {
            setSelectedImages(prev => [...prev, ...newImages].slice(0, 5));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const PRICING_PLANS = [
    { id: '7days', label: '7 Jours', price: 500 },
    { id: '30days', label: '30 Jours', price: 1500 },
    { id: '90days', label: '90 Jours', price: 4000 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tight mb-2">Services & Annonces</h1>
          <p className="text-zinc-500">Trouvez ou proposez des services rapides dans votre localité.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select 
            className="w-full sm:w-40 px-4 py-2 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium text-zinc-700"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">Toutes catégories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>

          <select 
            className="w-full sm:w-40 px-4 py-2 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium text-zinc-700"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option value="All">Toutes localités</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          {user && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors font-medium text-sm"
            >
              <PlusCircle size={18} />
              Publier
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-64 bg-zinc-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <AnimatePresence mode="popLayout">
                  {filteredAds.map(ad => (
                    <AdCard key={ad.id} ad={ad} isAuthenticated={!!user} />
                  ))}
                </AnimatePresence>
              </div>

              {pagination.totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-4">
                  <button 
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="p-2 bg-white border border-zinc-200 rounded-xl text-zinc-500 hover:text-zinc-900 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                      <button 
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={cn(
                          "w-10 h-10 rounded-xl text-sm font-bold transition-all",
                          pagination.currentPage === page ? "bg-emerald-600 text-white" : "bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-300"
                        )}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="p-2 bg-white border border-zinc-200 rounded-xl text-zinc-500 hover:text-zinc-900 disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="lg:col-span-1">
          <NewsFeed ads={ads} />
        </div>
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 overflow-y-auto custom-scrollbar">
                <h2 className="text-2xl font-bold text-zinc-900 mb-6">Publier une annonce</h2>
                
                {publishError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
                    <AlertCircle size={18} />
                    {publishError}
                  </div>
                )}

                <form className="space-y-4" onSubmit={handlePublish}>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Titre</label>
                    <input name="title" required className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="Ex: Cours de mathématiques" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Lieu</label>
                      <input name="location" required className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="Ex: Douala, Akwa" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Prix (XAF)</label>
                      <input name="price" type="number" required className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="5000" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Catégorie</label>
                    <select name="category" required className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Description</label>
                    <textarea name="description" required rows={3} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="Décrivez votre service ou produit en détail..." />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Images (Max 5)</label>
                    <div className="grid grid-cols-5 gap-2 mb-2">
                      {selectedImages.map((img, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-200">
                          <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button 
                            type="button" 
                            onClick={() => removeImage(i)}
                            className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      {selectedImages.length < 5 && (
                        <label className="aspect-square rounded-lg border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center text-zinc-400 hover:border-emerald-500 hover:text-emerald-500 transition-all cursor-pointer">
                          <Camera size={20} />
                          <span className="text-[8px] font-bold mt-1 uppercase">Ajouter</span>
                          <input type="file" accept="image/*" multiple className="sr-only" onChange={handleImageChange} />
                        </label>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Plan de publication</label>
                    <div className="grid grid-cols-3 gap-3">
                      {PRICING_PLANS.map((plan) => (
                        <label key={plan.id} className="relative flex flex-col items-center p-3 border border-zinc-200 rounded-xl cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-all has-[:checked]:bg-emerald-50 has-[:checked]:border-emerald-500">
                          <input type="radio" name="planId" value={plan.id} required className="sr-only" defaultChecked={plan.id === '7days'} />
                          <span className="text-xs font-bold text-zinc-900">{plan.label}</span>
                          <span className="text-[10px] text-emerald-600 font-black mt-1">{plan.price} XAF</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => { setShowCreateModal(false); setPublishError(''); setSelectedImages([]); }} className="flex-1 px-6 py-3 border border-zinc-200 text-zinc-600 rounded-xl hover:bg-zinc-50 transition-colors font-medium">Annuler</button>
                    <button type="submit" disabled={isPublishing} className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50">
                      {isPublishing ? 'Publication...' : 'Publier'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
