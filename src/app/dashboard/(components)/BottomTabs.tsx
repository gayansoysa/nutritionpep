"use client";

import { usePathname } from "next/navigation";
import { 
  CalendarIcon, 
  ClockIcon, 
  MagnifyingGlassIcon, 
  CameraIcon, 
  GearIcon,
  BarChartIcon
} from "@radix-ui/react-icons";
import { Book } from "lucide-react";

export default function BottomTabs() {
  const pathname = usePathname();
  
  const tabs = [
    {
      name: "Today",
      href: "/dashboard/today",
      icon: <ClockIcon className="h-5 w-5" />,
    },
    {
      name: "Analytics",
      href: "/dashboard/analytics",
      icon: <BarChartIcon className="h-5 w-5" />,
    },
    {
      name: "Recipes",
      href: "/recipes",
      icon: <Book className="h-5 w-5" />,
    },
    {
      name: "Search",
      href: "/dashboard/search",
      icon: <MagnifyingGlassIcon className="h-5 w-5" />,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: <GearIcon className="h-5 w-5" />,
    },
  ];

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border/50 safe-area-pb">
      <nav className="flex justify-around px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          
          return (
            <a
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-primary bg-primary/10 scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                {tab.icon}
              </div>
              <span className={`text-xs mt-1 font-medium transition-all duration-200 ${
                isActive ? 'text-primary' : ''
              }`}>
                {tab.name}
              </span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}