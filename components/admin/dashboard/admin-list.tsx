"use client"
import { Table, Button, Paper, Text, Box } from '@mantine/core';
import { useEffect, useState } from 'react';

interface Admin {
  _id: string;
  email: string;
  createdAt: string;
}

const AdminList = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAdmins = async () => {
    const response = await fetch('/api/admin/list');
    const data = await response.json();
    if (data.success) {
      setAdmins(data.admins);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      setLoading(true);
      const response = await fetch(`/api/admin/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (data.success) {
        fetchAdmins();
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Mobile card view component
  const AdminCard = ({ admin }: { admin: Admin }) => (
    <Box className="p-4 bg-white rounded-lg shadow-sm mb-3 border border-gray-200">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-start">
          <Text className="font-medium break-all">{admin.email}</Text>
          <Button 
            color="red" 
            variant="outline" 
            size="xs"
            loading={loading}
            onClick={() => handleDelete(admin._id)}
            className="ml-2 flex-shrink-0"
          >
            Delete
          </Button>
        </div>
        <Text size="sm" color="dimmed">
          Created: {new Date(admin.createdAt).toLocaleDateString()}
        </Text>
      </div>
    </Box>
  );

  return (
    <Paper p="md" shadow="sm" className="w-full">
      <h2 className="text-lg sm:text-xl font-bold mb-4">Admin List</h2>
      
      {/* Desktop view - Hidden on mobile */}
      <div className="hidden sm:block">
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <th className="whitespace-nowrap px-4 py-2">Email</th>
                <th className="whitespace-nowrap px-4 py-2">Created At</th>
                <th className="whitespace-nowrap px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin._id}>
                  <td className="px-4 py-2 max-w-[200px] truncate">
                    {admin.email}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button 
                      color="red" 
                      variant="outline" 
                      size="xs"
                      loading={loading}
                      onClick={() => handleDelete(admin._id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      {/* Mobile view - Hidden on desktop */}
      <div className="sm:hidden">
        {admins.map((admin) => (
          <AdminCard key={admin._id} admin={admin} />
        ))}
      </div>

      {admins.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          No admins found
        </p>
      )}
    </Paper>
  );
};

export default AdminList;
