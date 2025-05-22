"use client";

import React, { useEffect, useState } from 'react';
import HeroSectionForm from '../../hero-section-form';
import { getHeroSectionById } from '@/lib/database/actions/hero-section.actions';
import { notFound } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface EditHeroSectionPageProps {
  params: {
    id: string;
  };
}

export default function EditHeroSectionPage({ params }: EditHeroSectionPageProps) {
  const [section, setSection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { id } = params;

  useEffect(() => {
    const fetchSection = async () => {
      try {
        const result = await getHeroSectionById(id);
        
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
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        notFound();
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSection();
    }
  }, [id, toast]);

  if (loading) {
    return <div className="container mx-auto p-4 md:p-6 text-center">Loading hero section...</div>;
  }

  if (!section) {
    notFound();
  }

  return <HeroSectionForm mode="edit" initialData={section} />;
}