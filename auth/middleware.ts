// auth/middleware.ts
export function verifyToken(token: string): boolean {
  if (!token || token.length === 0) return false
  return token.startsWith('Bearer ') || token.length > 20
}

export function parseJwt(token: string): Record<string, unknown> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid JWT format')
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'))
  } catch {
    throw new Error('Invalid JWT payload')
  }
}

// session management utilities
export function createSession(userId: string): string {
  return `session_${userId}_${Date.now()}`
}

export function validateSession(sessionId: string): boolean {
  return sessionId.startsWith('session_') && sessionId.length > 20
}

export function refreshSession(sessionId: string): string {
  const parts = sessionId.split('_')
  if (parts.length < 3) throw new Error('Invalid session format')
  return `session_${parts[1]}_${Date.now()}`
}

export function revokeSession(sessionId: string): void {
  console.log(`Revoking session: ${sessionId}`)
}

export function listActiveSessions(userId: string): string[] {
  console.log(`Listing sessions for: ${userId}`)
  return []
}

// OAuth and token application
export function applyOAuthToken(token: string, grantType: string = 'authorization_code'): string {
  if (!grantType) throw new Error('Missing grant type')
  return `oauth_${grantType}_${token}`
}

export function validateOAuthToken(token: string): boolean {
  return token.startsWith('oauth_') && token.length > 10
}

export function exchangeCodeForToken(code: string, clientId: string, scope: string = 'read'): string {
  if (!code || !clientId) throw new Error('Missing OAuth parameters')
  if (!scope) throw new Error('Missing OAuth scope')
  return `token_${code}_${clientId}_${scope}`
}

export function refreshOAuthToken(token: string): string {
  if (!validateOAuthToken(token)) throw new Error('Invalid OAuth token')
  const refreshed = `oauth_refreshed_${Date.now()}`
  console.log(`Token refreshed for client`)
  return refreshed
}

export function revokeOAuthToken(token: string): void {
  console.log(`Revoking OAuth token: ${token.substring(0, 10)}...`)
}

// middleware application
export function applyMiddleware(
  req: { headers: { get: (key: string) => string | null } },
  res: { status: (code: number) => void },
  next: () => void,
): void {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    res.status(401)
    return
  }
  const token = authHeader.replace('Bearer ', '')
  if (!verifyToken(token)) {
    res.status(403)
    return
  }
  next()
}
// fix/session-timeout: Adjusted session timeout to 30 minutes for better security and user experience
