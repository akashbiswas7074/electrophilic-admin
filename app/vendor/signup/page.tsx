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
  Card,
  Title,
  Text,
  Anchor,
} from "@mantine/core";
import { hasLength, isEmail, useForm } from "@mantine/form";
import { useRouter } from "next/navigation";
import Link from "next/link";

const VendorSignUpPage = () => {
  const form = useForm({
    initialValues: {
      name: "",
      email: "",
      password: "",
      description: "",
      address: "",
      phoneNumber: "",
      zipCode: "",
    },
    validate: {
      name: hasLength({ min: 3 }, "Name must be at least 3 characters long."),
      email: isEmail("Invalid Email."),
      password: hasLength(
        { min: 6 },
        "Password must be at least 6 characters long."
      ),
      address: hasLength({ min: 10 }, "Address must be at least 10 characters long."),
      phoneNumber: (value) => (value.toString().length < 10 ? "Phone number must be at least 10 digits" : null),
      zipCode: (value) => (value.toString().length < 5 ? "Zip code must be at least 5 digits" : null),
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

      const response = await fetch("/api/vendor/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
          description: values.description,
          address: values.address,
          phoneNumber: parseInt(values.phoneNumber),
          zipCode: parseInt(values.zipCode),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(true);
        setFailureMessage({ visible: false, message: "" });
        setTimeout(() => {
          router.push("/vendor/signin");
        }, 3000);
      } else {
        setSuccessMessage(false);
        setFailureMessage({ visible: true, message: data.message });
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
      <Card shadow="lg" padding="xl" radius="md" className="w-full max-w-2xl">
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
              Vendor Sign Up
            </Title>
            <Text color="dimmed" size="sm">
              Create your vendor account to start selling
            </Text>
          </div>

          {failureMessage.visible && (
            <Notification color="red" title="Error!" mb="md" onClose={() => setFailureMessage({ visible: false, message: "" })}>
              {failureMessage.message}
            </Notification>
          )}
          
          {successMessage && (
            <Notification color="teal" title="Successfully signed up" mb="md">
              Your account has been created and is pending admin approval. You&apos;ll be redirected to the sign in page.
            </Notification>
          )}

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                {...form.getInputProps("name")}
                label="Business Name"
                placeholder="Enter your business name"
                required
              />

              <TextInput
                {...form.getInputProps("email")}
                label="Email"
                placeholder="Enter your email"
                required
              />
            </div>

            <PasswordInput
              {...form.getInputProps("password")}
              mt="md"
              label="Password"
              placeholder="Enter your password"
              required
            />

            <Textarea
              {...form.getInputProps("description")}
              mt="md"
              label="Business Description"
              placeholder="Describe your business"
              minRows={3}
            />

            <TextInput
              {...form.getInputProps("address")}
              mt="md"
              label="Business Address"
              placeholder="Enter your complete business address"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <TextInput
                {...form.getInputProps("phoneNumber")}
                label="Phone Number"
                placeholder="Enter phone number"
                required
              />

              <TextInput
                {...form.getInputProps("zipCode")}
                label="Zip Code"
                placeholder="Enter zip code"
                required
              />
            </div>

            <Button type="submit" fullWidth mt="xl" loading={loading} disabled={loading}>
              {loading ? "Creating Account..." : "Create Vendor Account"}
            </Button>
          </form>

          <div className="text-center mt-6">
            <Text size="sm" color="dimmed">
              Already have an account?{" "}
              <Anchor component={Link} href="/vendor/signin" size="sm">
                Sign in here
              </Anchor>
            </Text>
          </div>
          
          <div className="text-center mt-4">
            <Text size="xs" color="dimmed">
              By creating an account, your application will be reviewed by our admin team. 
              You'll be notified once your account is approved.
            </Text>
          </div>
        </Box>
      </Card>
    </div>
  );
};

export default VendorSignUpPage;