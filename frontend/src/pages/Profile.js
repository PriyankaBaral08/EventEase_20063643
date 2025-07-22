import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Divider,
  Grid,
  Button,
  Alert
} from '@mui/material';
import { deepPurple } from '@mui/material/colors';
import { useAuth } from '../context/Authcontext';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import axios from 'axios';

const Profile = () => {
  const { user } = useAuth();
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(user?.profileImage || '');
  const [message, setMessage] = useState('');

  if (!user) {
    return (
      <Container sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h6" color="error">⚠️ You are not logged in.</Typography>
      </Container>
    );
  }

  const handleChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setMessage('');
  };

  const handleUpload = async () => {
    if (!image) {
      setMessage('Please select an image before uploading.');
      return;
    }

    const formData = new FormData();
    formData.append('image', image);

    try {
      const res = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage('Image uploaded successfully!');
      setPreview(res.data.url || preview);
      // Optionally update user profile image in your user context/store here

    } catch (err) {
      console.error('Upload failed:', err);
      setMessage('Upload failed. Please try again.');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card sx={{ p: 4, borderRadius: 4, boxShadow: 3, backgroundColor: '#fdf6fb' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Avatar
            src={preview}
            sx={{
              bgcolor: deepPurple[500],
              width: 100,
              height: 100,
              fontSize: 36
            }}
          >
            {!preview && user.username?.charAt(0).toUpperCase()}
          </Avatar>
        </Box>

        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <input
            accept="image/*"
            type="file"
            onChange={handleChange}
            style={{ marginBottom: '10px' }}
          />
          <Button variant="contained" onClick={handleUpload}>Upload Image</Button>
        </Box>

        {message && <Alert severity={message.includes('failed') ? 'error' : 'success'} sx={{ mb: 2 }}>{message}</Alert>}

        <Typography variant="h5" align="center" gutterBottom>
          {user.username}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon color="primary" />
                <Typography variant="body1">{user.email}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BadgeIcon color="secondary" />
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                  Role: {user.role}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Profile;
