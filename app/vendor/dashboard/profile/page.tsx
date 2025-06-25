"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Avatar,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Chip
} from "@mui/material";
import {
  FaUser,
  FaStore,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaEdit,
  FaSave,
  FaTimes
} from "react-icons/fa";

interface VendorProfile {
  _id: string;
  name: string;
  businessName?: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  description: string;
  verified: boolean;
  createdAt: string;
  website?: string;
  taxId?: string;
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
  };
}

const VendorProfilePage = () => {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchVendorProfile();
  }, []);

  const fetchVendorProfile = async () => {
    try {
      const response = await fetch('/api/vendor/profile');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setProfile(result.vendor);
        }
      }
    } catch (error) {
      console.error('Error fetching vendor profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/vendor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setMessage({ type: 'success', text: 'Profile updated successfully!' });
          setEditing(false);
        } else {
          setMessage({ type: 'error', text: result.message || 'Failed to update profile' });
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  const handleBankDetailsChange = (field: string, value: string) => {
    if (!profile) return;
    setProfile({
      ...profile,
      bankDetails: {
        ...profile.bankDetails,
        [field]: value
      } as any
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box p={3}>
        <Alert severity="error">Failed to load vendor profile</Alert>
      </Box>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Vendor Profile</h1>
            <p className="text-gray-600">Manage your business information and settings</p>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<FaTimes />}
                  onClick={() => {
                    setEditing(false);
                    fetchVendorProfile(); // Reset changes
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<FaSave />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                color="primary"
                startIcon={<FaEdit />}
                onClick={() => setEditing(true)}
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <Alert 
          severity={message.type} 
          onClose={() => setMessage(null)}
          sx={{ mb: 3 }}
        >
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom className="flex items-center">
                <FaUser className="mr-2" /> Basic Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={profile.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!editing}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Business Name"
                    value={profile.businessName || ''}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    disabled={!editing}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={profile.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!editing}
                    variant="outlined"
                    type="email"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={profile.phoneNumber || ''}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    disabled={!editing}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Website URL"
                    value={profile.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    disabled={!editing}
                    variant="outlined"
                    placeholder="https://yourwebsite.com"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Business Description"
                    value={profile.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    disabled={!editing}
                    variant="outlined"
                    multiline
                    rows={4}
                    placeholder="Describe your business..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Status */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Profile Status</Typography>
              <Divider sx={{ mb: 3 }} />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Verification Status</span>
                  <Chip 
                    label={profile.verified ? 'Verified' : 'Pending'} 
                    color={profile.verified ? 'success' : 'warning'}
                    size="small"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm font-medium">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Profile Completion</span>
                  <span className="text-sm font-medium">85%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Quick Stats</Typography>
              <Divider sx={{ mb: 3 }} />
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Products</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Orders</span>
                  <span className="font-semibold">89</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Rating</span>
                  <span className="font-semibold">4.8/5</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>

        {/* Address Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom className="flex items-center">
                <FaMapMarkerAlt className="mr-2" /> Address Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    value={profile.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!editing}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="City"
                    value={profile.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    disabled={!editing}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="State"
                    value={profile.state || ''}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    disabled={!editing}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="ZIP Code"
                    value={profile.zipCode || ''}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    disabled={!editing}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={profile.country || ''}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    disabled={!editing}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Bank Details */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom className="flex items-center">
                <FaStore className="mr-2" /> Bank Details
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Account Holder Name"
                    value={profile.bankDetails?.accountHolderName || ''}
                    onChange={(e) => handleBankDetailsChange('accountHolderName', e.target.value)}
                    disabled={!editing}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Bank Name"
                    value={profile.bankDetails?.bankName || ''}
                    onChange={(e) => handleBankDetailsChange('bankName', e.target.value)}
                    disabled={!editing}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Account Number"
                    value={profile.bankDetails?.accountNumber || ''}
                    onChange={(e) => handleBankDetailsChange('accountNumber', e.target.value)}
                    disabled={!editing}
                    variant="outlined"
                    type="password"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="IFSC Code"
                    value={profile.bankDetails?.ifscCode || ''}
                    onChange={(e) => handleBankDetailsChange('ifscCode', e.target.value)}
                    disabled={!editing}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tax ID / GST Number"
                    value={profile.taxId || ''}
                    onChange={(e) => handleInputChange('taxId', e.target.value)}
                    disabled={!editing}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default VendorProfilePage;