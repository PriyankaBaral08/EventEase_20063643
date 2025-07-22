import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Avatar,
  Divider,
  Alert
} from '@mui/material';
import { Event, Place, CalendarMonth, AccountCircle } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/Authcontext';

const EventDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`/api/events/${id}`)
      .then(res => {
        setEvent(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
        setError('Failed to load event');
      });
  }, [id]);

  const handleJoin = async () => {
    try {
      const res = await axios.post(`/api/events/${id}/join`);
      setEvent(res.data.event);
      setMessage(res.data.message);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Join request failed');
      setMessage('');
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!event) {
    return (
      <Container sx={{ mt: 6 }}>
        <Typography variant="h6" color="error">Event not found.</Typography>
      </Container>
    );
  }

  const isAlreadyParticipant = event.participants?.some(
    (p) => p.user._id === user?._id
  );

  const defaultImage = 'https://static.vecteezy.com/system/resources/thumbnails/041/388/388/small/ai-generated-concert-crowd-enjoying-live-music-event-photo.jpg';

  return (
    <Container maxWidth="md" sx={{ mt: 6, mb: 6 }}>
      <Card sx={{
        borderRadius: 4,
        boxShadow: 6,
        transition: 'transform 0.3s',
        '&:hover': { transform: 'scale(1.01)' }
      }}>
        <CardMedia
          component="img"
          height="320"
          image={event.imageUrl || defaultImage}
          alt="Event"
          sx={{
            filter: 'brightness(90%)',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16
          }}
        />
        <CardContent sx={{ px: 4, py: 3 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {event.title}
          </Typography>

          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <CalendarMonth sx={{ color: '#1976d2' }} />
            <Typography variant="body1">
              {new Date(event.startDate).toLocaleString()} — {new Date(event.endDate).toLocaleString()}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Place sx={{ color: '#d32f2f' }} />
            <Typography variant="body1">
              {event.location || 'No location provided'}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body1" paragraph sx={{ fontSize: '1.05rem' }}>
            {event.description || 'No description provided.'}
          </Typography>

          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Event sx={{ color: '#7b1fa2' }} />
            <Chip
              label={event.type || 'Other'}
              color="secondary"
              size="small"
              sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}
            />
            {event.tags?.map((tag, index) => (
              <Chip
                key={index}
                label={`#${tag}`}
                variant="outlined"
                color="primary"
                size="small"
              />
            ))}
          </Box>

          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <AccountCircle sx={{ color: '#2e7d32' }} />
            <Typography variant="body2">
              Organizer: <strong>{event.organizer?.username || 'Unknown'}</strong>
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" mb={2}>
            Budget: ₹{event.budget || 0}
          </Typography>

          {!isAlreadyParticipant && (
            <Button
              variant="contained"
              color="success"
              onClick={handleJoin}
              sx={{ mt: 2, mr: 2, fontWeight: 'bold' }}
            >
              Join Event
            </Button>
          )}

          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate('/events')}
            sx={{ mt: 2, fontWeight: 'bold' }}
          >
            ← Back to Events
          </Button>

          {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </CardContent>
      </Card>
    </Container>
  );
};

export default EventDetails;
