'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Gọi hàm logout để làm sạch React State và localStorage
    logout();
    
    // Chuyển hướng người dùng về trang đăng nhập
    router.push('/login');
  }, [logout, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#09090b] text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground text-sm font-medium animate-pulse">Logging out of MangaFlow system...</p>
      </div>
    </div>
  );
}