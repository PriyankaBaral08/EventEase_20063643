import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Box
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';

const getStatusColor = (status) => {
  switch (status) {
    case 'planning': return 'info';
    case 'active': return 'success';
    case 'completed': return 'default';
    case 'cancelled': return 'error';
    default: return 'default';
  }
};

const getTypeIcon = (type) => {
  switch (type) {
    case 'trip': return '✈️';
    case 'party': return '🎉';
    case 'dinner': return '🍽️';
    case 'meeting': return '📋';
    default: return '📅';
  }
};

const Events = () => {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/events')
      .then(res => setEvents(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>All Events</Typography>
        <Button variant="contained" onClick={() => navigate('/events/create')}>
          + Create Event
        </Button>
      </Box>

      <Grid container spacing={3}>
        {events.length === 0 ? (
          <Typography>No events found.</Typography>
        ) : (
          events.map(event => (
            <Grid item xs={12} sm={6} md={4} key={event._id}>
              <Card
                sx={{
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 6
                  }
                }}
                onClick={() => navigate(`/events/${event._id}`)}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {getTypeIcon(event.type)} {event.title}
                  </Typography>

                  <Chip
                    label={event.status}
                    color={getStatusColor(event.status)}
                    size="small"
                    sx={{ mb: 1 }}
                  />

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      height: 60,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      mb: 1
                    }}
                  >
                    {event.description || 'No description provided.'}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {dayjs(event.startDate).format('MMM D, YYYY')} - {dayjs(event.endDate).format('MMM D, YYYY')}
                  </Typography>
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click navigation
                      navigate(`/events/${event._id}`);
                    }}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
};

export default Events;
