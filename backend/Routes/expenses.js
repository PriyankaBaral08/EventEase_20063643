const express = require('express');
const { body, validationResult } = require('express-validator');
const Expense = require('../Models/expense');
const Event = require('../Models/event');
const auth = require('../Middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get expenses for an event
router.get('/event/:eventId', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check access
    const hasAccess = event.organizer.toString() === req.user.userId ||
      event.participants.some(p => p.user.toString() === req.user.userId);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const expenses = await Expense.find({ event: req.params.eventId })
      .populate('paidBy', 'username email')
      .populate('splitBetween.user', 'username email')
      .sort({ date: -1 });

    res.json(expenses);
  } catch (error) {
    logger.error('Expenses fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new expense
router.post('/', [auth, [
  body('event').isMongoId().withMessage('Valid event ID is required'),
  body('title').trim().notEmpty().isLength({ max: 100 }).withMessage('Title is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
  body('category').isIn(['accommodation', 'food', 'transport', 'entertainment', 'other']),
  body('splitBetween').isArray().withMessage('Split between must be an array')
]], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { event, title, description, amount, category, splitBetween } = req.body;

    const eventDoc = await Event.findById(event);
    if (!eventDoc) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const hasAccess = eventDoc.organizer.toString() === req.user.userId ||
      eventDoc.participants.some(p => p.user.toString() === req.user.userId);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const totalSplit = splitBetween.reduce((sum, split) => sum + split.amount, 0);
    if (Math.abs(totalSplit - amount) > 0.01) {
      return res.status(400).json({ message: 'Split amounts must equal total amount' });
    }

    const expense = new Expense({
      event,
      title,
      description,
      amount,
      category,
      paidBy: req.user.userId,
      splitBetween
    });

    await expense.save();
    await expense.populate('paidBy', 'username email');
    await expense.populate('splitBetween.user', 'username email');

    logger.info(`Expense created: ${title} for event ${event}`);
    res.status(201).json(expense);
  } catch (error) {
    logger.error('Expense creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get expense summary for an event
router.get('/summary/:eventId', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const hasAccess = event.organizer.toString() === req.user.userId ||
      event.participants.some(p => p.user.toString() === req.user.userId);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const expenses = await Expense.find({ event: req.params.eventId })
      .populate('paidBy', 'username email')
      .populate('splitBetween.user', 'username email');

    const balances = {};
    const userBalances = {};

    expenses.forEach(expense => {
      const paidBy = expense.paidBy._id.toString();

      if (!userBalances[paidBy]) {
        userBalances[paidBy] = {
          paid: 0,
          owes: 0,
          username: expense.paidBy.username
        };
      }
      userBalances[paidBy].paid += expense.amount;

      expense.splitBetween.forEach(split => {
        const userId = split.user._id.toString();

        if (!userBalances[userId]) {
          userBalances[userId] = {
            paid: 0,
            owes: 0,
            username: split.user.username
          };
        }

        userBalances[userId].owes += split.amount;
      });
    });

    Object.keys(userBalances).forEach(userId => {
      const user = userBalances[userId];
      balances[userId] = {
        username: user.username,
        balance: user.paid - user.owes
      };
    });

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    res.json({
      totalExpenses,
      expenseCount: expenses.length,
      balances,
      expenses
    });
  } catch (error) {
    logger.error('Expense summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// NEW: Get total expenses across all events for dashboard
router.get('/total', auth, async (req, res) => {
  try {
    const events = await Event.find({
      $or: [
        { organizer: req.user.userId },
        { 'participants.user': req.user.userId }
      ]
    });

    const eventIds = events.map(event => event._id);

    const expenses = await Expense.aggregate([
      { $match: { event: { $in: eventIds } } },
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
    ]);

    const totalAmount = expenses.length > 0 ? expenses[0].totalAmount : 0;

    res.json({ totalExpenses: totalAmount });
  } catch (error) {
    logger.error('Total expenses calculation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
