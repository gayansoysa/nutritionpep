"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon, CameraIcon, MagnifyingGlassIcon, Cross1Icon } from "@radix-ui/react-icons";

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      icon: <MagnifyingGlassIcon className="h-5 w-5" />,
      label: "Search Food",
      href: "/dashboard/search",
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      icon: <CameraIcon className="h-5 w-5" />,
      label: "Scan Barcode", 
      href: "/dashboard/scan",
      color: "bg-green-500 hover:bg-green-600"
    }
  ];

  return (
    <div className="fixed bottom-20 right-4 z-40 sm:hidden">
      {/* Action buttons */}
      <div className={`flex flex-col gap-3 mb-3 transition-all duration-300 ${
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        {actions.map((action, index) => (
          <div key={action.label} className="flex items-center gap-3">
            <div className="bg-black/80 text-white px-3 py-1 rounded-lg text-sm font-medium backdrop-blur-sm">
              {action.label}
            </div>
            <Button
              size="icon"
              className={`h-12 w-12 rounded-full shadow-lg ${action.color} text-white`}
              asChild
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <a href={action.href}>
                {action.icon}
              </a>
            </Button>
          </div>
        ))}
      </div>

      {/* Main FAB */}
      <Button
        size="icon"
        className={`h-14 w-14 rounded-full shadow-lg transition-all duration-300 ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-600 rotate-45' 
            : 'bg-primary hover:bg-primary/90'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <Cross1Icon className="h-6 w-6 text-white" />
        ) : (
          <PlusIcon className="h-6 w-6 text-white" />
        )}
      </Button>
    </div>
  );
}