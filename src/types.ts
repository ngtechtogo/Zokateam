export interface User {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  walletBalance: number;
  adminLevel: number; // 0: User, 1: Admin, 2: SuperAdmin
  profilePicture?: string;
  bio?: string;
  onlineStatus: 'online' | 'away' | 'offline';
  created_at: string;
}

export interface Ad {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  category: string;
  author_id: number;
  author: string;
  images: string[];
  expiry_date: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  amount: number;
  type: 'deposit' | 'payment' | 'withdrawal';
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
}
