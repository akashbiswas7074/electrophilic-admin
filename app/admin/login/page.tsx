"use client";
import { useState } from "react";
import { TextInput, PasswordInput, Button, Container } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useRouter } from "next/navigation";
import { toast, Toaster } from 'react-hot-toast';
import { RiAdminLine } from 'react-icons/ri';
import { FiMail, FiLock } from 'react-icons/fi';
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) => (value.length < 6 ? "Password too short" : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setLoading(true);
      
      // First try using the direct API endpoint for admin login
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success) {
        // Also authenticate with NextAuth as a fallback
        try {
          await signIn("admin", {
            email: values.email,
            password: values.password,
            redirect: false
          });
        } catch (authError) {
          console.error("NextAuth signin error:", authError);
          // Continue even if NextAuth fails as we already have the token from the API
        }
        
        toast.success('Login successful! Redirecting...');
        
        // Give the toast time to appear before redirect
        setTimeout(() => {
          router.push("/admin/dashboard");
          router.refresh(); // Refresh to update authentication state
        }, 1000);
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      
      <Container size="xs" className="relative w-full max-w-md">
        {/* Admin Icon */}
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg">
            <RiAdminLine className="text-white" size={32} />
          </div>
        </div>
        
        {/* Login Form */}
        <div className="bg-white backdrop-blur-md rounded-xl shadow-xl p-5 sm:p-8 pt-12 border border-gray-100 relative">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h1>
            <p className="text-gray-500 text-sm">Access your admin dashboard</p>
          </div>

          <form onSubmit={form.onSubmit(handleSubmit)} className="space-y-6">
            <TextInput
              label="Email Address"
              placeholder="Enter your email"
              size="md"
              radius="lg"
              rightSection={<FiMail size={18} className="text-gray-500" />}
              {...form.getInputProps("email")}
              classNames={{
                input: "border-gray-200 focus:border-blue-500 text-base h-12",
                label: "text-gray-700 font-medium mb-1"
              }}
            />

            <PasswordInput
              label="Password"
              placeholder="Enter your password"
              size="md"
              radius="lg"
              rightSection={<FiLock size={18} className="text-gray-500" />}
              {...form.getInputProps("password")}
              classNames={{
                input: "border-gray-200 focus:border-blue-500 text-base h-12",
                label: "text-gray-700 font-medium mb-1",
                innerInput: "h-12"
              }}
            />

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="md"
              radius="lg"
              className="bg-blue-600 hover:bg-blue-700 transition-colors mt-8 h-14 text-base font-medium"
              loaderProps={{ color: 'white' }}
            >
              {loading ? "Authenticating..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              Secure portal access • Admin only
            </p>
            <div className="flex justify-center mt-4">
              <Link href="/" className="text-center block text-sm text-blue-500 hover:underline mt-4">
                Go back to home page
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
