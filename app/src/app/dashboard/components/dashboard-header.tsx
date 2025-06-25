'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Youtube, LogOut, Settings } from 'lucide-react';
import { Session } from 'next-auth';

interface DashboardHeaderProps {
  session: Session;
}

export function DashboardHeader({ session }: DashboardHeaderProps) {
  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="bg-red-600 p-2 rounded-lg mr-3">
              <Youtube className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">TubeSpy</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={session.user.image || ''} alt={session.user.name} />
              <AvatarFallback>
                {session.user.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
              <p className="text-xs text-gray-500">{session.user.email}</p>
            </div>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
} 