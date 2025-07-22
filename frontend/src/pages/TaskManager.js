import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const statusOptions = ['pending', 'in-progress', 'completed'];

const TaskManager = () => {
  const { id: eventId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    status: 'pending',
  });
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState('');

  // Fetch tasks and participants whenever eventId changes
  useEffect(() => {
    if (!eventId) return; // safety check

    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/tasks/event/${eventId}`);
        setTasks(res.data);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
        setError('Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    };

    const fetchParticipants = async () => {
      try {
        const res = await axios.get(`/api/events/${eventId}`);
        setParticipants(res.data.participants || []);
      } catch (err) {
        console.error('Failed to fetch participants:', err);
        setError('Failed to fetch participants');
      }
    };

    fetchTasks();
    fetchParticipants();
  }, [eventId]);

  const handleOpen = () => {
    setError('');
    setForm({
      title: '',
      description: '',
      assignedTo: '',
      dueDate: '',
      status: 'pending',
    });
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.title || !form.assignedTo || !form.dueDate) {
      setError('Please fill all required fields');
      return;
    }

    try {
      await axios.post('/api/tasks', {
        event: eventId,
        ...form,
      });
      // Refresh tasks after adding
      const res = await axios.get(`/api/tasks/event/${eventId}`);
      setTasks(res.data);
      setOpen(false);
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.response?.data?.message || 'Error creating task');
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Task Manager
      </Typography>
      <Button variant="contained" onClick={handleOpen}>
        Add New Task
      </Button>

      <Box sx={{ mt: 3 }}>
        {tasks.length === 0 ? (
          <Typography>No tasks yet.</Typography>
        ) : (
          <List>
            {tasks.map((task) => (
              <ListItem key={task._id} divider>
                <ListItemText
                  primary={`${task.title} (${task.status})`}
                  secondary={`Assigned to: ${task.assignedTo?.username || 'Unassigned'} | Due: ${
                    task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'
                  }`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Task</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Title"
            name="title"
            value={form.title}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
          />
          <TextField
            select
            label="Assign To"
            name="assignedTo"
            value={form.assignedTo}
            onChange={handleChange}
            fullWidth
            required
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {participants.map((p) => (
              <MenuItem key={p.user._id} value={p.user._id}>
                {p.user.username}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Due Date"
            name="dueDate"
            type="date"
            value={form.dueDate}
            onChange={handleChange}
            fullWidth
            required
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            select
            label="Status"
            name="status"
            value={form.status}
            onChange={handleChange}
            fullWidth
          >
            {statusOptions.map((status) => (
              <MenuItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Add Task
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TaskManager;
