const express = require('express');
const { body, validationResult } = require('express-validator');
const Event = require('../Models/event');
const User = require('../Models/user');
const auth = require('../Middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// 🔹 Join an Event (by eventId)
router.post('/:id/join', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const alreadyParticipant = event.participants.some(
      (p) => p.user.toString() === req.user.userId
    );
    if (alreadyParticipant) {
      return res.status(400).json({ message: 'You already joined this event' });
    }

    event.participants.push({ user: req.user.userId, role: 'participant' });
    await event.save();
    await event.populate('participants.user', 'username email');

    logger.info(`User ${req.user.userId} joined event ${req.params.id}`);
    res.status(200).json({ message: 'Successfully joined the event', event });
  } catch (err) {
    logger.error('Join event error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔹 Get all events where user is organizer or participant
router.get('/', auth, async (req, res) => {
  try {
    const events = await Event.find({
      $or: [
        { organizer: req.user.userId },
        { 'participants.user': req.user.userId }
      ]
    })
      .populate('organizer', 'username email')
      .populate('participants.user', 'username email')
      .sort({ startDate: -1 });

    res.json(events);
  } catch (error) {
    logger.error('Events fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔹 Get single event by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'username email')
      .populate('participants.user', 'username email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const hasAccess =
      event.organizer._id.toString() === req.user.userId ||
      event.participants.some((p) => p.user._id.toString() === req.user.userId);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(event);
  } catch (error) {
    logger.error('Event fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔹 Create a new event
router.post(
  '/',
  [
    auth,
    [
      body('title').trim().notEmpty().isLength({ max: 100 }),
      body('type').isIn(['trip', 'party', 'dinner', 'meeting', 'other']),
      body('startDate').isISO8601(),
      body('endDate').isISO8601(),
      body('location').trim().notEmpty()
    ]
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, type, startDate, endDate, location, budget, tags } = req.body;

      if (new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }

      const event = new Event({
        title,
        description,
        type,
        startDate,
        endDate,
        location,
        budget: budget || 0,
        organizer: req.user.userId,
        participants: [{ user: req.user.userId, role: 'organizer' }],
        tags: tags || []
      });

      await event.save();
      await event.populate('organizer', 'username email');
      await event.populate('participants.user', 'username email');

      logger.info(`Event created: ${title} by user ${req.user.userId}`);
      res.status(201).json(event);
    } catch (error) {
      logger.error('Event creation error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);
// POST /api/events/:id/join-request
router.post('/:id/join-request', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.organizer.toString() === req.user.userId) {
      return res.status(400).json({ message: 'Organizer is already part of event' });
    }

    if (event.participants.some(p => p.user.toString() === req.user.userId)) {
      return res.status(400).json({ message: 'You are already a participant' });
    }

    if (event.pendingJoinRequests.includes(req.user.userId)) {
      return res.status(400).json({ message: 'Join request already sent' });
    }

    event.pendingJoinRequests.push(req.user.userId);
    await event.save();

    res.status(200).json({ message: 'Join request sent to organizer for approval' });
  } catch (err) {
    console.error('Join request error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// POST /api/events/:id/approve/:userId
router.post('/:id/approve/:userId', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.organizer.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only organizer can approve participants' });
    }

    const userId = req.params.userId;
    if (!event.pendingJoinRequests.includes(userId)) {
      return res.status(400).json({ message: 'No such join request' });
    }

    // Remove from pending and add to participants
    event.pendingJoinRequests = event.pendingJoinRequests.filter(id => id.toString() !== userId);
    event.participants.push({ user: userId, role: 'participant' });

    await event.save();
    await event.populate('participants.user', 'username email');

    res.status(200).json({ message: 'User approved and added to event', event });
  } catch (err) {
    console.error('Approval error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// 🔹 Add participant to event (organizer only)
router.post('/:id/participants', auth, async (req, res) => {
  try {
    const { userEmail, role = 'participant' } = req.body;

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const userParticipant = event.participants.find(
      (p) => p.user.toString() === req.user.userId
    );

    if (!userParticipant || !['organizer', 'co-organizer'].includes(userParticipant.role)) {
      return res.status(403).json({ message: 'Only organizers can add participants' });
    }

    const userToAdd = await User.findOne({ email: userEmail.toLowerCase() });
    if (!userToAdd) return res.status(404).json({ message: 'User not found' });

    if (event.participants.some((p) => p.user.toString() === userToAdd._id.toString())) {
      return res.status(400).json({ message: 'User is already a participant' });
    }

    event.participants.push({ user: userToAdd._id, role });
    await event.save();
    await event.populate('participants.user', 'username email');

    logger.info(`Participant added to event ${event._id}: ${userEmail}`);
    res.json(event);
  } catch (error) {
    logger.error('Add participant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔹 Remove participant from event (organizer only)
router.delete('/:id/participants/:userId', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const userParticipant = event.participants.find(
      (p) => p.user.toString() === req.user.userId
    );

    if (!userParticipant || !['organizer', 'co-organizer'].includes(userParticipant.role)) {
      return res.status(403).json({ message: 'Only organizers can remove participants' });
    }

    if (req.params.userId === event.organizer.toString()) {
      return res.status(400).json({ message: 'Organizer cannot be removed' });
    }

    event.participants = event.participants.filter(
      (p) => p.user.toString() !== req.params.userId
    );

    await event.save();
    await event.populate('participants.user', 'username email');

    logger.info(`Participant removed from event ${event._id}: ${req.params.userId}`);
    res.json(event);
  } catch (error) {
    logger.error('Remove participant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔹 Update event (organizer only)
router.put(
  '/:id',
  [
    auth,
    [
      body('title').optional().trim().isLength({ max: 100 }),
      body('type').optional().isIn(['trip', 'party', 'dinner', 'meeting', 'other']),
      body('startDate').optional().isISO8601(),
      body('endDate').optional().isISO8601(),
      body('status').optional().isIn(['planning', 'active', 'completed', 'cancelled'])
    ]
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const event = await Event.findById(req.params.id);
      if (!event) return res.status(404).json({ message: 'Event not found' });

      const userParticipant = event.participants.find(
        (p) => p.user.toString() === req.user.userId
      );

      if (!userParticipant || !['organizer', 'co-organizer'].includes(userParticipant.role)) {
        return res.status(403).json({ message: 'Only organizers can update events' });
      }

      if (req.body.startDate && req.body.endDate) {
        if (new Date(req.body.startDate) >= new Date(req.body.endDate)) {
          return res.status(400).json({ message: 'End date must be after start date' });
        }
      }

      Object.assign(event, req.body);
      await event.save();
      await event.populate('organizer', 'username email');
      await event.populate('participants.user', 'username email');

      logger.info(`Event updated: ${event._id}`);
      res.json(event);
    } catch (error) {
      logger.error('Event update error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
