// twitter-api.js
// Fetch Twitter metrics using Twitter API v2 (requires Bearer Token)
const fetch = require('node-fetch');

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const USERNAME = 'AetheronPlatform'; // Change to your Twitter handle

async function getTwitterMetrics() {
  if (!BEARER_TOKEN)
    throw new Error('TWITTER_BEARER_TOKEN not set in environment');
  // Get user ID
  const userRes = await fetch(
    `https://api.twitter.com/2/users/by/username/${USERNAME}`,
    {
      headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
    },
  );
  const userData = await userRes.json();
  const userId = userData.data && userData.data.id;
  if (!userId) throw new Error('Twitter user not found');
  // Get metrics
  const metricsRes = await fetch(
    `https://api.twitter.com/2/users/${userId}?user.fields=public_metrics`,
    {
      headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
    },
  );
  const metricsData = await metricsRes.json();
  const metrics = metricsData.data && metricsData.data.public_metrics;
  return {
    followers: metrics.followers_count,
    following: metrics.following_count,
    tweets: metrics.tweet_count,
    listed: metrics.listed_count,
  };
}

module.exports = { getTwitterMetrics };
