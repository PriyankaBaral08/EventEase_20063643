import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, CircularProgress, Alert, List, ListItem, ListItemText, Chip, Grid,
  Checkbox
} from '@mui/material';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const categories = ['accommodation', 'food', 'transport', 'entertainment', 'other'];

const Expenses = () => {
  const { id: eventId } = useParams();
  const [expenses, setExpenses] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', amount: '', category: '', paidBy: '', splitBetween: []
  });
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [splitMap, setSplitMap] = useState({});

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/expenses/event/${eventId}`);
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
const fetchParticipants = async () => {
  try {
    const res = await axios.get(`/api/events/${eventId}`);
    const event = res.data;

    // Combine organizer and participants
    const combinedUsers = [
      { _id: event.organizer._id, username: event.organizer.username }, // Organizer
      ...event.participants.map(p => ({
        _id: p.user._id,
        username: p.user.username
      }))
    ];

    setUsers(combinedUsers); // used for splitBetween and PaidBy dropdown
    setParticipants(event.participants); // still useful if needed elsewhere
  } catch (err) {
    console.error('Error fetching participants:', err);
  }
};



  useEffect(() => {
    fetchExpenses();
    fetchParticipants();
  }, [eventId]);

  const handleOpen = () => {
    setError('');
    setForm({ title: '', description: '', amount: '', category: '', paidBy: '', splitBetween: [] });
    setSplitMap({});
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setError('');
    const { title, amount, category, paidBy } = form;
    const splitBetween = Object.entries(splitMap).map(([user, val]) => ({ user, amount: parseFloat(val.amount) }));

    if (!title || !amount || !category || !paidBy || splitBetween.length === 0) {
      setError('All fields are required and at least one user must be selected for split.');
      return;
    }

    try {
      await axios.post('/api/expenses', { ...form, event: eventId, splitBetween });
      fetchExpenses();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create expense');
    }
  };

  const getTotal = () => expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Expenses</Typography>
      <Button variant="contained" onClick={handleOpen}>Add New Expense</Button>

      <Box sx={{ mt: 3 }}>
        {loading ? (
          <CircularProgress />
        ) : expenses.length === 0 ? (
          <Typography>No expenses added yet.</Typography>
        ) : (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Total Expenses: ₹{getTotal().toFixed(2)}
            </Typography>
            <List>
              {expenses.map((exp) => (
                <ListItem key={exp._id} divider>
                  <ListItemText
                    primary={`${exp.title} — ₹${exp.amount} (${exp.category})`}
                    secondary={`Paid by: ${exp.paidBy?.username || 'N/A'} on ${new Date(exp.date).toLocaleDateString()}`}
                  />
                  <Chip label={`Split: ${exp.splitBetween.length} people`} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add Expense</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Title" name="title" value={form.title} onChange={handleChange} required fullWidth />
          <TextField label="Description" name="description" value={form.description} onChange={handleChange} multiline rows={2} fullWidth />
          <TextField label="Amount" name="amount" value={form.amount} onChange={handleChange} type="number" fullWidth required />
          <TextField select label="Category" name="category" value={form.category} onChange={handleChange} fullWidth required>
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Paid By" name="paidBy" value={form.paidBy} onChange={handleChange} fullWidth required>
            {users.map(p => (
              <MenuItem key={p._id} value={p._id}>{p.username}</MenuItem>
            ))}
          </TextField>

          <Typography variant="subtitle1" sx={{ mt: 2 }}>Split Between:</Typography>
{users.map(user => (
  <Box key={user._id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
    <Checkbox
      checked={!!splitMap[user._id]}
      onChange={(e) => {
        const updated = { ...splitMap };
        if (e.target.checked) {
          updated[user._id] = { amount: 0 };
        } else {
          delete updated[user._id];
        }
        setSplitMap(updated);
      }}
    />
    <Typography>{user.username}</Typography>
    {splitMap[user._id] && (
      <TextField
        label="Amount"
        type="number"
        size="small"
        value={splitMap[user._id].amount}
        onChange={(e) => {
          const updated = { ...splitMap };
          updated[user._id].amount = e.target.value;
          setSplitMap(updated);
        }}
        sx={{ width: 120 }}
      />
    )}
  </Box>


          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Add Expense</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Expenses;
