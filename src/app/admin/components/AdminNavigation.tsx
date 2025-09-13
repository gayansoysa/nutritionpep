"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Database, 
  Users, 
  BarChart3, 
  Settings, 
  Upload,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";

// Navigation items for admin
const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    description: "Overview and statistics"
  },
  {
    title: "Foods",
    href: "/admin/foods",
    icon: Database,
    description: "Manage food database"
  },
  {
    title: "External APIs",
    href: "/admin/external-apis",
    icon: Globe,
    description: "API integrations and monitoring"
  },
  {
    title: "Import",
    href: "/admin/import",
    icon: Upload,
    description: "Import from external sources"
  }
];

export default function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {adminNavItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
              "group",
              isActive 
                ? "bg-blue-100 text-blue-900 border-r-2 border-blue-500" 
                : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            <item.icon className={cn(
              "mr-3 h-5 w-5 transition-colors",
              isActive 
                ? "text-blue-600" 
                : "text-gray-400 group-hover:text-gray-500"
            )} />
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="text-xs text-gray-500">{item.description}</div>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}