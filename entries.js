const express = require('express');
const router = express.Router();
const Entry = require('../models/Entry');
const authMiddleware = require('../middleware/auth');
const { analyzeText } = require('../utils/nlpAnalyzer');

// All routes require authentication
router.use(authMiddleware);

// POST /api/entries - Create new entry
router.post('/', async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!content || content.trim().length < 5) {
      return res.status(400).json({ message: 'Content is required (min 5 characters).' });
    }

    // Run NLP analysis
    const analysis = analyzeText(content);

    const entry = new Entry({
      userId: req.user.id,
      title: title || 'Untitled',
      content,
      sentiment: {
        score: analysis.score,
        label: analysis.label,
        positive: analysis.positive,
        negative: analysis.negative,
        emotions: analysis.emotions
      }
    });

    await entry.save();

    res.status(201).json({
      message: 'Entry saved successfully.',
      entry,
      analysis: {
        label: analysis.label,
        dominant: analysis.dominant,
        emotions: analysis.emotions,
        positiveWords: analysis.positiveWords,
        negativeWords: analysis.negativeWords
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// GET /api/entries - Get all entries for logged-in user
router.get('/', async (req, res) => {
  try {
    const entries = await Entry.find({ userId: req.user.id })
      .sort({ date: -1 })
      .select('-__v');

    res.json({ entries });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// GET /api/entries/trends - Get monthly trend data
router.get('/trends', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const entries = await Entry.find({
      userId: req.user.id,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 });

    if (entries.length === 0) {
      return res.json({ trends: [], summary: null });
    }

    // Build daily trend data
    const dailyMap = {};
    entries.forEach(entry => {
      const dayKey = entry.date.toISOString().split('T')[0];
      if (!dailyMap[dayKey]) {
        dailyMap[dayKey] = { scores: [], emotions: { joy: [], sadness: [], anger: [], fear: [], surprise: [] } };
      }
      dailyMap[dayKey].scores.push(entry.sentiment.score);
      Object.keys(entry.sentiment.emotions).forEach(em => {
        dailyMap[dayKey].emotions[em].push(entry.sentiment.emotions[em] || 0);
      });
    });

    const trends = Object.entries(dailyMap).map(([date, data]) => {
      const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
      const avgEmotions = {};
      Object.keys(data.emotions).forEach(em => {
        const arr = data.emotions[em];
        avgEmotions[em] = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
      });
      return { date, avgScore: Math.round(avgScore * 10) / 10, emotions: avgEmotions };
    });

    // Summary statistics
    const totalEntries = entries.length;
    const avgScore = entries.reduce((s, e) => s + e.sentiment.score, 0) / totalEntries;

    const emotionTotals = { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0 };
    entries.forEach(e => {
      Object.keys(emotionTotals).forEach(em => {
        emotionTotals[em] += e.sentiment.emotions[em] || 0;
      });
    });
    const avgEmotions = {};
    Object.keys(emotionTotals).forEach(em => {
      avgEmotions[em] = Math.round(emotionTotals[em] / totalEntries);
    });

    const dominantEmotion = Object.entries(avgEmotions).sort((a, b) => b[1] - a[1])[0][0];

    const summary = {
      totalEntries,
      avgScore: Math.round(avgScore * 10) / 10,
      avgEmotions,
      dominantEmotion,
      overallMood: avgScore >= 2 ? 'Positive' : avgScore >= -1 ? 'Neutral' : 'Negative'
    };

    res.json({ trends, summary });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// GET /api/entries/:id - Get single entry
router.get('/:id', async (req, res) => {
  try {
    const entry = await Entry.findOne({ _id: req.params.id, userId: req.user.id });
    if (!entry) return res.status(404).json({ message: 'Entry not found.' });
    res.json({ entry });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// DELETE /api/entries/:id - Delete entry
router.delete('/:id', async (req, res) => {
  try {
    const entry = await Entry.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!entry) return res.status(404).json({ message: 'Entry not found.' });
    res.json({ message: 'Entry deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

module.exports = router;
