import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Transaction } from '../types';
import { Wallet, PlusCircle, CreditCard, ArrowDownLeft, ArrowUpRight, Clock, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency } from '../lib/utils';

export const WalletPage = () => {
  const { user, token, updateUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetch('/api/wallet/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(setTransactions);
    }
  }, [token]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/wallet/deposit', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount: parseFloat(amount), phone, provider: 'Mobile Money' })
    });

    if (res.ok) {
      const data = await res.json();
      updateUser({ walletBalance: data.balance });
      fetch('/api/wallet/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()).then(setTransactions);
      setShowDepositModal(false);
      setAmount('');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="md:col-span-2 bg-zinc-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Wallet size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-zinc-400 text-sm font-medium mb-1">Solde disponible</p>
            <h2 className="text-5xl font-black tracking-tight mb-8">{formatCurrency(user?.walletBalance || 0)}</h2>
            <button 
              onClick={() => setShowDepositModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-400 transition-colors font-bold"
            >
              <PlusCircle size={20} />
              Recharger le compte
            </button>
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
            <CreditCard size={32} />
          </div>
          <h3 className="font-bold text-zinc-900 mb-2">Paiement Sécurisé</h3>
          <p className="text-zinc-500 text-sm">Vos transactions sont protégées par notre système de cryptage.</p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden">
        <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-zinc-900">Historique des transactions</h3>
          <Clock size={20} className="text-zinc-400" />
        </div>
        <div className="divide-y divide-zinc-100">
          {transactions.length === 0 ? (
            <div className="p-12 text-center text-zinc-400">
              <p>Aucune transaction pour le moment.</p>
            </div>
          ) : (
            transactions.map(tx => (
              <div key={tx.id} className="px-8 py-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    tx.type === 'deposit' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                  )}>
                    {tx.type === 'deposit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">{tx.type === 'deposit' ? 'Rechargement' : (tx.description || 'Paiement Service')}</p>
                    <p className="text-xs text-zinc-500">{new Date(tx.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("font-bold", tx.type === 'deposit' ? "text-emerald-600" : "text-red-600")}>
                    {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                  <div className="flex items-center justify-end gap-1 text-[10px] uppercase font-bold tracking-wider text-emerald-500">
                    <CheckCircle2 size={10} />
                    {tx.status}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {showDepositModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDepositModal(false)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-zinc-900">Recharger</h2>
                    <p className="text-zinc-500 text-sm">Via Mobile Money (Orange/MTN)</p>
                  </div>
                </div>
                
                <form className="space-y-4" onSubmit={handleDeposit}>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Numéro de téléphone</label>
                    <input 
                      type="tel" 
                      required 
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                      placeholder="6xx xxx xxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Montant (XAF)</label>
                    <input 
                      type="number" 
                      required 
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                      placeholder="Ex: 5000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3">
                    <AlertCircle className="text-emerald-600 shrink-0" size={20} />
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      Une demande de confirmation sera envoyée sur votre téléphone. Veuillez valider la transaction avec votre code secret.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setShowDepositModal(false)} className="flex-1 px-6 py-3 border border-zinc-200 text-zinc-600 rounded-xl hover:bg-zinc-50 transition-colors font-medium">Annuler</button>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-bold disabled:opacity-50"
                    >
                      {loading ? 'Traitement...' : 'Confirmer'}
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
