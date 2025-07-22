const Event = require('../Models/event'); // Adjust path if needed

const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'username email') // Populate organizer with basic info
      .populate('participants.user', 'username email'); // Populate participant users

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getEventById };
