"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  CalendarIcon, 
  ClockIcon, 
  MagnifyingGlassIcon, 
  CameraIcon, 
  GearIcon,
  BarChartIcon
} from "@radix-ui/react-icons";
import { Book } from "lucide-react";
import { useSwipeNavigation } from "@/lib/hooks/useSwipeNavigation";

export default function BottomTabs() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  const tabs = [
    {
      name: "Today",
      href: "/dashboard/today",
      icon: <ClockIcon className="h-6 w-6" />,
      badge: null,
    },
    {
      name: "Analytics",
      href: "/dashboard/analytics",
      icon: <BarChartIcon className="h-6 w-6" />,
      badge: null,
    },
    {
      name: "Recipes",
      href: "/recipes",
      icon: <Book className="h-6 w-6" />,
      badge: null,
    },
    {
      name: "Search",
      href: "/dashboard/search",
      icon: <MagnifyingGlassIcon className="h-6 w-6" />,
      badge: null,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: <GearIcon className="h-6 w-6" />,
      badge: null,
    },
  ];

  // Initialize swipe navigation
  const { getCurrentTabIndex } = useSwipeNavigation(tabs, pathname, {
    threshold: 60,
    velocity: 0.3,
    preventScroll: false
  });

  // Auto-hide navigation on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down & past threshold
        setIsVisible(false);
      } else {
        // Scrolling up or at top
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div 
      className={`sm:hidden fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      {/* Background with enhanced blur and shadow */}
      <div className="bg-background/95 backdrop-blur-xl border-t border-border/50 shadow-lg shadow-black/5">
        {/* Active tab indicator line */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
        
        <nav className="flex justify-around px-1 py-2">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            
            return (
              <a
                key={tab.name}
                href={tab.href}
                className={`relative flex flex-col items-center py-3 px-4 rounded-2xl transition-all duration-300 ease-out min-w-[64px] min-h-[64px] active:scale-95 ${
                  isActive
                    ? "text-primary bg-primary/15 shadow-lg shadow-primary/20 scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60 hover:scale-102"
                }`}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-pulse" />
                )}
                
                {/* Icon container with enhanced animations */}
                <div className={`relative transition-all duration-300 ease-out ${
                  isActive ? 'scale-110 -translate-y-0.5' : 'hover:scale-105'
                }`}>
                  {tab.icon}
                  
                  {/* Badge for notifications */}
                  {tab.badge && (
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {tab.badge}
                    </div>
                  )}
                </div>
                
                {/* Label with improved typography */}
                <span className={`text-xs mt-1.5 font-semibold transition-all duration-300 ease-out ${
                  isActive 
                    ? 'text-primary opacity-100 transform translate-y-0' 
                    : 'opacity-75 transform translate-y-0.5'
                }`}>
                  {tab.name}
                </span>
                
                {/* Ripple effect on tap */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-current opacity-0 transition-opacity duration-150 active:opacity-10" />
                </div>
              </a>
            );
          })}
        </nav>
        
        {/* Safe area padding for devices with home indicator */}
        <div className="h-safe-area-inset-bottom" />
      </div>
    </div>
  );
}