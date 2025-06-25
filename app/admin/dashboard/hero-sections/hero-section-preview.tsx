"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Play, Pause, Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';

interface HeroSectionPreviewProps {
  data: {
    _id?: string;
    title: string;
    subtitle: string;
    longDescription?: string;
    order?: number;
    isActive?: boolean;
    pattern?: string;
    contentAlignment?: string;
    backgroundImage?: string;
    mediaUrl?: string;
    mediaType?: string;
    titleColor?: string;
    descriptionColor?: string;
    buttonTextColor?: string;
    buttonBackgroundColor?: string;
    entryAnimation?: string;
    buttons?: Array<{
      label: string;
      link: string;
      variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    }>;
    [key: string]: any;
  };
}

const HeroSectionPreview: React.FC<HeroSectionPreviewProps> = ({ data }) => {
  const { 
    title, 
    subtitle, 
    longDescription,
    pattern = 'standard',
    contentAlignment = 'center',
    backgroundImage,
    mediaUrl,
    mediaType = 'image',
    titleColor,
    descriptionColor,
    buttonTextColor,
    buttonBackgroundColor,
    entryAnimation = 'fadeIn',
    buttons = [],
    isActive
  } = data;

  // Interactive states
  const [isHovered, setIsHovered] = useState(false);
  const [videoIsPlaying, setVideoIsPlaying] = useState(false);
  const [videoIsMuted, setVideoIsMuted] = useState(true);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const videoRef = useRef<HTMLVideoElement>(null);
  
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

  // Enhanced video controls
  const handleVideoToggle = () => {
    if (videoRef.current) {
      if (videoIsPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setVideoIsPlaying(!videoIsPlaying);
    }
  };

  const handleVideoMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoIsMuted;
      setVideoIsMuted(!videoIsMuted);
    }
  };

  // Animation classes based on entry animation
  const getAnimationClass = () => {
    const baseClass = 'transition-all duration-700 ease-out';
    if (!isHovered) return `${baseClass} opacity-90`;
    
    switch (entryAnimation) {
      case 'slideInLeft': return `${baseClass} opacity-100 animate-slide-in-left`;
      case 'slideInRight': return `${baseClass} opacity-100 animate-slide-in-right`;
      case 'slideInUp': return `${baseClass} opacity-100 animate-slide-in-up`;
      case 'zoomIn': return `${baseClass} opacity-100 animate-zoom-in`;
      case 'bounceIn': return `${baseClass} opacity-100 animate-bounce-in`;
      default: return `${baseClass} opacity-100 animate-fade-in`;
    }
  };

  // Enhanced media component
  const MediaComponent = ({ className = "" }: { className?: string }) => {
    if (!mediaUrl) return null;

    return (
      <div className={cn("relative overflow-hidden rounded-xl shadow-lg group", className)}>
        {mediaType === 'video' ? (
          <>
            <video
              ref={videoRef}
              src={mediaUrl}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              muted={videoIsMuted}
              loop
              playsInline
              onPlay={() => setVideoIsPlaying(true)}
              onPause={() => setVideoIsPlaying(false)}
            />
            {/* Video controls overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleVideoToggle}
                    className="h-8 w-8 p-0 bg-white/20 backdrop-blur-sm hover:bg-white/30 border-0"
                  >
                    {videoIsPlaying ? <Pause size={12} /> : <Play size={12} />}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleVideoMute}
                    className="h-8 w-8 p-0 bg-white/20 backdrop-blur-sm hover:bg-white/30 border-0"
                  >
                    {videoIsMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  </Button>
                </div>
                <Badge className="bg-black/30 text-white border-0 text-xs">HD</Badge>
              </div>
            </div>
          </>
        ) : (
          <div className="relative">
            <Image 
              src={mediaUrl} 
              alt="Hero media preview" 
              width={400} 
              height={300}
              className={cn(
                "w-full h-full object-cover transition-all duration-500 group-hover:scale-105",
                isImageLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setIsImageLoaded(true)}
            />
            {!isImageLoaded && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                <div className="text-gray-400 text-sm">Loading...</div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        )}
      </div>
    );
  };

  // Enhanced button component
  const PreviewButton = ({ button, index }: { button: any; index: number }) => (
    <Button 
      key={index}
      variant={mapVariantToComponentVariant(button.variant)} 
      size="sm"
      className={cn(
        "pointer-events-none transform transition-all duration-300 shadow-md hover:shadow-lg min-w-[100px]",
        isHovered && "scale-105"
      )}
      style={{
        backgroundColor: buttonBackgroundColor || undefined,
        color: buttonTextColor || undefined,
        animationDelay: `${index * 100}ms`
      }}
    >
      {button.label}
    </Button>
  );

  // Pattern-specific previews with enhanced UI
  const renderPatternPreview = () => {
    const commonProps = {
      className: getAnimationClass(),
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false)
    };

    switch (pattern) {
      case 'dont-miss':
        return (
          <div {...commonProps} className={cn("bg-gray-900 text-white p-8 rounded-xl relative overflow-hidden", getAnimationClass())}>
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-white to-transparent rounded-full -translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-white to-transparent rounded-full translate-x-24 translate-y-24"></div>
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1">
                <h3 
                  className="text-2xl md:text-3xl font-black mb-3 uppercase tracking-wider"
                  style={{ color: titleColor || 'white' }}
                >
                  {title || "DON'T MISS"}
                </h3>
                <p 
                  className="text-lg mb-6 opacity-90 leading-relaxed"
                  style={{ color: descriptionColor || 'rgba(255,255,255,0.9)' }}
                >
                  {subtitle || "Dark background with prominent product feature"}
                </p>
                {longDescription && (
                  <p className="text-sm mb-6 opacity-75 max-w-md">
                    {longDescription}
                  </p>
                )}
                {buttons.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {buttons.map((button, index) => (
                      <PreviewButton key={index} button={button} index={index} />
                    ))}
                  </div>
                )}
              </div>
              {mediaUrl && (
                <div className="w-48 h-36 flex-shrink-0">
                  <MediaComponent className="w-full h-full" />
                </div>
              )}
            </div>
          </div>
        );

      case 'brand-control':
        return (
          <div {...commonProps} className={cn("bg-white p-8 rounded-xl border-2 border-gray-100 relative overflow-hidden", getAnimationClass())}>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-50 to-transparent rounded-full translate-x-12 -translate-y-12"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              {mediaUrl && (
                <div className="w-48 h-36 flex-shrink-0 order-2 md:order-1">
                  <MediaComponent className="w-full h-full" />
                </div>
              )}
              <div className="flex-1 order-1 md:order-2">
                <h3 
                  className="text-2xl md:text-3xl font-bold mb-4 relative"
                  style={{ color: titleColor || '#1f2937' }}
                >
                  {title || "Establish brand control."}
                  <div className="absolute -bottom-1 left-0 w-16 h-1 bg-blue-500 rounded-full"></div>
                </h3>
                <p 
                  className="text-lg mb-6 leading-relaxed"
                  style={{ color: descriptionColor || '#6b7280' }}
                >
                  {subtitle || "Side-by-side image and text layout"}
                </p>
                {longDescription && (
                  <p className="text-sm mb-6 text-gray-600 max-w-md">
                    {longDescription}
                  </p>
                )}
                {buttons.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {buttons.map((button, index) => (
                      <PreviewButton key={index} button={button} index={index} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'partner':
        return (
          <div {...commonProps} className={cn("bg-gradient-to-br from-gray-50 to-white p-8 rounded-xl border-2 border-gray-100 relative overflow-hidden", getAnimationClass())}>
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-transparent rounded-full -translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-blue-100 to-transparent rounded-full translate-x-20 translate-y-20"></div>
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <h3 
                  className="text-2xl md:text-3xl font-bold mb-4 relative"
                  style={{ color: titleColor || '#1f2937' }}
                >
                  {title || "We're on the same team."}
                  <div className="absolute -bottom-1 left-0 w-16 h-1 bg-purple-500 rounded-full"></div>
                </h3>
                <p 
                  className="text-lg mb-6 leading-relaxed"
                  style={{ color: descriptionColor || '#6b7280' }}
                >
                  {subtitle || "Text on left, media on right"}
                </p>
                {longDescription && (
                  <p className="text-sm mb-6 text-gray-600 max-w-md">
                    {longDescription}
                  </p>
                )}
                {buttons.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {buttons.map((button, index) => (
                      <PreviewButton key={index} button={button} index={index} />
                    ))}
                  </div>
                )}
              </div>
              {mediaUrl && (
                <div className="w-48 h-36 flex-shrink-0">
                  <MediaComponent className="w-full h-full" />
                </div>
              )}
            </div>
          </div>
        );

      case 'standard':
      default:
        return (
          <div 
            {...commonProps}
            className={cn(
              "relative overflow-hidden rounded-xl min-h-[300px] flex items-center justify-center p-8",
              backgroundImage ? "text-white" : "bg-gradient-to-br from-gray-50 via-white to-gray-100",
              getAnimationClass()
            )}
            style={{
              backgroundImage: backgroundImage ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Background decorative elements */}
            {!backgroundImage && (
              <>
                <div className="absolute top-0 left-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50 -translate-x-16 -translate-y-16"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-3xl opacity-50 translate-x-16 translate-y-16"></div>
              </>
            )}
            
            <div 
              className={cn(
                "text-center max-w-4xl mx-auto space-y-6 relative z-10",
                contentAlignment === 'left' && "text-left",
                contentAlignment === 'right' && "text-right"
              )}
            >
              <h2 
                className="text-3xl md:text-5xl font-black leading-tight tracking-tight"
                style={{ 
                  color: titleColor || (backgroundImage ? 'white' : '#1f2937'),
                  textShadow: backgroundImage ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none'
                }}
              >
                {title || "Your Hero Title"}
              </h2>
              <p 
                className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto"
                style={{ 
                  color: descriptionColor || (backgroundImage ? 'rgba(255,255,255,0.9)' : '#6b7280')
                }}
              >
                {subtitle || "Your hero subtitle goes here"}
              </p>
              
              {longDescription && (
                <p 
                  className="text-base leading-relaxed max-w-xl mx-auto opacity-80"
                  style={{ 
                    color: descriptionColor || (backgroundImage ? 'rgba(255,255,255,0.8)' : '#6b7280')
                  }}
                >
                  {longDescription}
                </p>
              )}
              
              {buttons.length > 0 && (
                <div className="flex flex-wrap justify-center gap-4 pt-4">
                  {buttons.map((button, index) => (
                    <PreviewButton key={index} button={button} index={index} />
                  ))}
                </div>
              )}
              
              {mediaUrl && (
                <div className="mt-8 max-w-3xl mx-auto">
                  <MediaComponent />
                </div>
              )}
            </div>
          </div>
        );
    }
  };
  
  return (
    <Card className="relative overflow-hidden bg-white shadow-md hover:shadow-lg transition-all duration-300 group">
      {/* Header with controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start">
        <div className="flex gap-2">
          <Badge 
            variant="outline" 
            className="text-xs bg-white/90 backdrop-blur-sm border-gray-200"
          >
            {pattern} Pattern
          </Badge>
          <Badge 
            variant="outline" 
            className="text-xs bg-white/90 backdrop-blur-sm border-gray-200"
          >
            {entryAnimation}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          {/* Preview mode toggle */}
          <div className="flex bg-white/90 backdrop-blur-sm rounded-md border border-gray-200 overflow-hidden">
            <Button
              size="sm"
              variant={previewMode === 'desktop' ? 'default' : 'ghost'}
              className="h-6 px-2 text-xs rounded-none"
              onClick={() => setPreviewMode('desktop')}
            >
              Desktop
            </Button>
            <Button
              size="sm"
              variant={previewMode === 'mobile' ? 'default' : 'ghost'}
              className="h-6 px-2 text-xs rounded-none"
              onClick={() => setPreviewMode('mobile')}
            >
              Mobile
            </Button>
          </div>
          
          <Badge 
            variant={isActive ? 'default' : 'secondary'} 
            className="text-xs bg-white/90 backdrop-blur-sm"
          >
            {isActive ? (
              <><Eye size={10} className="mr-1" /> Active</>
            ) : (
              <><EyeOff size={10} className="mr-1" /> Inactive</>
            )}
          </Badge>
        </div>
      </div>
      
      {/* Main preview content */}
      <CardContent className="p-0 pt-16">
        <div 
          className={cn(
            "transition-all duration-300",
            previewMode === 'mobile' && "max-w-sm mx-auto"
          )}
        >
          {renderPatternPreview()}
        </div>
      </CardContent>
      
      {/* Footer with metadata */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex justify-between items-center text-xs text-gray-600">
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <span className="font-medium">Order:</span> {data.order || 'N/A'}
            </span>
            <span className="flex items-center gap-1">
              <span className="font-medium">Buttons:</span> {buttons.length}
            </span>
            {mediaUrl && (
              <span className="flex items-center gap-1">
                <span className="font-medium">Media:</span> {mediaType}
              </span>
            )}
            {contentAlignment !== 'center' && (
              <span className="flex items-center gap-1">
                <span className="font-medium">Align:</span> {contentAlignment}
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="font-mono text-gray-400">
              ID: {data._id?.slice(-8) || 'New'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default HeroSectionPreview;