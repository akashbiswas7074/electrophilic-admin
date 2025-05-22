"use client";

import { useState, useEffect, useRef } from "react";

export interface WebsiteFooter {
  _id?: string;
  id?: string;
  name?: string;
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    linkedin?: string;
  };
  companyLinks?: Array<{
    title: string;
    url: string;
  }>;
  shopLinks?: Array<{
    title: string;
    url: string;
  }>;
  helpLinks?: Array<{
    title: string;
    url: string;
  }>;
  copyrightText?: string;
  isActive: boolean;
}

interface UseWebsiteFooterResult {
  footer: WebsiteFooter | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch website footer configuration
 * Falls back to default values if no active footer config is found
 */
export function useWebsiteFooter(): UseWebsiteFooterResult {
  // Default fallback footer configuration
  const defaultFooter: WebsiteFooter = {
    contactInfo: {
      email: "support@vibecart.com",
      phone: "+1 (123) 456-7890",
      address: "123 VIBECart St, New York, NY 10001"
    },
    socialMedia: {
      facebook: "https://facebook.com/vibecart",
      twitter: "https://twitter.com/vibecart",
      instagram: "https://instagram.com/vibecart",
      youtube: "",
      linkedin: ""
    },
    companyLinks: [
      { title: "About Us", url: "/about" },
      { title: "Contact Us", url: "/contact" }
    ],
    shopLinks: [
      { title: "All Products", url: "/shop" },
      { title: "New Arrivals", url: "/shop/new-arrivals" }
    ],
    helpLinks: [
      { title: "FAQs", url: "/faqs" },
      { title: "Shipping", url: "/shipping" }
    ],
    copyrightText: "© 2023 VIBECart. All rights reserved.",
    isActive: true
  };
  
  const [footer, setFooter] = useState<WebsiteFooter | null>(defaultFooter);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchInitiated = useRef(false);

  const fetchFooter = async () => {
    fetchInitiated.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/website/footer", {
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

      if (data.success && data.footer) {
        setFooter(data.footer);
      } else {
        // Keep using default footer
        console.log("No active footer found, using default footer");
      }
    } catch (err: any) {
      console.error("Error fetching website footer:", err.message);
      setError(`Error: ${err.message}`);
      // Keep using default footer
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Skip if we've already initiated a fetch
    if (fetchInitiated.current) return;
    
    fetchFooter();
  }, []);

  return { 
    footer, 
    isLoading, 
    error, 
    refetch: fetchFooter 
  };
}

export default useWebsiteFooter;