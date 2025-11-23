# Authentication System

## Overview

DuoFi uses Firebase Authentication with support for:
- ✅ Email/Password sign-in
- ✅ Google OAuth sign-in
- ✅ Automatic user profile creation in Firestore

## Pages

### Landing Page (`/`)
- Marketing page with features overview
- "Sign in" and "Get started" CTAs
- Links to `/login` and `/signup`

### Sign Up (`/signup`)
- Email/password registration with name
- Google OAuth sign-up
- Password validation (min 6 characters)
- Auto-redirect to dashboard on success

### Login (`/login`)
- Email/password sign-in
- Google OAuth sign-in
- "Forgot password?" link (TODO)
- Auto-redirect to dashboard on success

### Dashboard (`/dashboard`)
- Protected route (requires authentication)
- User profile dropdown with sign-out
- Quick actions: Create Group, Add Expense, Join Group
- Empty state for groups list

## Architecture

### AuthContext (`lib/contexts/auth-context.tsx`)
Provides global authentication state:
```typescript
{
  user: User | null;          // Firebase user object
  userProfile: UserProfile | null;  // Firestore user profile
  loading: boolean;           // Auth state loading
}
```

### useAuth Hook
```typescript
const { user, userProfile, loading } = useAuth();
```

### Firebase Auth Functions (`lib/firebase/auth.ts`)

**Sign Up**
```typescript
await signUpWithEmail(email, password, displayName);
```

**Sign In**
```typescript
await signInWithEmail(email, password);
await signInWithGoogle();
```

**Sign Out**
```typescript
await signOut();
```

### Protected Routes

Wrap any page with `ProtectedRoute` to require authentication:

```tsx
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function MyPage() {
  return (
    <ProtectedRoute>
      <div>Protected content</div>
    </ProtectedRoute>
  );
}
```

## User Profile Schema

When a user signs up, a document is created in `users/{userId}`:

```typescript
{
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Next Steps

- [ ] Implement "Forgot Password" flow
- [ ] Add email verification
- [ ] Add profile editing
- [ ] Implement more OAuth providers (Apple, Facebook)
