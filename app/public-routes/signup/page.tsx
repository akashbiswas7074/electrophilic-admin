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
import { registerVendor } from "@/lib/database/actions/admin/auth/register";

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
      name: hasLength({ min: 8 }, "Must be at least 8 characters long."),
      email: isEmail("Invalid Email."),
      password: hasLength(
        { min: 10 },
        "Password must be at least 10 characters long."
      ),
      address: hasLength({ min: 15 }, "Must be at least 15 characters long."),
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
      await registerVendor(
        values.name,
        values.email,
        values.password,
        values.address,
        values.phoneNumber,
        values.zipCode
      )
        .then((res) => {
          if (res?.success) {
            setSuccessMessage(true);
            setFailureMessage({ visible: false, message: "" });
            setTimeout(() => {
              router.push("/signin");
            }, 3000);
          } else if (!res?.success) {
            setSuccessMessage(false);
            setFailureMessage({ visible: true, message: res?.message });
          }
        })
        .catch((err) => {
          setFailureMessage({ visible: true, message: err.toString() });
        });
    } catch (error: any) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="">
        <h1 className="text-3xl font-bold">Sign Up</h1>
        {failureMessage.visible && (
          <Notification color="red" title="Error!" mt={"md"}>
            {failureMessage.message}
          </Notification>
        )}
        {successMessage && (
          <Notification color="teal" title="Successfully signed up" mt={"md"}>
            You&apos;re being redirected to the sign in page
          </Notification>
        )}
        <Box pos={"relative"}>
          {loading && (
            <LoadingOverlay
              visible={loading}
              zIndex={1000}
              overlayProps={{ radius: "sm", blur: 2 }}
            />
          )}
          <form
            onSubmit={form.onSubmit((values) => {
              handleSubmit(values);
            })}
            className="w-[500px]"
          >
            <TextInput
              {...form.getInputProps("name")}
              mt={"md"}
              label="Name"
              placeholder="Full Name"
              required
            />

            <TextInput
              {...form.getInputProps("email")}
              mt={"md"}
              label="Email"
              placeholder="Email"
              required
            />

            <PasswordInput
              {...form.getInputProps("password")}
              mt={"md"}
              label="Password"
              placeholder="Password"
              required
            />

            <TextInput
              {...form.getInputProps("address")}
              mt={"md"}
              label="Address"
              placeholder="Address"
              required
            />

            <Textarea
              {...form.getInputProps("description")}
              mt={"md"}
              label="Description"
              placeholder="Description"
              required
            />

            <NumberInput
              {...form.getInputProps("phoneNumber")}
              mt={"md"}
              label="Phone Number"
              placeholder="Phone Number"
              hideControls
              required
            />

            <NumberInput
              {...form.getInputProps("zipCode")}
              mt={"md"}
              label="Zip Code"
              placeholder="Zip Code"
              hideControls
              required
            />

            <Button type="submit" mt={"md"} mb={"lg"}>
              {loading ? "Loading..." : "Submit"}
            </Button>
          </form>
        </Box>
      </div>
    </div>
  );
};

export default SignUpPage;
