import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const JoinEvent = () => {
  const { id: eventId } = useParams(); // eventId from URL
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinStatus, setJoinStatus] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetch event details
  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/events/${eventId}`);
      setEvent(res.data);
    } catch (err) {
      setError('Failed to load event');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const handleJoin = async () => {
    try {
      const res = await axios.post(`/api/events/${eventId}/join`);
      setJoinStatus('You have successfully joined the event!');
      setEvent(res.data.event); // optionally update UI
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to join event';
      setJoinStatus('');
      setError(msg);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 5 }}>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Card sx={{ p: 3 }}>
          <CardContent>
            <Typography variant="h4" gutterBottom>{event.title}</Typography>
            <Typography variant="subtitle1" gutterBottom>
              Type: {event.type} | Location: {event.location}
            </Typography>
            <Typography variant="body1" paragraph>{event.description}</Typography>
            <Typography variant="body2">
              Start: {new Date(event.startDate).toLocaleString()}
            </Typography>
            <Typography variant="body2" gutterBottom>
              End: {new Date(event.endDate).toLocaleString()}
            </Typography>

            <Typography variant="body2" sx={{ mt: 2 }}>
              Organizer: {event.organizer?.username} ({event.organizer?.email})
            </Typography>

            {joinStatus && <Alert severity="success" sx={{ mt: 2 }}>{joinStatus}</Alert>}

            <Box sx={{ mt: 3 }}>
              <Button variant="contained" color="primary" onClick={handleJoin}>
                Join Event
              </Button>
              <Button variant="outlined" sx={{ ml: 2 }} onClick={() => navigate(-1)}>
                Go Back
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default JoinEvent;
