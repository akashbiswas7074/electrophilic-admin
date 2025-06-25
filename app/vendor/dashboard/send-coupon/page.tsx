"use client";

import { useState, FormEvent, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Assuming Select is from Shadcn/UI
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RiMailSendLine, RiCoupon3Line } from 'react-icons/ri';

interface MessageState {
  type: "success" | "error" | "";
  content: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Coupon {
  _id: string;
  code: string;
  discountValue: number; // Or string, depending on your model
  description?: string;
}

export default function SendCouponPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [toEmail, setToEmail] = useState(""); // Can be auto-filled or manually entered
  const [selectedCouponId, setSelectedCouponId] = useState<string>("");
  const [couponCode, setCouponCode] = useState(""); // Can be auto-filled

  const [userName, setUserName] = useState(""); // Optional, can be auto-filled
  const [customMessage, setCustomMessage] = useState(""); // Optional: Custom message for the email
  const [discountDetails, setDiscountDetails] = useState(""); // Optional: e.g., "10% off", can be auto-filled
  const [expiryDate, setExpiryDate] = useState(""); // Optional: e.g., "2023-12-31"
  
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<MessageState>({ type: "", content: "" });

  useEffect(() => {
    // Fetch users
    fetch("/api/admin/users-list")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUsers(data.users);
        }
      })
      .catch(console.error);

    // Fetch coupons
    fetch("/api/admin/coupons-list")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCoupons(data.coupons);
        }
      })
      .catch(console.error);
  }, []);

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    const selectedUser = users.find(user => user._id === userId);
    if (selectedUser) {
      setToEmail(selectedUser.email);
      setUserName(selectedUser.name);
    } else {
      setToEmail("");
      setUserName("");
    }
  };

  const handleCouponChange = (couponId: string) => {
    setSelectedCouponId(couponId);
    const selectedCoupon = coupons.find(coupon => coupon._id === couponId);
    if (selectedCoupon) {
      setCouponCode(selectedCoupon.code);
      setDiscountDetails(selectedCoupon.description || `Discount: ${selectedCoupon.discountValue}`);
    } else {
      setCouponCode("");
      setDiscountDetails("");
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage({ type: "", content: "" });

    if (!toEmail || !couponCode) {
      setStatusMessage({ type: "error", content: "Recipient Email and Coupon Code are required." });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/send-coupon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: toEmail,
          couponCode,
          userName,
          message: customMessage,
          discountDetails,
          expiryDate,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatusMessage({ type: "success", content: result.message || "Coupon email sent successfully!" });
        // Clear some fields after successful send, but maybe not user/coupon selection
        setCustomMessage("");
        setExpiryDate("");
      } else {
        setStatusMessage({ type: "error", content: result.message || "Failed to send coupon email." });
      }
    } catch (error) {
      console.error("Error sending coupon email:", error);
      setStatusMessage({ type: "error", content: "An unexpected error occurred." });
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8"> 
      <Card className="max-w-3xl mx-auto shadow-lg"> 
        <CardHeader className="bg-gray-50 dark:bg-gray-800 p-6 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <RiCoupon3Line className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">Send Coupon to User</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">Select a user and a coupon to send a promotional email.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="userSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Select User*</Label>
                <Select value={selectedUserId} onValueChange={handleUserChange} required>
                  <SelectTrigger id="userSelect" className="w-full">
                    <SelectValue placeholder="Select a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="couponSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Select Coupon*</Label>
                <Select value={selectedCouponId} onValueChange={handleCouponChange} required>
                  <SelectTrigger id="couponSelect" className="w-full">
                    <SelectValue placeholder="Select a coupon..." />
                  </SelectTrigger>
                  <SelectContent>
                    {coupons.map(coupon => (
                      <SelectItem key={coupon._id} value={coupon._id}>
                        {coupon.code} - {coupon.description || coupon.discountValue}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="toEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Recipient Email (Auto-filled)</Label>
              <Input
                id="toEmail"
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)} // Allow manual override if needed
                placeholder="user@example.com"
                required
                className="w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                readOnly // Or make it editable if manual input is desired
              />
            </div>

            <div>
              <Label htmlFor="couponCodeDisplay" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Coupon Code (Auto-filled)</Label>
              <Input
                id="couponCodeDisplay"
                type="text"
                value={couponCode}
                readOnly
                className="w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                placeholder="Selected coupon code"
              />
            </div>
            
            <div>
              <Label htmlFor="discountDetailsDisplay" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Discount Details (Auto-filled)</Label>
              <Input
                id="discountDetailsDisplay"
                type="text"
                value={discountDetails}
                readOnly
                className="w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                placeholder="Selected coupon details"
              />
            </div>

            <div>
              <Label htmlFor="customMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Custom Message (Optional)</Label>
              <Textarea
                id="customMessage"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add a personal touch to your email..."
                rows={4}
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Expiry Date (Optional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full"
              />
            </div>

            {statusMessage.content && (
              <div
                className={`p-3.5 rounded-md text-sm font-medium ${ 
                  statusMessage.type === "success"
                    ? "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
                    : "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"
                }`}
              >
                {statusMessage.content}
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto text-base py-2.5 px-6 flex items-center justify-center space-x-2">
                <RiMailSendLine className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? "Sending Coupon..." : "Send Coupon Email"}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
