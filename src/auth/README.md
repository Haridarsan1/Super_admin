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
