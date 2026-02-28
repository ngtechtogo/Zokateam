import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Ad } from '../types';
import { User as UserIcon, Camera, Upload, X, CheckCircle2, MapPin, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency } from '../lib/utils';

export const ProfilePage = () => {
  const { user, token, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
  const [onlineStatus, setOnlineStatus] = useState(user?.onlineStatus || 'offline');
  const [bio, setBio] = useState(user?.bio || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userAds, setUserAds] = useState<Ad[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (token) {
      fetch('/api/ads/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(setUserAds);
    }
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setShowCamera(false);
      alert("Impossible d'accéder à la caméra.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setProfilePicture(dataUrl);
        stopCamera();
      }
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ fullName, phone, profilePicture, onlineStatus, bio })
    });

    if (res.ok) {
      updateUser({ fullName, phone, profilePicture, onlineStatus, bio });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setShowSettings(false);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm sticky top-24">
            <div className="h-24 bg-zinc-900 relative">
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                <div className="relative">
                  {user?.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt={user.fullName} 
                      className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-lg"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-3xl bg-emerald-500 border-4 border-white flex items-center justify-center text-white text-4xl font-black shadow-lg">
                      {user?.fullName.charAt(0)}
                    </div>
                  )}
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white",
                    user?.onlineStatus === 'online' ? "bg-emerald-500" : user?.onlineStatus === 'away' ? "bg-amber-500" : "bg-zinc-400"
                  )} />
                </div>
              </div>
            </div>
            <div className="pt-14 px-6 pb-8 text-center">
              <h2 className="text-xl font-bold text-zinc-900 mb-1">{user?.fullName}</h2>
              <p className="text-zinc-500 text-sm mb-4">{user?.email}</p>
              
              {user?.bio && (
                <p className="text-zinc-600 text-xs italic mb-6 line-clamp-3 px-2">
                  "{user.bio}"
                </p>
              )}
              
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl hover:bg-zinc-200 transition-colors font-bold text-sm"
                >
                  <UserIcon size={16} />
                  {showSettings ? 'Voir mes annonces' : 'Paramètres du profil'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {showSettings ? (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm"
              >
                <h3 className="text-2xl font-bold text-zinc-900 mb-6">Paramètres</h3>
                <form className="space-y-6" onSubmit={handleUpdate}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Nom complet</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Téléphone</label>
                      <input 
                        type="tel" 
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Photo de profil</label>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="relative group">
                        {profilePicture ? (
                          <img 
                            src={profilePicture} 
                            alt="Preview" 
                            className="w-24 h-24 rounded-3xl object-cover border-2 border-zinc-200"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-3xl bg-zinc-100 border-2 border-dashed border-zinc-300 flex items-center justify-center text-zinc-400">
                            <UserIcon size={32} />
                          </div>
                        )}
                        {profilePicture && (
                          <button 
                            type="button"
                            onClick={() => setProfilePicture('')}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <button 
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 transition-colors font-bold text-xs"
                        >
                          <Upload size={14} />
                          Choisir un fichier
                        </button>
                        <button 
                          type="button"
                          onClick={startCamera}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 transition-colors font-bold text-xs"
                        >
                          <Camera size={14} />
                          Prendre une photo
                        </button>
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          className="sr-only" 
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>
                  </div>

                  {showCamera && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/90 backdrop-blur-sm">
                      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-md">
                        <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
                          <h4 className="font-bold text-zinc-900">Prendre une photo</h4>
                          <button onClick={stopCamera} className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors">
                            <X size={20} />
                          </button>
                        </div>
                        <div className="relative aspect-video bg-black">
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className="w-full h-full object-cover"
                          />
                          <canvas ref={canvasRef} className="hidden" />
                        </div>
                        <div className="p-6 flex justify-center">
                          <button 
                            type="button"
                            onClick={captureImage}
                            className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-emerald-700 transition-all hover:scale-110 active:scale-95"
                          >
                            <Camera size={32} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Bio / À propos</label>
                    <textarea 
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[100px] resize-none text-sm" 
                      placeholder="Parlez-nous un peu de vous ou de vos services..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Statut de présence</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'online', label: 'En ligne', color: 'bg-emerald-500' },
                        { id: 'away', label: 'Absent', color: 'bg-amber-500' },
                        { id: 'offline', label: 'Hors ligne', color: 'bg-zinc-400' }
                      ].map((status) => (
                        <label key={status.id} className="relative flex items-center gap-2 p-3 border border-zinc-200 rounded-xl cursor-pointer hover:bg-zinc-50 transition-all has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                          <input 
                            type="radio" 
                            name="onlineStatus" 
                            value={status.id} 
                            className="sr-only" 
                            checked={onlineStatus === status.id}
                            onChange={() => setOnlineStatus(status.id as any)}
                          />
                          <div className={cn("w-2 h-2 rounded-full", status.color)} />
                          <span className="text-xs font-bold text-zinc-900">{status.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-bold disabled:opacity-50"
                    >
                      {loading ? 'Mise à jour...' : 'Sauvegarder'}
                    </button>
                    
                    {success && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-emerald-600 font-bold text-sm"
                      >
                        <CheckCircle2 size={18} />
                        Mis à jour !
                      </motion.div>
                    )}
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                key="ads"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold text-zinc-900">Mes annonces</h3>
                  <span className="px-3 py-1 bg-zinc-100 text-zinc-500 rounded-full text-xs font-bold">
                    {userAds.length} publication{userAds.length > 1 ? 's' : ''}
                  </span>
                </div>

                {userAds.length === 0 ? (
                  <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center">
                    <div className="w-16 h-16 bg-zinc-50 text-zinc-300 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Tag size={32} />
                    </div>
                    <p className="text-zinc-500 font-medium">Vous n'avez pas encore publié d'annonce.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {userAds.map(ad => (
                      <div key={ad.id} className="bg-white border border-zinc-200 rounded-2xl p-4 flex items-center justify-between hover:border-emerald-200 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-lg">
                            {ad.title.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors">{ad.title}</h4>
                            <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                              <span className="flex items-center gap-1"><MapPin size={10} /> {ad.location}</span>
                              <span className="flex items-center gap-1"><Tag size={10} /> {ad.category}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-emerald-600">{formatCurrency(ad.price)}</p>
                          <p className="text-[10px] text-zinc-400 font-mono">Expire le {new Date(ad.expiry_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
