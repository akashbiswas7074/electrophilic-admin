"use client";
import { Button, TextInput, PasswordInput, Paper, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { toast, Toaster } from 'react-hot-toast';

const AdminManagement = () => {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
      confirmPassword: (value, values) => 
        value !== values.password ? 'Passwords do not match' : null
    }
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password
        }),
      });
      
      const data = await response.json();
      if (response.ok) {
        toast.success('Admin added successfully');
        form.reset();
      } else {
        toast.error(data.message || 'Failed to add admin');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
    setLoading(false);
  };

  return (
    <Paper p="md" shadow="md" radius="md" className="bg-white/90 w-full">
      <Toaster position="top-right" />
      <Title order={2} className="mb-4 sm:mb-6 text-gray-800 text-lg sm:text-xl">
        Add Admin Credentials
      </Title>
      <form onSubmit={form.onSubmit(handleSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            required
            label="Email"
            placeholder="admin@example.com"
            size="sm"
            className="w-full"
            {...form.getInputProps('email')}
          />
          <PasswordInput
            required
            label="Password"
            placeholder="Enter password"
            size="sm"
            className="w-full"
            {...form.getInputProps('password')}
          />
        </div>
        <PasswordInput
          required
          label="Confirm Password"
          placeholder="Confirm password"
          size="sm"
          className="w-full"
          {...form.getInputProps('confirmPassword')}
        />
        <Button 
          type="submit" 
          loading={loading}
          size="sm"
          fullWidth
          className="mt-4 bg-blue-600 hover:bg-blue-700"
        >
          Add Admin
        </Button>
      </form>
    </Paper>
  );
};

export default AdminManagement;
