"use client";
import React, { useState } from "react";
import {
  Button,
  NumberInput,
  PasswordInput,
  Textarea,
  TextInput,
  Notification,
  LoadingOverlay,
  Box,
} from "@mantine/core";
import { hasLength, isEmail, useForm } from "@mantine/form";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SignUpPage = () => {
  const form = useForm({
    initialValues: {
      name: "",
      email: "",
      password: "",
      description: "",
      address: "",
      phoneNumber: 0,
      zipCode: 0,
    },
    validate: {
      name: hasLength({ min: 3 }, "Must be at least 3 characters long."),
      email: isEmail("Invalid Email."),
      password: hasLength(
        { min: 6 },
        "Password must be at least 6 characters long."
      ),
      address: hasLength({ min: 10 }, "Must be at least 10 characters long."),
      description: hasLength(
        { min: 10 },
        "Must be at least 10 characters long."
      ),
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

      const response = await fetch("/api/auth/vendor-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage(true);
        setFailureMessage({ visible: false, message: "" });
        setTimeout(() => {
          router.push("/public-routes/signin");
        }, 4000);
      } else {
        setSuccessMessage(false);
        setFailureMessage({
          visible: true,
          message: data.message || "Registration failed. Please try again.",
        });
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      setFailureMessage({
        visible: true,
        message: "Network error. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Vendor Registration
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/public-routes/signin"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {failureMessage.visible && (
          <Notification
            color="red"
            title="Registration Failed"
            onClose={() =>
              setFailureMessage({ visible: false, message: "" })
            }
          >
            {failureMessage.message}
          </Notification>
        )}

        {successMessage && (
          <Notification
            color="teal"
            title="Registration Successful!"
            withCloseButton={false}
          >
            Your vendor account has been created successfully! Please wait for
            admin approval before you can sign in. You will be redirected to the
            sign-in page shortly.
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
              {...form.getInputProps("name")}
              label="Business/Vendor Name"
              placeholder="Enter your business name"
              required
              disabled={loading}
            />

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
              placeholder="Create a secure password"
              required
              disabled={loading}
            />

            <Textarea
              {...form.getInputProps("description")}
              label="Business Description"
              placeholder="Describe your business and what you sell"
              required
              disabled={loading}
              minRows={3}
            />

            <TextInput
              {...form.getInputProps("address")}
              label="Business Address"
              placeholder="Enter your complete business address"
              required
              disabled={loading}
            />

            <NumberInput
              {...form.getInputProps("phoneNumber")}
              label="Phone Number"
              placeholder="Enter contact number"
              hideControls
              required
              disabled={loading}
            />

            <NumberInput
              {...form.getInputProps("zipCode")}
              label="ZIP/Postal Code"
              placeholder="Enter ZIP code"
              hideControls
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
              {loading ? "Creating Account..." : "Register as Vendor"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By registering, you agree that your account will be reviewed by our
              admin team before activation. You will be notified once your
              account is approved.
            </p>
          </div>
        </Box>
      </div>
    </div>
  );
};

export default SignUpPage;
