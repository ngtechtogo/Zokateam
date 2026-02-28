import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Shield, Menu, X, Home, Wallet, User as UserIcon, Settings } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  onNavigate: (tab: string) => void;
  activeTab: string;
}

export const Navbar = ({ onNavigate, activeTab }: NavbarProps) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Accueil', icon: Home, show: true },
    { id: 'wallet', label: 'Portefeuille', icon: Wallet, show: !!user },
    { id: 'profile', label: 'Profil', icon: UserIcon, show: !!user },
    { id: 'admin', label: 'Admin', icon: Shield, show: !!user?.adminLevel && user.adminLevel > 0 },
  ];

  const handleNavigate = (tab: string) => {
    onNavigate(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavigate('home')}>
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900">FeSA</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.filter(item => item.show).map(item => (
              <button 
                key={item.id}
                onClick={() => onNavigate(item.id)} 
                className={cn(
                  "text-sm font-medium transition-colors flex items-center gap-1.5", 
                  activeTab === item.id ? "text-emerald-600" : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                {item.id === 'admin' && <item.icon size={14} />}
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-medium text-zinc-500">{user.fullName}</span>
                  <span className="text-sm font-bold text-emerald-600">{formatCurrency(user.walletBalance)}</span>
                </div>
                <div className="relative">
                  {user.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt={user.fullName} 
                      className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold border-2 border-emerald-500">
                      {user.fullName.charAt(0)}
                    </div>
                  )}
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white",
                    user.onlineStatus === 'online' ? "bg-emerald-500" : user.onlineStatus === 'away' ? "bg-amber-500" : "bg-zinc-400"
                  )} />
                </div>
                <button 
                  onClick={logout}
                  className="hidden md:block p-2 text-zinc-500 hover:text-red-600 transition-colors"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <button onClick={() => onNavigate('login')} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900">Connexion</button>
                <button onClick={() => onNavigate('register')} className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors">S'inscrire</button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-zinc-100 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              {user && (
                <div className="flex items-center gap-4 pb-4 border-b border-zinc-100">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold border-2 border-emerald-500">
                    {user.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">{user.fullName}</p>
                    <p className="text-sm font-bold text-emerald-600">{formatCurrency(user.walletBalance)}</p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-2">
                {navItems.filter(item => item.show).map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                      activeTab === item.id ? "bg-emerald-50 text-emerald-600" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                    )}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </button>
                ))}
                
                {!user ? (
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <button onClick={() => handleNavigate('login')} className="px-4 py-3 text-sm font-bold text-zinc-600 bg-zinc-100 rounded-xl">Connexion</button>
                    <button onClick={() => handleNavigate('register')} className="px-4 py-3 text-sm font-bold text-white bg-emerald-600 rounded-xl">S'inscrire</button>
                  </div>
                ) : (
                  <button 
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all mt-4"
                  >
                    <LogOut size={18} />
                    Déconnexion
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
