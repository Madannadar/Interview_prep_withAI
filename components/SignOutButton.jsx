'use client';

import { useRouter } from 'next/navigation';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/firebase/client';
import { signOut as serverSignOut } from '@/lib/actions/Auth.action';
import { Button } from '@/components/ui/button';

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth); // clears Firebase client-side
      await serverSignOut(); // clears your custom session (cookie)
      router.push('/sign-in');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <Button onClick={handleSignOut} className="btn">
      Sign Out
    </Button>
  );
}
