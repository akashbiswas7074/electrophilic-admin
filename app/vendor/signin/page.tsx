"use client";
import React, { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import {
  Button,
  PasswordInput,
  TextInput,
  Notification,
  LoadingOverlay,
  Box,
  Card,
  Title,
  Text,
  Anchor,
} from "@mantine/core";
import { isEmail, useForm } from "@mantine/form";
import { useRouter } from "next/navigation";
import Link from "next/link";

const VendorSignInPage = () => {
  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: isEmail("Invalid Email."),
      password: (value) => (value.length < 6 ? "Password must be at least 6 characters long." : null),
    },
  });
  
  const [successMessage, setSuccessMessage] = useState(false);
  const [failureMessage, setFailureMessage] = useState<{
    visible: boolean;
    message: string | undefined;
  }>({ visible: false, message: "" });
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setLoading(true);
      setFailureMessage({ visible: false, message: "" });

      const result = await signIn("vendor", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "VendorNotApproved") {
          setFailureMessage({
            visible: true,
            message: "Your vendor account is pending admin approval. Please wait for approval before signing in.",
          });
        } else {
          setFailureMessage({
            visible: true,
            message: "Invalid email or password.",
          });
        }
      } else if (result?.ok) {
        setSuccessMessage(true);
        setFailureMessage({ visible: false, message: "" });
        
        // Get the session to check user role and redirect appropriately
        const session = await getSession();
        if (session?.user?.role === "vendor") {
          setTimeout(() => {
            router.push("/vendor/dashboard");
          }, 1500);
        }
      }
    } catch (error: any) {
      console.log(error);
      setFailureMessage({ visible: true, message: "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card shadow="lg" padding="xl" radius="md" className="w-full max-w-md">
        <Box pos="relative">
          {loading && (
            <LoadingOverlay
              visible={loading}
              zIndex={1000}
              overlayProps={{ radius: "sm", blur: 2 }}
            />
          )}
          
          <div className="text-center mb-8">
            <Title order={1} className="text-2xl font-bold mb-2">
              Vendor Sign In
            </Title>
            <Text color="dimmed" size="sm">
              Sign in to your vendor dashboard
            </Text>
          </div>

          {failureMessage.visible && (
            <Notification color="red" title="Error!" mb="md" onClose={() => setFailureMessage({ visible: false, message: "" })}>
              {failureMessage.message}
            </Notification>
          )}
          
          {successMessage && (
            <Notification color="teal" title="Successfully signed in" mb="md">
              Redirecting to vendor dashboard...
            </Notification>
          )}

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput
              {...form.getInputProps("email")}
              label="Email"
              placeholder="Enter your email"
              required
              mb="md"
            />

            <PasswordInput
              {...form.getInputProps("password")}
              label="Password"
              placeholder="Enter your password"
              required
              mb="lg"
            />

            <Button type="submit" fullWidth loading={loading} disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="text-center mt-6">
            <Text size="sm" color="dimmed">
              Don't have a vendor account?{" "}
              <Anchor component={Link} href="/vendor/signup" size="sm">
                Sign up here
              </Anchor>
            </Text>
          </div>
          
          <div className="text-center mt-4">
            <Text size="sm" color="dimmed">
              Are you an admin?{" "}
              <Anchor component={Link} href="/admin/login" size="sm">
                Admin Login
              </Anchor>
            </Text>
          </div>
        </Box>
      </Card>
    </div>
  );
};

export default VendorSignInPage;