import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  EventAvailable,
  EventNote,
  MonetizationOn,
  Assignment,
  Add,
  Visibility
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalExpenses: 0,
    pendingTasks: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [eventsResponse, expenseResponse] = await Promise.all([
        axios.get('/api/events'),
        axios.get('/api/expenses/total') // Fetch total expenses from backend
      ]);

      const eventsData = eventsResponse.data;
      const totalExpense = expenseResponse.data.totalExpenses || 0;

      const now = new Date();
      const upcomingEvents = eventsData.filter(event => new Date(event.startDate) > now).length;

      setEvents(eventsData.slice(0, 6)); // Display only 6 recent events
      setStats({
        totalEvents: eventsData.length,
        upcomingEvents,
        totalExpenses: totalExpense,
        pendingTasks: 0 // You can update this if you add task tracking
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 5 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          EventEase Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Get a quick overview of your events and actions.
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={4} sx={{ p: 3, borderLeft: '5px solid #1976d2' }}>
            <EventNote color="primary" sx={{ fontSize: 30 }} />
            <Typography variant="h6">Total Events</Typography>
            <Typography variant="h4">{stats.totalEvents}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={4} sx={{ p: 3, borderLeft: '5px solid #2e7d32' }}>
            <EventAvailable color="success" sx={{ fontSize: 30 }} />
            <Typography variant="h6">Upcoming Events</Typography>
            <Typography variant="h4">{stats.upcomingEvents}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={4} sx={{ p: 3, borderLeft: '5px solid #ff9800' }}>
            <MonetizationOn color="warning" sx={{ fontSize: 30 }} />
            <Typography variant="h6">Total Expenses</Typography>
            <Typography variant="h4">₹{stats.totalExpenses.toFixed(2)}</Typography>
            <Button
              variant="text"
              size="small"
              sx={{ mt: 1 }}
              onClick={() => {
                if (events.length > 0) {
                  navigate(`/events/${events[0]._id}/expenses`);
                }
              }}
              disabled={events.length === 0}
            >
              View Expenses
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={4} sx={{ p: 3, borderLeft: '5px solid #d32f2f' }}>
            <Assignment color="error" sx={{ fontSize: 30 }} />
            <Typography variant="h6">Pending Tasks</Typography>
            <Typography variant="h4">{stats.pendingTasks}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Events Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>Recent Events</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Visibility />}
            sx={{ mr: 2 }}
            onClick={() => navigate('/events')}
          >
            View All
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/events/create')}
            sx={{
              backgroundColor: '#1976d2',
              '&:hover': { backgroundColor: '#115293' }
            }}
          >
            Create Event
          </Button>
        </Box>
      </Box>

      {/* Recent Events Cards */}
      <Grid container spacing={3}>
        {events.length === 0 ? (
          <Typography>No recent events found.</Typography>
        ) : (
          events.map(event => (
            <Grid item xs={12} sm={6} md={4} key={event._id}>
              <Card
                onClick={() => navigate(`/events/${event._id}`)}
                sx={{
                  cursor: 'pointer',
                  transition: '0.3s',
                  '&:hover': {
                    transform: 'scale(1.03)',
                    boxShadow: 6
                  }
                }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={600}>
                    {getTypeIcon(event.type)} {event.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {dayjs(event.startDate).format('MMM D, YYYY')} – {dayjs(event.endDate).format('MMM D, YYYY')}
                  </Typography>
                  <Chip
                    label={event.status}
                    color={getStatusColor(event.status)}
                    size="small"
                  />
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={e => {
                      e.stopPropagation();
                      navigate(`/events/${event._id}`);
                    }}
                  >
                    View Details
                  </Button>
                  <Button
                    size="small"
                    color="secondary"
                    onClick={e => {
                      e.stopPropagation();
                      navigate(`/events/${event._id}/expenses`);
                    }}
                  >
                    Expenses
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

export default Dashboard;
