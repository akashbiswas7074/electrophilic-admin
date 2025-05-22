"use client";

import { useState, useEffect, useRef } from "react";

interface WebsiteLogo {
  _id?: string;
  name: string;
  logoUrl: string;
  altText: string;
  isActive: boolean;
  mobileLogoUrl?: string;
}

interface UseWebsiteLogoResult {
  logo: WebsiteLogo | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch the active website logo
 * Falls back to default values if no active logo is found
 */
export function useWebsiteLogo(): UseWebsiteLogoResult {
  // Default fallback logo
  const defaultLogo = {
    name: "VIBECart",
    logoUrl: "/images/logo.png",
    altText: "VIBECart Logo",
    isActive: true,
  };
  
  const [logo, setLogo] = useState<WebsiteLogo | null>(defaultLogo);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const fetchInitiated = useRef(false);

  const fetchLogo = async () => {
    fetchInitiated.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/website/logo", {
        cache: "no-store",
        headers: {
          "Pragma": "no-cache",
          "Cache-Control": "no-cache"
        }
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.logo) {
        setLogo(data.logo);
      } else {
        // Keep using default logo
        console.log("No active logo found, using default logo");
      }
    } catch (err: any) {
      console.error("Error fetching website logo:", err.message);
      setError(`Error: ${err.message}`);
      // Keep using default logo
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Skip if we've already initiated a fetch
    if (fetchInitiated.current) return;
    
    fetchLogo();
    
    // Cleanup
    return () => {
      // Any cleanup code if needed
    };
  }, []); 

  return { 
    logo, 
    isLoading, 
    error, 
    refetch: fetchLogo 
  };
}

export default useWebsiteLogo;