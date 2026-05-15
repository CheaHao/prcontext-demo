# PRContext Demo Repo Setup

This guide sets up the `prcontext-demo` GitHub repository with the exact branch and conflict scenario used in the PRContext hackathon demo.

## Overview

The demo shows two PRContext features simultaneously:

**Live Branch Conflicts** — your uncommitted edits vs open PRs:

| Branch | Author | Region touched | Risk |
|---|---|---|---|
| `fix/session-timeout` | Marcus | Lines 68–80 (middleware application) | Medium |

**Rebase Preview** — your committed branch vs what landed on main:

| Merged branch | Author | Region touched | Risk |
|---|---|---|---|
| `feature/oauth` | Sarah | Lines 45–67 (OAuth functions) | High |

Sarah's PR is merged to `main` during setup. Your local `feature/add-scope` branch has a committed change in the same OAuth region — so Rebase Preview immediately warns you that rebasing will conflict with her work.

---

## Step 1: Create the GitHub repo

Go to https://github.com/new and create a new **public** repository named `prcontext-demo`.

- Description: `Demo repo for PRContext VS Code extension`
- Do NOT initialize with README, .gitignore, or license (we push our own content)

Copy the remote URL (e.g. `https://github.com/YOUR_USERNAME/prcontext-demo.git`).

---

## Step 2: Initialize and push main branch

Run these commands from inside the `demo-repo/` directory:

```bash
cd demo-repo

git init
git add auth/middleware.ts demo-patch.diff
git commit -m "feat: add auth middleware with JWT, session, and OAuth utilities"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/prcontext-demo.git
git push -u origin main
```

---

## Step 3: Create Sarah's branch — `feature/oauth`

This branch refactors lines 45–67 (the OAuth section). Apply the changes below, then push.

```bash
git checkout -b feature/oauth
```

Edit `auth/middleware.ts` — replace the OAuth section (lines 44–65) with:

```typescript
// Lines 45-67: OAuth and token application
// SARAH: Refactored OAuth flow to support PKCE and additional grant types
export function applyOAuthToken(token: string, grantType: string = 'authorization_code'): string {
  if (!grantType) throw new Error('Missing grant type')
  return `oauth_${grantType}_${token}`
}

export function validateOAuthToken(token: string): boolean {
  return token.startsWith('oauth_') && token.length > 10
}

export function exchangeCodeForToken(code: string, clientId: string): string {
  if (!code || !clientId) throw new Error('Missing OAuth parameters')
  return `token_${code}_${clientId}`
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
```

Then commit and push:

```bash
git add auth/middleware.ts
git commit -m "feat(oauth): refactor OAuth flow to support PKCE and grant types"
git push -u origin feature/oauth
```

Open a pull request on GitHub: base `main` ← compare `feature/oauth`.

---

## Step 3.5: Merge Sarah's PR into main

On GitHub, merge the `feature/oauth` pull request into `main`. This simulates Sarah's work landing while you were mid-feature.

Pull the updated main locally:

```bash
git checkout main
git pull
```

Sarah's branch is now closed. Her OAuth changes are on `main`. This is what the **Rebase Preview** section will detect.

---

## Step 4: Create Marcus's branch — `fix/session-timeout`

This branch modifies lines 68–80 (the middleware application section). It is based on `main`, not Sarah's branch.

```bash
git checkout main
git checkout -b fix/session-timeout
```

Edit `auth/middleware.ts` — replace the middleware section (lines 67–91) with:

```typescript
// Lines 68-80: middleware application — Marcus's session timeout fix
const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

export function applyMiddleware(
  req: { headers: { get: (key: string) => string | null }; timestamp?: number },
  res: { status: (code: number) => void },
  next: () => void,
): void {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    res.status(403)
    return
  }
  const token = authHeader.replace('Bearer ', '')
  if (!verifyToken(token)) {
    res.status(403)
    return
  }
  const requestTime = req.timestamp ?? Date.now()
  if (Date.now() - requestTime > SESSION_TIMEOUT_MS) {
    res.status(401)
    return
  }
  next()
}
```

Then commit and push:

```bash
git add auth/middleware.ts
git commit -m "fix(session): add 30-minute session timeout enforcement in middleware"
git push -u origin fix/session-timeout
```

Open a pull request on GitHub: base `main` ← compare `fix/session-timeout`. **Leave this PR open.**

---

## Step 5: Create your local working branch — `feature/add-scope`

This is the branch you will be on during the demo. It was created from `main` before Sarah's merge, so it is behind main — exactly the scenario Rebase Preview warns you about.

```bash
git checkout main
git checkout -b feature/add-scope
```

Add a `scope` parameter to `exchangeCodeForToken` inside `auth/middleware.ts` (lines 58–61):

**Before:**
```typescript
export function exchangeCodeForToken(code: string, clientId: string): string {
  if (!code || !clientId) throw new Error('Missing OAuth parameters')
  return `token_${code}_${clientId}`
}
```

**After:**
```typescript
export function exchangeCodeForToken(code: string, clientId: string, scope: string = 'read'): string {
  if (!code || !clientId) throw new Error('Missing OAuth parameters')
  if (!scope) throw new Error('Missing OAuth scope')
  return `token_${code}_${clientId}_${scope}`
}
```

Commit this change (do not push — leave the branch local to simulate an unpushed feature branch):

```bash
git add auth/middleware.ts
git commit -m "feat: add scope parameter to exchangeCodeForToken"
```

This committed change overlaps Sarah's OAuth region (lines 45–67). When PRContext checks the Rebase Preview, it will see that `main` now has Sarah's refactored OAuth functions and flag `auth/middleware.ts` as **HIGH** conflict risk for a rebase.

---

## Step 6: Apply the live edit patch during the demo

During the demo, simulate an additional uncommitted edit that overlaps Marcus's region. From inside `demo-repo/` in the integrated terminal:

```bash
git apply demo-patch.diff
```

Or apply manually — edit `auth/middleware.ts` around line 53:

**Before:**
```typescript
export function exchangeCodeForToken(code: string, clientId: string): string {
  if (!code || !clientId) throw new Error('Missing OAuth parameters')
  return `token_${code}_${clientId}`
```

**After:**
```typescript
export function exchangeCodeForToken(code: string, clientId: string, scope: string = 'read'): string {
  if (!code || !clientId) throw new Error('Missing OAuth parameters')
  if (!scope) throw new Error('Missing OAuth scope')
  return `token_${code}_${clientId}_${scope}`
```

Save the file. PRContext updates the **Live Branch Conflicts** section:
- `fix/session-timeout` (Marcus) → **SAME FILE** (medium)

The **Rebase Preview** section is already showing the high-risk conflict with Sarah's merged changes — no action needed.

To reset after the demo:

```bash
git checkout auth/middleware.ts
```

---

## Demo Script Summary

1. Open VS Code in the `demo-repo/` workspace on the `feature/add-scope` branch (Extension Development Host).
2. Show the PRContext sidebar — **Rebase Preview** already shows Sarah's merged `feature/oauth` as HIGH risk.
3. Explain: "I haven't rebased yet. Sarah's PR merged while I was working — PRContext already knows I'll have a conflict."
4. Open `auth/middleware.ts`.
5. Apply the live edit patch to show **Live Branch Conflicts** — Marcus's open PR appears as SAME FILE.
6. Click the HIGH-risk file in **Rebase Preview** to open the diff: your `feature/add-scope` changes on the left, Sarah's merged version on the right.

To reset after the demo:

```bash
git checkout auth/middleware.ts
```

---

## File Map

```
demo-repo/
  auth/
    middleware.ts     — the shared file all branches touch
  setup.md            — this file
  demo-patch.diff     — live edit patch for the demo
```
