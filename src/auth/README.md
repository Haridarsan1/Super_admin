# Authentication Module

This directory contains a well-organized authentication system with clear separation of concerns.

## Structure

```
src/auth/
├── components/          # UI components for authentication
│   ├── LoginForm.tsx
│   ├── SignUpForm.tsx
│   ├── ResetPasswordForm.tsx
│   ├── NewPasswordForm.tsx
│   └── index.ts
├── hooks/              # Custom React hooks for authentication
│   ├── useSignIn.ts
│   ├── useSignUp.ts
│   ├── useResetPassword.ts
│   ├── useSignOut.ts
│   └── index.ts
├── services/           # Business logic and API calls
│   ├── authService.ts
│   ├── signInService.ts
│   ├── signUpService.ts
│   ├── resetPasswordService.ts
│   ├── signOutService.ts
│   └── index.ts
├── types.ts            # TypeScript interfaces and types
├── index.ts            # Main export file
└── README.md           # This file
```

## Key Features

### 1. **Separation of Concerns**
- **Components**: Pure UI components with minimal logic
- **Hooks**: React state management and side effects
- **Services**: Business logic and API interactions
- **Types**: TypeScript definitions for type safety

### 2. **Clean Architecture**
- Each authentication action has its own service and hook
- Reusable components that can be easily customized
- Centralized type definitions
- Consistent error handling

### 3. **Easy to Use**
```typescript
// Import what you need
import { useSignIn, LoginForm } from '../auth';

// Use in your component
const { signIn, loading, error } = useSignIn();
```

## Components

### LoginForm
- Email and password input
- Google OAuth integration
- Form validation and error handling
- Switch to signup/reset password

### SignUpForm
- Full name, email, and password input
- Google OAuth integration
- Form validation and error handling
- Switch to login/reset password

### ResetPasswordForm
- Email input for password reset
- Success/error state handling
- Back to login navigation

### NewPasswordForm
- New password and confirmation input
- Token verification on mount
- Password strength validation
- Automatic redirect after success

## Hooks

### useSignIn
```typescript
const { signIn, signInWithGoogle, loading, error, clearError } = useSignIn();
```

### useSignUp
```typescript
const { signUp, signUpWithGoogle, loading, error, clearError } = useSignUp();
```

### useResetPassword
```typescript
const { resetPassword, updatePassword, verifyResetToken, loading, error, clearError } = useResetPassword();
```

### useSignOut
```typescript
const { signOut, loading, error, clearError } = useSignOut();
```

## Services

### AuthService
- `fetchProfile(userId)`: Get user profile from database
- `logActivity(userId, type, description)`: Log user activities
- `getBaseUrl()`: Get base URL for redirects

### SignInService
- `signIn(email, password)`: Authenticate user with email/password
- `signInWithGoogle()`: Authenticate with Google OAuth

### SignUpService
- `signUp(email, password, fullName)`: Create new user account
- `signUpWithGoogle()`: Sign up with Google OAuth

### ResetPasswordService
- `resetPassword(email)`: Send password reset email
- `updatePassword(newPassword)`: Update user password
- `verifyResetToken()`: Verify password reset token

### Supabase redirect & troubleshooting

- Supabase will only redirect to URLs that are registered in the Dashboard → Auth → Settings → Redirect URLs. Make sure you add both your production Vercel URL (for example `https://your-app.vercel.app/reset-password`) and your local dev origin (for example `http://localhost:5731/reset-password`).
- The reset flow uses an exact match for the `redirectTo` URL. If your app runs on a custom port during local dev (the project uses port 5731 by default), add that exact origin to the Redirect URLs list.
- If users see “Invalid reset link” or no session is recovered, check:
  - That the `redirectTo` used in `resetPassword` is exactly one of the allowed redirect URLs.
  - The link hasn't expired (Supabase default expiry may apply).
  - That your app removes tokens from the URL after successful session set (this project does so in the service).

Local testing notes:
- For local dev use the same origin as your running Vite server. If you change the port, update the Vite `server.port` or register the new localhost origin in Supabase.
- In production (Vercel) ensure the `VERCEL_URL` (or `VITE_VERCEL_URL`/`VITE_SITE_URL`) env var is set so some server-side fallbacks produce the correct domain.

### SignOutService
- `signOut(userEmail?)`: Sign out user and log activity

## Types

All TypeScript interfaces are defined in `types.ts`:
- `AuthContextType`: Main context interface
- `LoginFormData`, `SignUpFormData`, etc.: Form data types
- `AuthError`, `AuthResponse`: API response types

## Usage Examples

### Using in a Component
```typescript
import { useSignIn } from '../auth';

function MyComponent() {
  const { signIn, loading, error } = useSignIn();
  
  const handleLogin = async (formData) => {
    const result = await signIn(formData);
    if (result.success) {
      // Handle success
    }
  };
  
  return (
    <div>
      {error && <div>{error.message}</div>}
      <button onClick={handleLogin} disabled={loading}>
        {loading ? 'Signing In...' : 'Sign In'}
      </button>
    </div>
  );
}
```

### Using Form Components
```typescript
import { LoginForm } from '../auth';

function AuthPage() {
  return (
    <div>
      <LoginForm
        onSwitchToSignUp={() => setView('signup')}
        onSwitchToResetPassword={() => setView('reset')}
      />
    </div>
  );
}
```

## Benefits

1. **Maintainability**: Each file has a single responsibility
2. **Reusability**: Components and hooks can be used anywhere
3. **Testability**: Services and hooks can be easily unit tested
4. **Type Safety**: Full TypeScript support with proper interfaces
5. **Consistency**: Standardized error handling and loading states
6. **Scalability**: Easy to add new authentication methods or features
