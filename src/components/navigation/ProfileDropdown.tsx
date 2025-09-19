"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Settings, 
  LogOut, 
  Shield,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'moderator' | 'admin';
}

interface User {
  id: string;
  email: string;
}

interface ProfileDropdownProps {
  user: User;
  profile: Profile | null;
}

export function ProfileDropdown({ user, profile }: ProfileDropdownProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Error signing out: " + error.message);
      } else {
        toast.success("Signed out successfully");
        // Use window.location for a full page refresh to clear all state
        window.location.href = "/login";
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const isAdmin = profile?.role === 'admin' || profile?.role === 'moderator';
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';
  const initials = profile?.full_name 
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-10 w-auto px-2 rounded-full hover:bg-muted/50 transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 ring-2 ring-transparent hover:ring-primary/20 transition-all">
              <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
              <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-primary to-primary/70 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start max-w-[120px]">
              <span className="text-sm font-medium leading-none truncate w-full">
                {displayName}
              </span>
              <span className="text-xs text-muted-foreground leading-none mt-0.5 truncate w-full">
                {user.email}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64" align="end" forceMount sideOffset={8}>
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-border">
                <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-primary to-primary/70 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <p className="text-sm font-medium leading-none truncate">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground mt-1 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge 
                variant={
                  profile?.role === 'admin' 
                    ? 'default' 
                    : profile?.role === 'moderator' 
                    ? 'secondary' 
                    : 'outline'
                }
                className="text-xs capitalize"
              >
                {profile?.role || 'user'}
              </Badge>
              {isAdmin && (
                <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                  Admin Access
                </Badge>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => handleNavigation('/profile')}
          className="cursor-pointer py-2.5 focus:bg-muted/50"
        >
          <User className="mr-3 h-4 w-4" />
          <div className="flex flex-col">
            <span className="text-sm">Profile</span>
            <span className="text-xs text-muted-foreground">View your profile</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleNavigation('/dashboard/settings')}
          className="cursor-pointer py-2.5 focus:bg-muted/50"
        >
          <Settings className="mr-3 h-4 w-4" />
          <div className="flex flex-col">
            <span className="text-sm">Settings</span>
            <span className="text-xs text-muted-foreground">Manage preferences</span>
          </div>
        </DropdownMenuItem>
        
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleNavigation('/admin')}
              className="cursor-pointer py-2.5 focus:bg-orange-50 dark:focus:bg-orange-950/20"
            >
              <Shield className="mr-3 h-4 w-4 text-orange-600" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-orange-600">Admin Dashboard</span>
                <span className="text-xs text-muted-foreground">System administration</span>
              </div>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="cursor-pointer py-2.5 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
          disabled={isLoading}
        >
          <LogOut className="mr-3 h-4 w-4" />
          <div className="flex flex-col">
            <span className="text-sm">{isLoading ? 'Signing out...' : 'Sign out'}</span>
            <span className="text-xs text-muted-foreground">End your session</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}