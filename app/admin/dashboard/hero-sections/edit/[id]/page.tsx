"use client";

import React, { useEffect, useState } from 'react';
import HeroSectionForm from '../../hero-section-form';
import { notFound } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface EditHeroSectionPageProps {
  params: Promise<{ id: string }>;
}

export default function EditHeroSectionPage({ params }: EditHeroSectionPageProps) {
  const [section, setSection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string>('');
  const { toast } = useToast();

  // Unwrap params promise
  useEffect(() => {
    const unwrapParams = async () => {
      const unwrappedParams = await params;
      setId(unwrappedParams.id);
    };
    unwrapParams();
  }, [params]);

  useEffect(() => {
    const fetchSection = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Use the new API endpoint instead of server actions
        const response = await fetch(`/api/admin/hero-sections/${id}`);
        const result = await response.json();
        
        if (result.success && result.section) {
          setSection(result.section);
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to fetch hero section",
            variant: "destructive",
          });
          notFound();
        }
      } catch (error: any) {
        console.error('Error fetching hero section:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading the section",
          variant: "destructive",
        });
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchSection();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading hero section...</p>
        </div>
      </div>
    );
  }

  if (!section) {
    notFound();
  }

  return <HeroSectionForm mode="edit" initialData={section} />;
}