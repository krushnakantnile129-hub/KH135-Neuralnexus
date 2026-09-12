"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AddDealPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/merchant');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-zinc-500 text-xs font-semibold">
      Redirecting to Merchant Hub...
    </div>
  );
}

