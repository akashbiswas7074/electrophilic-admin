"use client";

import React, { useEffect, useState } from "react";
import { getSingleVendor } from "@/lib/database/actions/admin/vendor.actions";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle,
  Copy,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function VendorViewPage() {
  const params = useParams();
  const id = params?.id as string;
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchVendor = async () => {
        setLoading(true);
        try {
          const result = await getSingleVendor(id);
          if (result && result.success) {
            setVendor(result.vendor);
          } else {
            setError(result?.message || "Failed to fetch vendor details.");
          }
        } catch (err: any) {
          setError(
            err.message || "An error occurred while fetching vendor details."
          );
        } finally {
          setLoading(false);
        }
      };
      fetchVendor();
    }
  }, [id]);

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: message,
      duration: 2000,
    });
  };

  if (loading) {
    return <VendorSkeleton />;
  }

  if (error || !vendor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold text-red-500">Error</h2>
        <p className="text-gray-600 mt-2">{error || "Vendor not found"}</p>
        <Button asChild className="mt-4">
          <Link href="/admin/dashboard/vendors">Back to Vendors</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/dashboard/vendors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Vendor Details</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Vendor Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={vendor.image || ""} alt={vendor.name} />
                  <AvatarFallback>
                    {vendor.name
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {vendor.name}
                    <Badge variant={vendor.verified ? "success" : "destructive"}>
                      {vendor.verified ? "Verified" : "Pending"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>Vendor ID: {vendor._id}</CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  copyToClipboard(vendor._id, "Vendor ID copied to clipboard")
                }
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy ID
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="business">Business Info</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">
                      {vendor.verified ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" /> Verified
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center gap-1">
                          <XCircle className="h-4 w-4" /> Pending Verification
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Registration Date
                    </p>
                    <p className="font-medium">
                      {new Date(vendor.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <div className="flex items-center gap-1">
                      <p className="font-medium">{vendor.email}</p>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5"
                        onClick={() =>
                          copyToClipboard(
                            vendor.email,
                            "Email copied to clipboard"
                          )
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <div className="flex items-center gap-1">
                      <p className="font-medium">{vendor.phoneNumber}</p>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5"
                        onClick={() =>
                          copyToClipboard(
                            vendor.phoneNumber,
                            "Phone copied to clipboard"
                          )
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {vendor.description && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Description
                    </p>
                    <p className="text-sm">{vendor.description}</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="contact" className="py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <div className="flex items-center gap-1">
                      <p className="font-medium">{vendor.email}</p>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5"
                        onClick={() =>
                          copyToClipboard(
                            vendor.email,
                            "Email copied to clipboard"
                          )
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <div className="flex items-center gap-1">
                      <p className="font-medium">{vendor.phoneNumber}</p>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5"
                        onClick={() =>
                          copyToClipboard(
                            vendor.phoneNumber,
                            "Phone copied to clipboard"
                          )
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {vendor.address && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium">{vendor.address}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          ZIP / Postal Code
                        </p>
                        <p className="font-medium">{vendor.zipCode}</p>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="business" className="py-4 space-y-4">
                <div className="space-y-3">
                  {vendor.businessName && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Business Name
                      </p>
                      <p className="font-medium">{vendor.description}</p>
                    </div>
                  )}
                  {vendor.businessType && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Business Type
                      </p>
                      <p className="font-medium">{vendor.businessType}</p>
                    </div>
                  )}
                  {vendor.taxId && (
                    <div>
                      <p className="text-sm text-muted-foreground">Tax ID</p>
                      <p className="font-medium">{vendor.taxId}</p>
                    </div>
                  )}
                  {vendor.website && (
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      <a
                        href={vendor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary flex items-center gap-1"
                      >
                        {vendor.website}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vendor.verified ? (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => {
                      // Implement status change functionality
                      toast({
                        title: "Not implemented",
                        description: "Status change functionality",
                        variant: "destructive",
                      });
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Revoke Verification
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      // Implement status change functionality
                      toast({
                        title: "Not implemented",
                        description: "Status change functionality",
                      });
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Verify Vendor
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    window.location.href = `mailto:${vendor.email}`;
                  }}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
                <Link
                  href={`/admin/dashboard/vendors/edit/${vendor._id}`}
                  passHref
                >
                  <Button variant="outline" className="w-full">
                    Edit Vendor
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Stats Card - Can be expanded */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Products</span>
                  <span className="font-medium">-</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Orders</span>
                  <span className="font-medium">-</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Revenue</span>
                  <span className="font-medium">-</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function VendorSkeleton() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center gap-2">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-8 w-48" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Skeleton className="h-[400px] w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    </div>
  );
}