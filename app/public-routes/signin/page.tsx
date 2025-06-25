"use client";
import React, { useState } from "react";
import {
  Button,
  PasswordInput,
  TextInput,
  Notification,
  LoadingOverlay,
  Box,
} from "@mantine/core";
import { isEmail, useForm } from "@mantine/form";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

const SignInPage = () => {
  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: isEmail("Invalid Email."),
      password: (value) =>
        value.length < 6 ? "Password must be at least 6 characters long." : null,
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

      if (result?.ok) {
        setSuccessMessage(true);
        setFailureMessage({ visible: false, message: "" });
        setTimeout(() => {
          router.push("/vendor/dashboard");
          router.refresh();
        }, 2000);
      } else if (result?.error) {
        setSuccessMessage(false);
        let errorMessage = "Invalid credentials. Please try again.";

        if (result.error === "VendorNotApproved") {
          errorMessage =
            "Your vendor account is pending admin approval. Please wait for approval before signing in.";
        } else if (result.error === "CredentialsSignin") {
          errorMessage = "Invalid email or password. Please check your credentials.";
        }

        setFailureMessage({
          visible: true,
          message: errorMessage,
        });
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      setFailureMessage({
        visible: true,
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Vendor Sign In</h1>
          <p className="mt-2 text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/public-routes/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Register here
            </Link>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Admin login is available{" "}
            <Link
              href="/admin/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              here
            </Link>
          </p>
        </div>

        {failureMessage.visible && (
          <Notification
            color="red"
            title="Sign In Failed"
            onClose={() => setFailureMessage({ visible: false, message: "" })}
          >
            {failureMessage.message}
          </Notification>
        )}

        {successMessage && (
          <Notification
            color="teal"
            title="Sign In Successful!"
            withCloseButton={false}
          >
            Welcome back! Redirecting to your dashboard...
          </Notification>
        )}

        <Box
          pos={"relative"}
          className="bg-white p-8 rounded-lg shadow-md"
        >
          {loading && (
            <LoadingOverlay
              visible={loading}
              zIndex={1000}
              overlayProps={{ radius: "sm", blur: 2 }}
            />
          )}

          <form
            onSubmit={form.onSubmit(handleSubmit)}
            className="space-y-4"
          >
            <TextInput
              {...form.getInputProps("email")}
              label="Email Address"
              placeholder="vendor@example.com"
              required
              disabled={loading}
            />

            <PasswordInput
              {...form.getInputProps("password")}
              label="Password"
              placeholder="Enter your password"
              required
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              size="md"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Note: Your account must be approved by an administrator before you can sign in.
              If you&apos;re having trouble, please contact support.
            </p>
          </div>
        </Box>
      </div>
    </div>
  );
};

export default SignInPage;
