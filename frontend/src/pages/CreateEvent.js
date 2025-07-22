import React, { useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Paper,
  InputAdornment
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import PlaceIcon from '@mui/icons-material/Place';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CreateEvent = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    type: '',
    location: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.startDate || !formData.endDate || !formData.location || !formData.type) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await axios.post('/api/events', formData);
      navigate('/events');
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating event');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 6 }}>
      {/* Banner */}
      <Box
        sx={{
          height: 180,
          backgroundImage: 'url("/images/event-banner.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: 3,
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography variant="h3" sx={{ color: '#fff', fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.5)', px: 3, py: 1, borderRadius: 2 }}>
          Plan Your Event
        </Typography>
      </Box>

      <Paper elevation={6} sx={{ p: 5, borderRadius: 4, background: 'linear-gradient(145deg, #f0f0f0, #ffffff)', boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 700, color: '#1976d2' }}>
          Create New Event
        </Typography>
        <Typography variant="subtitle1" align="center" sx={{ mb: 3, color: 'gray' }}>
          Fill the details to organize your event smoothly
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            label="Event Title"
            name="title"
            required
            fullWidth
            value={formData.title}
            onChange={handleChange}
          />
          <TextField
            label="Description"
            name="description"
            fullWidth
            multiline
            rows={4}
            value={formData.description}
            onChange={handleChange}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Start Date"
              name="startDate"
              type="datetime-local"
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.startDate}
              onChange={handleChange}
            />
            <TextField
              label="End Date"
              name="endDate"
              type="datetime-local"
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.endDate}
              onChange={handleChange}
            />
          </Box>
          <TextField
            label="Event Type (e.g. trip, party, meeting)"
            name="type"
            required
            fullWidth
            value={formData.type}
            onChange={handleChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EventIcon />
                </InputAdornment>
              )
            }}
          />
          <TextField
            label="Location"
            name="location"
            required
            fullWidth
            value={formData.location}
            onChange={handleChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PlaceIcon />
                </InputAdornment>
              )
            }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            sx={{
              mt: 2,
              py: 1.5,
              fontWeight: 'bold',
              backgroundColor: '#1976d2',
              transition: '0.3s',
              '&:hover': {
                backgroundColor: '#004ba0',
                transform: 'scale(1.02)'
              }
            }}
          >
            Create Event
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateEvent;
