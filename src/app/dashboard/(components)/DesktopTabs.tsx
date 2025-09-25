"use client";

import { usePathname } from "next/navigation";

export default function DesktopTabs() {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Today",
      href: "/dashboard/today",
    },
    {
      name: "History", 
      href: "/dashboard/history",
    },
    {
      name: "Analytics",
      href: "/dashboard/analytics",
    },
    {
      name: "Recipes",
      href: "/dashboard/recipes",
    },
  ];

  return (
    <div className="hidden sm:flex border-b border-border/50 mb-6">
      <nav className="flex gap-6">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          
          return (
            <a
              key={tab.name}
              href={tab.href}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-all ${
                isActive
                  ? "border-primary text-primary bg-primary/5 rounded-t-lg"
                  : "border-transparent hover:border-primary/30 text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.name}
            </a>
          );
        })}
      </nav>
    </div>
  );
}