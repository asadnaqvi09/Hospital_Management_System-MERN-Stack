import { pool } from "../../shared/config/db.js"

export const findUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT id, email, phone, password_hash, full_name, role, is_active, two_fa_secret, two_fa_enabled
     FROM users
     WHERE email = $1`,
    [email]
  )
  return result.rows[0] || null
}

export const findUserById = async (userId) => {
  const result = await pool.query(
    `SELECT id, email, phone, full_name, role, is_active, two_fa_enabled, created_at
     FROM users
     WHERE id = $1`,
    [userId]
  )
  return result.rows[0] || null
}

export const findUserWithSecretById = async (userId) => {
  const result = await pool.query(
    `SELECT id, email, role, is_active, two_fa_secret, two_fa_enabled
     FROM users
     WHERE id = $1`,
    [userId]
  )
  return result.rows[0] || null
}

export const createRefreshToken = async ({ userId, tokenHash, userAgent, ipAddress, expiresAt }) => {
  const result = await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, user_agent, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [userId, tokenHash, userAgent, ipAddress, expiresAt]
  )
  return result.rows[0]
}

export const findRefreshTokenByHash = async (tokenHash) => {
  const result = await pool.query(
    `SELECT id, user_id, revoked_at, expires_at
     FROM refresh_tokens
     WHERE token_hash = $1`,
    [tokenHash]
  )
  return result.rows[0] || null
}

export const revokeRefreshTokenById = async (tokenId) => {
  await pool.query(
    `UPDATE refresh_tokens
     SET revoked_at = NOW()
     WHERE id = $1 AND revoked_at IS NULL`,
    [tokenId]
  )
}

export const revokeRefreshTokenByHash = async (tokenHash) => {
  const result = await pool.query(
    `UPDATE refresh_tokens
     SET revoked_at = NOW()
     WHERE token_hash = $1 AND revoked_at IS NULL
     RETURNING id`,
    [tokenHash]
  )
  return result.rows[0] || null
}

export const revokeAllRefreshTokensForUser = async (userId) => {
  await pool.query(
    `UPDATE refresh_tokens
     SET revoked_at = NOW()
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  )
}

export const listActiveSessionsForUser = async (userId) => {
  const result = await pool.query(
    `SELECT id, user_agent, ip_address, created_at, expires_at
     FROM refresh_tokens
     WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
     ORDER BY created_at DESC`,
    [userId]
  )
  return result.rows
}

export const revokeSessionForUser = async (sessionId, userId) => {
  const result = await pool.query(
    `UPDATE refresh_tokens
     SET revoked_at = NOW()
     WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
     RETURNING id`,
    [sessionId, userId]
  )
  return result.rows[0] || null
}

export const setUserTwoFactorSecret = async (userId, secret) => {
  await pool.query(
    `UPDATE users
     SET two_fa_secret = $2, updated_at = NOW()
     WHERE id = $1`,
    [userId, secret]
  )
}

export const enableUserTwoFactor = async (userId) => {
  await pool.query(
    `UPDATE users
     SET two_fa_enabled = TRUE, updated_at = NOW()
     WHERE id = $1`,
    [userId]
  )
}

export const updateUserPasswordByEmail = async (email, passwordHash) => {
  const result = await pool.query(
    `UPDATE users
     SET password_hash = $2, updated_at = NOW()
     WHERE email = $1
     RETURNING id`,
    [email, passwordHash]
  )
  return result.rows[0] || null
}
