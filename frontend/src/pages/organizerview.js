import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    TextField,
    Button,
    Box,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Divider,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Paper,
    Avatar,
    Chip,
    Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import TaskIcon from '@mui/icons-material/Task';
import EventIcon from '@mui/icons-material/Event';
import GroupIcon from '@mui/icons-material/Group';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { green, blue, orange, red } from '@mui/material/colors';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import TaskManager from './TaskManager';

const OrganizerView = () => {
    const { id: eventId } = useParams();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        date: ''
    });

    const [newParticipantEmail, setNewParticipantEmail] = useState('');

    const [taskDialogOpen, setTaskDialogOpen] = useState(false);
    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        assignedTo: '',
        dueDate: ''
    });

    const [participants, setParticipants] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await axios.get(`/api/events/${eventId}`);
                setEvent(res.data);
                setEditForm({
                    title: res.data.title,
                    description: res.data.description,
                    date: res.data.date ? new Date(res.data.date).toISOString().substring(0, 10) : ''
                });
                setParticipants(res.data.participants || []);
            } catch (err) {
                setError('Failed to load event');
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
        fetchTasks();
    }, [eventId]);

    const fetchTasks = async () => {
        setLoadingTasks(true);
        try {
            const res = await axios.get(`/api/tasks/event/${eventId}`);
            setTasks(res.data);
        } catch (err) {
            console.error('Failed to fetch tasks');
        } finally {
            setLoadingTasks(false);
        }
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveEvent = async () => {
        setError('');
        try {
            await axios.put(`/api/events/${eventId}`, editForm);
            alert('Event updated successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update event');
        }
    };

    const handleAddParticipant = async () => {
        if (!newParticipantEmail.trim()) return;
        setError('');
        try {
            await axios.post(`/api/events/${eventId}/participants`, {
                email: newParticipantEmail.trim()
            });
            const res = await axios.get(`/api/events/${eventId}`);
            setParticipants(res.data.participants);
            setNewParticipantEmail('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add participant');
        }
    };

    const handleRemoveParticipant = async (userId) => {
        setError('');
        try {
            await axios.delete(`/api/events/${eventId}/participants/${userId}`);
            const res = await axios.get(`/api/events/${eventId}`);
            setParticipants(res.data.participants);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to remove participant');
        }
    };

    const handleTaskChange = (e) => {
        const { name, value } = e.target;
        setTaskForm(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateTask = async () => {
        if (!taskForm.title.trim()) {
            setError('Task title is required');
            return;
        }
        setError('');
        try {
            await axios.post('/api/tasks', {
                ...taskForm,
                event: eventId
            });
            setTaskDialogOpen(false);
            setTaskForm({ title: '', description: '', assignedTo: '', dueDate: '' });
            fetchTasks();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create task');
        }
    };

    if (loading) return <Container sx={{ mt: 4, textAlign: 'center' }}><CircularProgress /></Container>;

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
            <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ mb: 3, color: blue[700] }}>
                Organizer Dashboard
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* Event Details Card */}
            <Paper elevation={4} sx={{ p: 4, mb: 5, borderRadius: 3, bgcolor: blue[50] }}>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EventIcon sx={{ color: blue[600] }} /> Edit Event Details
                </Typography>

                <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                        label="Title"
                        name="title"
                        value={editForm.title}
                        onChange={handleEditChange}
                        fullWidth
                        sx={{ bgcolor: 'white', borderRadius: 1 }}
                    />
                    <TextField
                        label="Description"
                        name="description"
                        value={editForm.description}
                        onChange={handleEditChange}
                        multiline
                        rows={4}
                        fullWidth
                        sx={{ bgcolor: 'white', borderRadius: 1 }}
                    />
                    <TextField
                        label="Date"
                        name="date"
                        type="date"
                        value={editForm.date}
                        onChange={handleEditChange}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ bgcolor: 'white', borderRadius: 1 }}
                    />
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleSaveEvent}
                        sx={{
                            bgcolor: blue[700],
                            '&:hover': { bgcolor: blue[900] },
                            fontWeight: 'bold',
                            mt: 1,
                            alignSelf: 'flex-start',
                            px: 4
                        }}
                    >
                        Save Event
                    </Button>
                </Box>
            </Paper>

            {/* Participants Section */}
            <Paper elevation={4} sx={{ p: 4, mb: 5, borderRadius: 3, bgcolor: green[50] }}>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupIcon sx={{ color: green[700] }} /> Participants
                </Typography>

                <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                        label="Add participant by email"
                        value={newParticipantEmail}
                        onChange={(e) => setNewParticipantEmail(e.target.value)}
                        sx={{ flexGrow: 1, bgcolor: 'white', borderRadius: 1 }}
                    />
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddParticipant}
                        sx={{ bgcolor: green[700], '&:hover': { bgcolor: green[900] }, fontWeight: 'bold' }}
                    >
                        Add
                    </Button>
                </Box>

                {participants.length === 0 ? (
                    <Typography>No participants yet.</Typography>
                ) : (
                    <List dense>
                        {participants.map(p => (
                            <ListItem
                                key={p.user._id}
                                secondaryAction={
                                    <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveParticipant(p.user._id)} sx={{ color: red[600] }}>
                                        <DeleteIcon />
                                    </IconButton>
                                }
                                sx={{ bgcolor: 'white', borderRadius: 2, mb: 1, boxShadow: 1 }}
                            >
                                <Avatar sx={{ bgcolor: green[700], mr: 2 }}>
                                    {p.user.username.charAt(0).toUpperCase()}
                                </Avatar>
                                <ListItemText primary={p.user.username} secondary={p.user.email} />
                            </ListItem>
                        ))}
                    </List>
                )}
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Button
                        component={Link}
                        to={`/events/${eventId}/tasks`}
                        variant="outlined"
                        sx={{
                            fontWeight: 'bold',
                            color: orange[700],
                            borderColor: orange[700],
                            '&:hover': { bgcolor: orange[100] }
                        }}
                    >
                        Go to Task Manager
                    </Button>
                </Box>
            </Paper>

            {/* Tasks Section */}
            <Paper elevation={4} sx={{ p: 4, mb: 5, borderRadius: 3, bgcolor: orange[50] }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TaskIcon sx={{ color: orange[700] }} /> Tasks
                    </Typography>
                    <Button variant="contained" onClick={() => setTaskDialogOpen(true)} sx={{ fontWeight: 'bold', bgcolor: orange[700], '&:hover': { bgcolor: orange[900] } }}>
                        Create Task
                    </Button>
                </Box>

                {loadingTasks ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress />
                    </Box>
                ) : tasks.length === 0 ? (
                    <Typography>No tasks created.</Typography>
                ) : (
                    <List dense>
                        {tasks.map(task => (
                            <ListItem key={task._id} sx={{ bgcolor: 'white', borderRadius: 2, mb: 1, boxShadow: 1 }}>
                                <ListItemText
                                    primary={task.title}
                                    secondary={
                                        <>
                                            Assigned to: <Chip label={task.assignedTo?.username || 'Unassigned'} color="primary" size="small" />
                                            {' | '}
                                            Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                                        </>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </Paper>

            {/* Expenses Section */}
            <Paper elevation={4} sx={{ p: 4, borderRadius: 3, bgcolor: blue[50], textAlign: 'center' }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                    <AttachMoneyIcon sx={{ color: blue[700] }} /> Expenses
                </Typography>
                <Button
                    component={Link}
                    to={`/events/${eventId}/expenses`}
                    variant="outlined"
                    sx={{ fontWeight: 'bold', color: blue[700], borderColor: blue[700], '&:hover': { bgcolor: blue[100] } }}
                >
                    Manage Expenses
                </Button>
            </Paper>

            {/* Create Task Dialog */}
            <Dialog open={taskDialogOpen} onClose={() => setTaskDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="Task Title"
                        name="title"
                        value={taskForm.title}
                        onChange={handleTaskChange}
                        required
                        fullWidth
                    />
                    <TextField
                        label="Description"
                        name="description"
                        value={taskForm.description}
                        onChange={handleTaskChange}
                        multiline
                        rows={3}
                        fullWidth
                    />
                    <TextField
                        label="Assign To"
                        name="assignedTo"
                        select
                        value={taskForm.assignedTo}
                        onChange={handleTaskChange}
                        fullWidth
                        SelectProps={{ native: true }}
                    >
                        <option value="">Unassigned</option>
                        {participants.map(p => (
                            <option key={p.user._id} value={p.user._id}>{p.user.username}</option>
                        ))}
                    </TextField>
                    <TextField
                        label="Due Date"
                        name="dueDate"
                        type="date"
                        value={taskForm.dueDate}
                        onChange={handleTaskChange}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTaskDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateTask}>Create</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default OrganizerView;
