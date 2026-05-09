const redis = require('../config/redis');

const PRESENCE_TTL = 24 * 60 * 60; // 1 day safety TTL

const presenceKey = (boardId) => `presence:${boardId}`;

/**
 * Add a user to the presence set for a board.
 */
const addUser = async (boardId, userJson) => {
  const key = presenceKey(boardId);
  await redis.hset(key, userJson.userId, JSON.stringify(userJson));
  await redis.expire(key, PRESENCE_TTL);
};

/**
 * Remove a user from the presence set for a board.
 */
const removeUser = async (boardId, userId) => {
  await redis.hdel(presenceKey(boardId), userId);
};

/**
 * Get all online users for a board.
 */
const getOnlineUsers = async (boardId) => {
  const data = await redis.hgetall(presenceKey(boardId));
  if (!data) return [];
  return Object.values(data).map((v) => JSON.parse(v));
};

module.exports = { addUser, removeUser, getOnlineUsers };
