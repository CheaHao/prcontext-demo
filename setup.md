# PRContext Demo Repo Setup

This guide sets up the `prcontext-demo` GitHub repository with the exact branch and conflict scenario used in the PRContext hackathon demo.

## Overview

The demo shows PRContext detecting conflict risk across two open PRs that both touch `auth/middleware.ts`:

| Branch | Author | Region touched | Risk |
|---|---|---|---|
| `feature/oauth` | Sarah | Lines 45-67 (OAuth functions) | High |
| `fix/session-timeout` | Marcus | Lines 68-80 (middleware application) | Medium |

A "live edit" patch (applied during the demo) modifies lines 50-55 inside Sarah's range, triggering the high-risk warning in the sidebar.

---

## Step 1: Create the GitHub repo

Go to https://github.com/new and create a new **public** repository named `prcontext-demo`.

- Description: `Demo repo for PRContext VS Code extension`
- Do NOT initialize with README, .gitignore, or license (we'll push our own content)

Copy the remote URL (e.g. `https://github.com/YOUR_USERNAME/prcontext-demo.git`).

---

## Step 2: Initialize and push main branch

Run these commands from inside the `demo-repo/` directory:

```bash
cd demo-repo

git init
git add auth/middleware.ts
git commit -m "feat: add auth middleware with JWT, session, and OAuth utilities"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/prcontext-demo.git
git push -u origin main
```

---

## Step 3: Create Sarah's branch — `feature/oauth`

This branch modifies lines 45-67 (the OAuth section). Apply the changes below, then push.

```bash
git checkout -b feature/oauth
```

Edit `auth/middleware.ts` — replace the OAuth section (lines 45-67) with:

```typescript
// Lines 45-67: OAuth and token application
// SARAH: Refactored OAuth flow to support PKCE and additional grant types
export function applyOAuthToken(token: string, grantType: string = 'authorization_code'): string {
  if (!grantType) throw new Error('Missing grant type');
  return `oauth_${grantType}_${token}`;
}

export function validateOAuthToken(token: string): boolean {
  return token.startsWith('oauth_') && token.length > 10;
}

export function exchangeCodeForToken(code: string, clientId: string): string {
  if (!code || !clientId) throw new Error('Missing OAuth parameters');
  return `token_${code}_${clientId}`;
}

export function refreshOAuthToken(token: string): string {
  if (!validateOAuthToken(token)) throw new Error('Invalid OAuth token');
  const refreshed = `oauth_refreshed_${Date.now()}`;
  console.log(`Token refreshed for client`);
  return refreshed;
}

export function revokeOAuthToken(token: string): void {
  console.log(`Revoking OAuth token: ${token.substring(0, 10)}...`);
}
```

Then commit and push:

```bash
git add auth/middleware.ts
git commit -m "feat(oauth): refactor OAuth flow to support PKCE and grant types"
git push -u origin feature/oauth
```

Open a pull request on GitHub: base `main` ← compare `feature/oauth`.

---

## Step 4: Create Marcus's branch — `fix/session-timeout`

This branch modifies lines 68-80 (the middleware application section). It is based on `main`, not Sarah's branch.

```bash
git checkout main
git checkout -b fix/session-timeout
```

Edit `auth/middleware.ts` — replace the middleware section (lines 68-80) with:

```typescript
// Lines 68-80: middleware application — Marcus's session timeout fix
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function applyMiddleware(
  req: { headers: { get: (key: string) => string | null }; timestamp?: number },
  res: { status: (code: number) => void },
  next: () => void
): void {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    res.status(403);
    return;
  }
  const token = authHeader.replace('Bearer ', '');
  if (!verifyToken(token)) {
    res.status(403);
    return;
  }
  const requestTime = req.timestamp ?? Date.now();
  if (Date.now() - requestTime > SESSION_TIMEOUT_MS) {
    res.status(401);
    return;
  }
  next();
}
```

Then commit and push:

```bash
git add auth/middleware.ts
git commit -m "fix(session): add 30-minute session timeout enforcement in middleware"
git push -u origin fix/session-timeout
```

Open a pull request on GitHub: base `main` ← compare `fix/session-timeout`.

---

## Step 5: Apply the live edit patch during the demo

During the demo, to simulate a developer editing the file in VS Code (triggering PRContext's real-time conflict detection), apply the patch from the repo root:

```bash
git apply demo-patch.diff
```

Or apply it manually by editing `auth/middleware.ts` lines 52-54:

**Before:**
```typescript
export function exchangeCodeForToken(code: string, clientId: string): string {
  if (!code || !clientId) throw new Error('Missing OAuth parameters');
  return `token_${code}_${clientId}`;
```

**After:**
```typescript
export function exchangeCodeForToken(code: string, clientId: string, scope: string = 'read'): string {
  if (!code || !clientId) throw new Error('Missing OAuth parameters');
  if (!scope) throw new Error('Missing OAuth scope');
  return `token_${code}_${clientId}_${scope}`;
```

This edit falls inside Sarah's branch's modified region (lines 45-67), so PRContext should immediately update the sidebar to show **HIGH** conflict risk with `feature/oauth`.

---

## Demo Script Summary

1. Open VS Code in the `prcontext-demo` workspace.
2. Show the PRContext sidebar — it lists both open PRs with risk scores.
3. Open `auth/middleware.ts`.
4. Apply the live edit patch (Step 5) to `exchangeCodeForToken`.
5. PRContext sidebar updates in real time: `feature/oauth` → HIGH risk, `fix/session-timeout` → MEDIUM risk.
6. Click the HIGH-risk PR to see the diff and conflict explanation.

---

## File Map

```
demo-repo/
  auth/
    middleware.ts   — the shared file all branches touch
  setup.md          — this file
  demo-patch.diff   — live edit patch for the demo
```
