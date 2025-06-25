"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { getHeroSectionById } from '@/lib/database/actions/hero-section.actions';
import Image from 'next/image';
import Link from 'next/link';
import { MdArrowBack, MdEdit } from 'react-icons/md';

// Pattern preview components
const PatternPreview = ({ pattern, title }: { pattern: string, title: string }) => {
  const getPatternDetails = () => {
    switch(pattern) {
      case 'standard':
        return {
          name: 'Standard',
          description: 'Centered text with buttons below',
          previewUrl: '/images/patterns/standard-preview.png'
        };
      case 'dont-miss':
        return {
          name: 'Don\'t Miss',
          description: 'Dark background with prominent product feature',
          previewUrl: '/images/patterns/dont-miss-preview.png'
        };
      case 'brand-control':
        return {
          name: 'Brand Control',
          description: 'Side-by-side image and text layout',
          previewUrl: '/images/patterns/brand-control-preview.png' 
        };
      case 'partner':
        return {
          name: 'Partner',
          description: 'Text on left, media on right',
          previewUrl: '/images/patterns/partner-preview.png'
        };
      default:
        return {
          name: 'Unknown',
          description: 'Pattern not recognized',
          previewUrl: '/images/patterns/default-preview.png'
        };
    }
  };
  
  const patternInfo = getPatternDetails();
  
  return (
    <div className="border rounded-md p-4 mb-4">
      <h3 className="text-lg font-semibold mb-2">Pattern: {patternInfo.name}</h3>
      <p className="text-muted-foreground mb-2">{patternInfo.description}</p>
      
      {/* Placeholder for pattern preview - replace with actual previews */}
      <div className="bg-muted rounded-md p-4 flex items-center justify-center border-2 border-dashed">
        <div className="w-full max-w-md aspect-[16/9] relative bg-gradient-to-r from-slate-100 to-slate-200 rounded-md overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className={`flex ${pattern === 'partner' ? 'flex-row' : 'flex-col'} gap-4 w-full h-full`}>
              <div className={`flex flex-col ${pattern === 'partner' ? 'w-1/2' : 'w-full'} justify-center items-${pattern === 'standard' ? 'center' : 'start'} p-4`}>
                <div className="w-3/4 h-4 bg-slate-300 rounded mb-2"></div>
                <div className="w-1/2 h-3 bg-slate-300 rounded mb-4"></div>
                <div className="flex gap-2">
                  <div className="w-20 h-8 bg-slate-400 rounded"></div>
                  <div className="w-20 h-8 bg-slate-300 rounded"></div>
                </div>
              </div>
              {(pattern === 'partner' || pattern === 'brand-control') && (
                <div className="bg-slate-300 rounded w-1/2 h-full"></div>
              )}
            </div>
          </div>
          <div className="text-slate-400 text-center font-medium">
            {title} - {patternInfo.name} Pattern
          </div>
        </div>
      </div>
    </div>
  );
};

interface ViewHeroSectionPageProps {
  params: Promise<{ id: string }>; // Updated to Promise type
}

export default function ViewHeroSectionPage({ params }: ViewHeroSectionPageProps) {
  const { id } = React.use(params); // Use React.use() to unwrap params
  const [section, setSection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchSection = async () => {
      setLoading(true);
      try {
        const result = await getHeroSectionById(id); // Use id directly
        if (result.success && result.section) {
          setSection(result.section);
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to fetch hero section",
            variant: "destructive",
          });
          router.push('/admin/dashboard/hero-sections');
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
        router.push('/admin/dashboard/hero-sections');
      } finally {
        setLoading(false);
      }
    };

    fetchSection();
  }, [id]); // Updated dependency

  if (loading) {
    return <div className="container mx-auto p-4 text-center">Loading hero section data...</div>;
  }

  if (!section) {
    return <div className="container mx-auto p-4 text-center">Hero section not found</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()} title="Go back">
            <MdArrowBack size={20} />
          </Button>
          <h1 className="text-2xl font-bold">Hero Section Details</h1>
        </div>
        <Link href={`/admin/dashboard/hero-sections/edit/${section._id}`}>
          <Button className="flex items-center gap-2">
            <MdEdit size={20} />
            Edit Section
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">ID</h3>
                <p className="font-mono text-sm bg-muted p-2 rounded">{section._id}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Title</h3>
                <p className="text-lg font-semibold">{section.title}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Subtitle</h3>
                <p>{section.subtitle}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Status</h3>
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    section.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {section.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Order</h3>
                  <p>{section.order}</p>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Content Alignment</h3>
                <p className="capitalize">{section.contentAlignment || 'Center'}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Layout ID</h3>
                <p>{section.layoutId || 'None'}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Created At</h3>
                <p>{new Date(section.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Last Updated</h3>
                <p>{new Date(section.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pattern & Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pattern preview */}
            <PatternPreview pattern={section.pattern} title={section.title} />
            
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Media Type</h3>
              <p className="capitalize">{section.mediaType || 'None'}</p>
            </div>

            {section.mediaUrl && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Media Preview</h3>
                <div className="border rounded overflow-hidden mt-2">
                  {section.mediaType === 'video' ? (
                    <video 
                      src={section.mediaUrl} 
                      controls 
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="relative aspect-[16/9]">
                      <Image 
                        src={section.mediaUrl} 
                        alt={section.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {section.backgroundImage && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Background Image</h3>
                <div className="border rounded overflow-hidden mt-2">
                  <div className="relative aspect-[16/9]">
                    <Image 
                      src={section.backgroundImage} 
                      alt="Background"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {section.buttons && section.buttons.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {section.buttons.map((button: any, index: number) => (
                    <div key={index} className="border rounded-md p-4">
                      <h3 className="font-semibold mb-2">Button {index + 1}</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Label:</span> {button.label}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Link:</span> {button.link}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Variant:</span> {button.variant}
                        </div>
                        <div className="pt-2">
                          <Button 
                            variant={button.variant}
                            className="w-full"
                            disabled
                          >
                            {button.label}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No buttons defined</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Raw Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
              {JSON.stringify(section, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}