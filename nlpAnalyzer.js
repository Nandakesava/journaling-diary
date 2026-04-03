const Sentiment = require('sentiment');
const analyzer = new Sentiment();

// Emotion word dictionaries
const emotionWords = {
  joy: [
    'happy', 'joyful', 'excited', 'wonderful', 'great', 'amazing', 'love', 'fantastic',
    'delighted', 'cheerful', 'glad', 'pleased', 'thrilled', 'ecstatic', 'blissful',
    'grateful', 'thankful', 'blessed', 'smile', 'laugh', 'celebrate', 'fun', 'enjoy',
    'content', 'peaceful', 'awesome', 'brilliant', 'superb', 'magnificent', 'elated'
  ],
  sadness: [
    'sad', 'unhappy', 'depressed', 'lonely', 'grief', 'sorrow', 'cry', 'tears',
    'miserable', 'heartbroken', 'disappointed', 'hopeless', 'gloomy', 'melancholy',
    'upset', 'lost', 'empty', 'hurt', 'pain', 'suffer', 'miss', 'regret', 'despair',
    'unfortunate', 'tragedy', 'mourn', 'weep', 'broken', 'helpless', 'worthless'
  ],
  anger: [
    'angry', 'furious', 'mad', 'rage', 'hate', 'frustrated', 'annoyed', 'irritated',
    'outraged', 'hostile', 'bitter', 'resentful', 'disgusted', 'infuriated', 'livid',
    'aggressive', 'violent', 'cruel', 'rude', 'offensive', 'terrible', 'awful',
    'horrible', 'stupid', 'idiotic', 'unfair', 'injustice', 'betrayed', 'lied'
  ],
  fear: [
    'afraid', 'scared', 'fear', 'anxious', 'nervous', 'worried', 'panic', 'terrified',
    'dread', 'horror', 'frightened', 'uneasy', 'stressed', 'tension', 'threat',
    'danger', 'unsafe', 'insecure', 'vulnerable', 'uncertain', 'doubt', 'hesitate',
    'paranoid', 'overwhelmed', 'pressure', 'helpless', 'confused', 'lost', 'alone'
  ],
  surprise: [
    'surprised', 'shocked', 'amazed', 'astonished', 'unexpected', 'sudden', 'wow',
    'unbelievable', 'incredible', 'stunning', 'astounding', 'remarkable', 'bizarre',
    'strange', 'weird', 'odd', 'unusual', 'extraordinary', 'miraculous', 'revelation'
  ]
};

function countEmotionWords(text, wordList) {
  const lowerText = text.toLowerCase();
  const words = lowerText.match(/\b\w+\b/g) || [];
  let count = 0;
  words.forEach(word => {
    if (wordList.includes(word)) count++;
  });
  return count;
}

function analyzeEmotion(text) {
  const totalWords = (text.match(/\b\w+\b/g) || []).length || 1;

  const rawCounts = {};
  let totalEmotionWords = 0;

  for (const [emotion, words] of Object.entries(emotionWords)) {
    rawCounts[emotion] = countEmotionWords(text, words);
    totalEmotionWords += rawCounts[emotion];
  }

  // Normalize to percentages
  const emotions = {};
  if (totalEmotionWords === 0) {
    // No emotion words found - use sentiment score to guess
    emotions.joy = 0;
    emotions.sadness = 0;
    emotions.anger = 0;
    emotions.fear = 0;
    emotions.surprise = 0;
  } else {
    for (const [emotion, count] of Object.entries(rawCounts)) {
      emotions[emotion] = Math.round((count / totalEmotionWords) * 100);
    }
  }

  return emotions;
}

function getSentimentLabel(score) {
  if (score >= 5) return 'Very Positive';
  if (score >= 2) return 'Positive';
  if (score >= -1) return 'Neutral';
  if (score >= -4) return 'Negative';
  return 'Very Negative';
}

function getDominantEmotion(emotions, sentimentScore) {
  const maxVal = Math.max(...Object.values(emotions));
  if (maxVal === 0) {
    if (sentimentScore > 1) return 'joy';
    if (sentimentScore < -1) return 'sadness';
    return 'neutral';
  }
  return Object.keys(emotions).find(k => emotions[k] === maxVal);
}

function analyzeText(text) {
  const result = analyzer.analyze(text);
  const emotions = analyzeEmotion(text);
  const label = getSentimentLabel(result.score);
  const dominant = getDominantEmotion(emotions, result.score);

  // If no emotion words found but sentiment score is strong, fill in dominant
  if (Math.max(...Object.values(emotions)) === 0) {
    if (result.score > 1) emotions.joy = 60;
    else if (result.score < -1) emotions.sadness = 60;
    else emotions.joy = 20;
  }

  return {
    score: result.score,
    label,
    dominant,
    positive: result.positive.length,
    negative: result.negative.length,
    emotions,
    positiveWords: result.positive,
    negativeWords: result.negative
  };
}

module.exports = { analyzeText };
