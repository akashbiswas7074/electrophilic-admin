"use client";

import React from 'react';
import { Button } from '@/components/ui/button';

interface HeroSectionPreviewProps {
  data: {
    _id?: string;
    title: string;
    subtitle: string;
    order?: number;
    isActive?: boolean;
    buttons?: Array<{
      label: string;
      link: string;
      variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    }>;
    [key: string]: any; // Allow for additional properties
  };
}

const HeroSectionPreview: React.FC<HeroSectionPreviewProps> = ({ data }) => {
  const { title, subtitle, buttons = [] } = data;
  
  // Map DB button variants to UI component variants
  const mapVariantToComponentVariant = (variant: string = 'primary') => {
    const variantMap: Record<string, any> = {
      'primary': 'default',
      'secondary': 'secondary',
      'outline': 'outline',
      'ghost': 'ghost'
    };
    
    return variantMap[variant] || 'default';
  };
  
  return (
    <div className="border border-dashed border-gray-300 p-6 rounded-md bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 uppercase">
          {title}
        </h2>
        <p className="text-md md:text-lg text-gray-600 mb-6">
          {subtitle}
        </p>
        
        {buttons && buttons.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3">
            {buttons.map((button, index) => (
              <Button 
                key={index}
                variant={mapVariantToComponentVariant(button.variant)} 
                size="sm"
                className="min-w-[100px] pointer-events-none"
              >
                {button.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroSectionPreview;