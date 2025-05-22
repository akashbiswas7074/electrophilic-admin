"use client";

import React from 'react';
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
  className?: string;
}

export function MobileFab({ 
  onClick, 
  icon, 
  label, 
  className 
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "mobile-fab bg-blue-600 text-white",
        className
      )}
    >
      {icon}
      {label && (
        <span className="sr-only">{label}</span>
      )}
    </button>
  );
}

export default MobileFab;
