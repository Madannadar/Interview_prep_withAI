import { isAuthenticated } from '@/lib/actions/Auth.action'
import Image from 'next/image'
import Link from 'next/link'
import React, { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import SignOutButton from '@/components/SignOutButton'

const RootLayout = async ({ children }: { children: ReactNode }) => {
  const isUserAuthenticated = await isAuthenticated();
  if (!isUserAuthenticated) redirect('/sign-in');

  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-8 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Logo" width={38} height={32} />
          <h2 className="text-lg font-semibold">PrepWise</h2>
        </Link>
        <div>
          <SignOutButton />
        </div>
      </nav>

      <main className="px-8 py-6">
        {children}
      </main>
    </div>
  );
};

export default RootLayout;
