const express = require('express');
const { body, validationResult } = require('express-validator');
const Event = require('../Models/event');
const Task = require('../Models/task'); // You need to create this model (see below)
const auth = require('../Middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware to check organizer/co-organizer role for event
async function checkOrganizer(req, res, next) {
  try {
    const event = await Event.findById(req.body.event || req.params.eventId || req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const userParticipant = event.participants.find(p => p.user.toString() === req.user.userId);
    if (!userParticipant || !['organizer', 'co-organizer'].includes(userParticipant.role)) {
      return res.status(403).json({ message: 'Only organizers can manage tasks' });
    }

    // Attach event to request for use later
    req.event = event;
    next();
  } catch (error) {
    logger.error('Organizer check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Create a new task
router.post('/', auth, checkOrganizer, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  body('assignedTo').optional().isMongoId().withMessage('AssignedTo must be a valid user ID'),
  body('status').optional().isIn(['pending', 'in-progress', 'completed']).withMessage('Invalid status'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, assignedTo, status } = req.body;

    // Check assignedTo is participant of event if provided
    if (assignedTo) {
      const isParticipant = req.event.participants.some(p => p.user.toString() === assignedTo);
      if (!isParticipant) {
        return res.status(400).json({ message: 'Assigned user is not a participant of the event' });
      }
    }

    const task = new Task({
      event: req.event._id,
      title,
      description,
      assignedTo: assignedTo || null,
      status: status || 'pending',
      createdBy: req.user.userId
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    logger.error('Task creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tasks for event (any participant can view)
router.get('/event/:eventId', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check user access (participant or organizer)
    const hasAccess = event.organizer.toString() === req.user.userId ||
      event.participants.some(p => p.user.toString() === req.user.userId);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tasks = await Task.find({ event: req.params.eventId }).populate('assignedTo', 'username email').sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    logger.error('Fetch tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a task (only organizer or co-organizer)
router.put('/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const event = await Event.findById(task.event);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check organizer/co-organizer
    const userParticipant = event.participants.find(p => p.user.toString() === req.user.userId);
    if (!userParticipant || !['organizer', 'co-organizer'].includes(userParticipant.role)) {
      return res.status(403).json({ message: 'Only organizers can update tasks' });
    }

    // Validate input
    const allowedUpdates = ['title', 'description', 'assignedTo', 'status'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });

    // If assignedTo provided, check if participant of event
    if (req.body.assignedTo) {
      const isParticipant = event.participants.some(p => p.user.toString() === req.body.assignedTo);
      if (!isParticipant) {
        return res.status(400).json({ message: 'Assigned user is not a participant of the event' });
      }
    }

    await task.save();
    res.json(task);
  } catch (error) {
    logger.error('Task update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a task (only organizer or co-organizer)
router.delete('/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const event = await Event.findById(task.event);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check organizer/co-organizer role
    const userParticipant = event.participants.find(p => p.user.toString() === req.user.userId);
    if (!userParticipant || !['organizer', 'co-organizer'].includes(userParticipant.role)) {
      return res.status(403).json({ message: 'Only organizers can delete tasks' });
    }

    await Task.deleteOne({ _id: req.params.taskId });
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    logger.error('Task delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
