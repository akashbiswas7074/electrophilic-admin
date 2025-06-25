"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function VendorPendingApproval() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // Clear the vendor token
      document.cookie = "vendor_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      
      // Redirect to vendor login page
      router.push("/vendor/signin");
    } catch (error) {
      console.error("Error logging out:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Application Under Review</CardTitle>
          <CardDescription>
            Your vendor application is pending approval
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-yellow-800 text-sm">
              Thank you for registering as a vendor. Our team is currently reviewing your application.
              You'll receive an email notification once your account is approved.
            </p>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700">What happens next?</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
              <li>Our team reviews all vendor applications within 1-2 business days</li>
              <li>You'll receive an email notification when your account is approved</li>
              <li>Once approved, you can access the vendor dashboard and start adding products</li>
              <li>If your application requires additional information, we'll contact you</li>
            </ul>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-3">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => router.refresh()}
          >
            Check Status Again
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full text-gray-500" 
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging out...
              </>
            ) : (
              "Logout"
            )}
          </Button>
          
          <div className="text-xs text-center text-gray-500 mt-4">
            Need help? <Link href="/contact" className="text-primary hover:underline">Contact Support</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}