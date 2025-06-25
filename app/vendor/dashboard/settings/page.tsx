"use client";
import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  IconButton,
  InputAdornment
} from "@mui/material";
import {
  FaLock,
  FaShieldAlt,
  FaKey,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaExclamationTriangle,
  FaBell,
  FaEnvelope,
  FaMobile
} from "react-icons/fa";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`account-tabpanel-${index}`}
      aria-labelledby={`account-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AccountSettingsPage = () => {
  const { data: session } = useSession();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Password change states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    emailNotifications: true,
    smsNotifications: false,
    loginAlerts: true,
    marketingEmails: false
  });

  // Delete account dialog
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/vendor/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const result = await response.json();
      if (result.success) {
        setMessage({ type: 'success', text: 'Password updated successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to update password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating password' });
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySettingChange = async (setting: string, value: boolean) => {
    setSecuritySettings(prev => ({ ...prev, [setting]: value }));
    
    try {
      const response = await fetch('/api/vendor/security-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [setting]: value })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings updated successfully!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update settings' });
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setMessage({ type: 'error', text: 'Please type DELETE to confirm' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/vendor/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Account deleted successfully. Redirecting...' });
        setTimeout(() => {
          signOut({ callbackUrl: '/vendor/signin' });
        }, 2000);
      } else {
        const result = await response.json();
        setMessage({ type: 'error', text: result.message || 'Failed to delete account' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error deleting account' });
    } finally {
      setLoading(false);
      setDeleteDialog(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Account Settings</h1>
        <p className="text-gray-600">Manage your account security and preferences</p>
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

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange} aria-label="account settings tabs">
            <Tab label="Password & Security" icon={<FaLock />} />
            <Tab label="Notifications" icon={<FaBell />} />
            <Tab label="Privacy" icon={<FaShieldAlt />} />
            <Tab label="Danger Zone" icon={<FaExclamationTriangle />} />
          </Tabs>
        </Box>

        {/* Password & Security Tab */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={4}>
            {/* Change Password */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom className="flex items-center">
                <FaKey className="mr-2" /> Change Password
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <div className="space-y-4">
                <TextField
                  fullWidth
                  label="Current Password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          edge="end"
                        >
                          {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                
                <TextField
                  fullWidth
                  label="New Password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          edge="end"
                        >
                          {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handlePasswordChange}
                  disabled={loading || !passwordData.currentPassword || !passwordData.newPassword}
                  fullWidth
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </Grid>

            {/* Security Features */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom className="flex items-center">
                <FaShieldAlt className="mr-2" /> Security Features
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={securitySettings.twoFactorEnabled}
                        onChange={(e) => handleSecuritySettingChange('twoFactorEnabled', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Two-Factor Authentication"
                  />
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Add an extra layer of security to your account
                  </Typography>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={securitySettings.loginAlerts}
                        onChange={(e) => handleSecuritySettingChange('loginAlerts', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Login Alerts"
                  />
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Get notified when someone logs into your account
                  </Typography>
                </div>
                
                <div className="mt-4">
                  <Typography variant="subtitle2" gutterBottom>
                    Recent Login Activity
                  </Typography>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>• Last login: {new Date().toLocaleString()}</div>
                    <div>• Device: Chrome on Windows</div>
                    <div>• Location: Mumbai, India</div>
                  </div>
                </div>
              </div>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={currentTab} index={1}>
          <Typography variant="h6" gutterBottom className="flex items-center">
            <FaBell className="mr-2" /> Notification Preferences
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <FaEnvelope className="mr-2 text-blue-600" />
                    <Typography variant="subtitle1">Email Notifications</Typography>
                  </div>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={securitySettings.emailNotifications}
                        onChange={(e) => handleSecuritySettingChange('emailNotifications', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Order notifications"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={securitySettings.marketingEmails}
                        onChange={(e) => handleSecuritySettingChange('marketingEmails', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Marketing emails"
                  />
                </div>
              </div>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <FaMobile className="mr-2 text-green-600" />
                    <Typography variant="subtitle1">SMS Notifications</Typography>
                  </div>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={securitySettings.smsNotifications}
                        onChange={(e) => handleSecuritySettingChange('smsNotifications', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Order updates via SMS"
                  />
                  
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Receive important order updates on your mobile
                  </Typography>
                </div>
              </div>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Privacy Tab */}
        <TabPanel value={currentTab} index={2}>
          <Typography variant="h6" gutterBottom className="flex items-center">
            <FaShieldAlt className="mr-2" /> Privacy Settings
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <Typography variant="subtitle1" gutterBottom>Data Collection</Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                We collect data to improve your experience and provide better services.
              </Typography>
              <Button variant="outlined" size="small">
                View Privacy Policy
              </Button>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <Typography variant="subtitle1" gutterBottom>Export Your Data</Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Download a copy of your account data including profile information and order history.
              </Typography>
              <Button variant="outlined" size="small">
                Request Data Export
              </Button>
            </div>
          </div>
        </TabPanel>

        {/* Danger Zone Tab */}
        <TabPanel value={currentTab} index={3}>
          <Typography variant="h6" gutterBottom className="flex items-center text-red-600">
            <FaExclamationTriangle className="mr-2" /> Danger Zone
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Alert severity="warning" sx={{ mb: 3 }}>
            Actions in this section are irreversible. Please proceed with caution.
          </Alert>
          
          <div className="space-y-4">
            <div className="p-4 border border-red-300 rounded-lg bg-red-50">
              <Typography variant="h6" color="error" gutterBottom>
                Delete Account
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Once you delete your account, there is no going back. This will permanently delete your account, 
                all your products, orders, and remove all data associated with your vendor profile.
              </Typography>
              
              <Button
                variant="contained"
                color="error"
                startIcon={<FaTrash />}
                onClick={() => setDeleteDialog(true)}
              >
                Delete My Account
              </Button>
            </div>
          </div>
        </TabPanel>
      </Card>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="text-red-600">
          <FaExclamationTriangle className="inline mr-2" />
          Delete Account
        </DialogTitle>
        <DialogContent>
          <Typography paragraph>
            This action <strong>cannot be undone</strong>. This will permanently delete your vendor account, 
            all your products, orders, and remove all associated data.
          </Typography>
          
          <Typography paragraph>
            Type <strong>DELETE</strong> below to confirm:
          </Typography>
          
          <TextField
            fullWidth
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Type DELETE here"
            variant="outlined"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            disabled={deleteConfirmText !== 'DELETE' || loading}
          >
            {loading ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AccountSettingsPage;