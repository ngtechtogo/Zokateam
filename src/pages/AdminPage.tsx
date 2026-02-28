import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Category, User, Ad } from '../types';
import { Shield, TrendingUp, Calendar, BarChart3, Users, FileText, Activity, Tag, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency } from '../lib/utils';

export const AdminPage = () => {
  const { token, user: currentUser } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'categories' | 'users' | 'ads'>('dashboard');
  const [editingAd, setEditingAd] = useState<Ad | null>(null);

  const fetchCategories = () => {
    fetch('/api/categories').then(res => res.json()).then(setCategories);
  };

  const fetchUsers = () => {
    fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json()).then(setUsers);
  };

  const fetchStats = () => {
    fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json()).then(setStats);
  };

  const fetchAds = () => {
    fetch('/api/admin/ads', { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json()).then(setAds);
  };

  useEffect(() => {
    fetchCategories();
    if (currentUser?.adminLevel && currentUser.adminLevel > 0) {
      fetchUsers();
      fetchStats();
      fetchAds();
    }
  }, [currentUser]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setLoading(true);
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: newCategory })
    });
    if (res.ok) {
      setNewCategory('');
      fetchCategories();
    }
    setLoading(false);
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Supprimer cette catégorie ?')) return;
    const res = await fetch(`/api/categories/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) fetchCategories();
  };

  const handleUpdateUserRole = async (userId: number, newLevel: number) => {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ adminLevel: newLevel })
    });
    if (res.ok) fetchUsers();
  };

  const handleUpdateAd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingAd) return;
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const res = await fetch(`/api/admin/ads/${editingAd.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      setEditingAd(null);
      fetchAds();
    }
  };

  const handleDeleteAd = async (id: number) => {
    if (!confirm('Supprimer cette annonce ?')) return;
    const res = await fetch(`/api/admin/ads/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) fetchAds();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Administration</h1>
            <p className="text-zinc-500">Gérez la plateforme et les utilisateurs.</p>
          </div>
        </div>

        <div className="flex bg-zinc-100 p-1 rounded-xl">
          {['dashboard', 'categories', 'users', 'ads'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-6 py-2 rounded-lg text-sm font-bold transition-all capitalize",
                activeTab === tab ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              {tab === 'dashboard' ? 'Tableau de bord' : tab}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' ? (
          <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Jour', val: stats?.revenue.day, icon: TrendingUp, color: 'emerald' },
                { label: 'Mois', val: stats?.revenue.month, icon: Calendar, color: 'blue' },
                { label: 'Année', val: stats?.revenue.year, icon: BarChart3, color: 'purple' }
              ].map((s) => (
                <div key={s.label} className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", `bg-${s.color}-100 text-${s.color}-600`)}>
                      <s.icon size={20} />
                    </div>
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Recette du {s.label}</span>
                  </div>
                  <p className="text-3xl font-black text-zinc-900">{formatCurrency(s.val || 0)}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Utilisateurs', val: stats?.counts.users, icon: Users },
                { label: 'Articles Publiés', val: stats?.counts.ads, icon: FileText },
                { label: 'Visiteurs du Jour', val: stats?.counts.visitors, icon: Activity },
                { label: 'En Ligne', val: stats?.counts.online, icon: Activity, pulse: true }
              ].map((s) => (
                <div key={s.label} className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    {s.pulse ? <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> : <s.icon size={16} className="text-zinc-400" />}
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{s.label}</span>
                  </div>
                  <p className="text-2xl font-black text-zinc-900">{s.val || 0}</p>
                </div>
              ))}
            </div>

            {/* New Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-zinc-900 mb-4 uppercase tracking-wider">Annonces par Catégorie</h3>
                <div className="space-y-3">
                  {stats?.adsByCategory.map((item: any) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <span className="text-sm text-zinc-600">{item.category}</span>
                      <div className="flex items-center gap-3 flex-1 mx-4">
                        <div className="h-2 bg-zinc-100 rounded-full flex-1 overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full" 
                            style={{ width: `${stats.counts.ads > 0 ? (item.count / stats.counts.ads) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-zinc-900 w-8 text-right">{item.count}</span>
                      </div>
                    </div>
                  ))}
                  {(!stats?.adsByCategory || stats.adsByCategory.length === 0) && (
                    <p className="text-sm text-zinc-400 text-center py-4">Aucune donnée disponible</p>
                  )}
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex flex-col justify-center items-center text-center">
                <h3 className="text-sm font-bold text-zinc-900 mb-6 uppercase tracking-wider">Taux d'Activation</h3>
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      className="text-zinc-100"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={364.4}
                      strokeDashoffset={364.4 - (364.4 * (stats?.activationRate || 0)) / 100}
                      className="text-emerald-500 transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-zinc-900">{Math.round(stats?.activationRate || 0)}%</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Actif</span>
                  </div>
                </div>
                <p className="mt-6 text-xs text-zinc-500 leading-relaxed">
                  Pourcentage d'annonces publiées qui n'ont pas encore expiré.
                </p>
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'categories' ? (
          <motion.div key="categories" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm h-fit">
              <h3 className="font-bold text-zinc-900 mb-4">Ajouter une catégorie</h3>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <input type="text" placeholder="Nom" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
                <button type="submit" disabled={loading} className="w-full py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50">Ajouter</button>
              </form>
            </div>
            <div className="md:col-span-2 bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50"><h3 className="font-bold text-zinc-900">Catégories</h3></div>
              <div className="divide-y divide-zinc-100">
                {categories.map(cat => (
                  <div key={cat.id} className="px-6 py-4 flex items-center justify-between group">
                    <div className="flex items-center gap-3"><Tag size={16} className="text-zinc-400" /><span className="font-medium text-zinc-900">{cat.name}</span></div>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-zinc-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'ads' ? (
          <motion.div key="ads" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100">
                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Annonce</th>
                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Auteur</th>
                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Prix</th>
                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {ads.map(ad => (
                    <tr key={ad.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {ad.images?.[0] && <img src={ad.images[0]} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />}
                          <div className="flex flex-col"><span className="font-bold text-zinc-900">{ad.title}</span><span className="text-[10px] text-zinc-400 font-bold uppercase">{ad.category}</span></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500">{ad.author}</td>
                      <td className="px-6 py-4 font-bold text-emerald-600">{formatCurrency(ad.price)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditingAd(ad)} className="p-2 text-zinc-400 hover:text-emerald-600"><FileText size={18} /></button>
                          <button onClick={() => handleDeleteAd(ad.id)} className="p-2 text-zinc-400 hover:text-red-600"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100">
                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Utilisateur</th>
                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Rôle</th>
                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 font-bold text-xs">{u.fullName.charAt(0)}</div><span className="font-bold text-zinc-900">{u.fullName}</span></div></td>
                      <td className="px-6 py-4 text-sm text-zinc-500">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest", u.adminLevel === 2 ? "bg-zinc-900 text-white" : u.adminLevel === 1 ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500")}>
                          {u.adminLevel === 2 ? 'SuperAdmin' : u.adminLevel === 1 ? 'Admin' : 'Utilisateur'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select className="bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs" value={u.adminLevel} onChange={(e) => handleUpdateUserRole(u.id, parseInt(e.target.value))} disabled={currentUser?.id === u.id && u.adminLevel === 2}>
                          <option value={0}>Utilisateur</option>
                          <option value={1}>Admin</option>
                          {currentUser?.adminLevel === 2 && <option value={2}>SuperAdmin</option>}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {editingAd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/90 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-zinc-900">Modifier l'annonce</h3>
              <button onClick={() => setEditingAd(null)} className="p-2 text-zinc-400 hover:text-zinc-600"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto custom-scrollbar p-8">
              <form onSubmit={handleUpdateAd} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Titre</label><input name="title" defaultValue={editingAd.title} required className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl" /></div>
                  <div><label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Prix</label><input name="price" type="number" defaultValue={editingAd.price} required className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl" /></div>
                  <div><label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Localité</label><input name="location" defaultValue={editingAd.location} required className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl" /></div>
                  <div><label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Catégorie</label><select name="category" defaultValue={editingAd.category} required className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl">{categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}</select></div>
                </div>
                <div><label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Description</label><textarea name="description" defaultValue={editingAd.description} required rows={4} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl resize-none" /></div>
                <div><label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Expiration</label><input name="expiryDate" type="datetime-local" defaultValue={new Date(editingAd.expiry_date).toISOString().slice(0, 16)} required className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl" /></div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setEditingAd(null)} className="px-6 py-3 text-zinc-500 font-bold">Annuler</button>
                  <button type="submit" className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold">Enregistrer</button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
