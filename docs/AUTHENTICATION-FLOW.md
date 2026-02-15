# REKI Authentication Flow Documentation

## Overview

REKI uses JWT (JSON Web Token) based authentication with a dual-token system for security and user experience optimization.

---

## Authentication Architecture

### Dual-Token System

**Access Token:**
- **Purpose**: Authorize API requests
- **Lifetime**: 15 minutes
- **Storage**: Memory or secure storage
- **Usage**: Sent with every authenticated request

**Refresh Token:**
- **Purpose**: Obtain new access tokens
- **Lifetime**: 7 days
- **Storage**: Secure persistent storage (Keychain/Keystore)
- **Usage**: Only used for token refresh endpoint

### Why Dual Tokens?

1. **Security**: Short-lived access tokens minimize risk if compromised
2. **UX**: Long-lived refresh tokens prevent frequent re-login
3. **Revocation**: Can invalidate all sessions by clearing refresh token
4. **Scalability**: Access tokens can be validated without database calls

---

## Authentication Flows

### 1. Registration Flow

```
┌─────────┐                 ┌─────────┐                 ┌──────────┐
│   iOS   │                 │   API   │                 │ Database │
│   App   │                 │ Server  │                 │          │
└────┬────┘                 └────┬────┘                 └────┬─────┘
     │                           │                           │
     │  POST /auth/register      │                           │
     │  {email, password}        │                           │
     ├──────────────────────────►│                           │
     │                           │                           │
     │                           │  Hash password (bcrypt)   │
     │                           │  salt rounds: 10          │
     │                           │                           │
     │                           │  Create User              │
     │                           ├──────────────────────────►│
     │                           │                           │
     │                           │  Create UserPreferences   │
     │                           ├──────────────────────────►│
     │                           │                           │
     │                           │  Generate JWT tokens      │
     │                           │  - access_token (15m)     │
     │                           │  - refresh_token (7d)     │
     │                           │                           │
     │                           │  Store refresh token hash │
     │                           ├──────────────────────────►│
     │                           │                           │
     │  Response                 │                           │
     │  {user, access_token,     │                           │
     │   refresh_token}          │                           │
     │◄──────────────────────────┤                           │
     │                           │                           │
     │  Store tokens securely    │                           │
     │  (Keychain)               │                           │
     │                           │                           │
```

**iOS Implementation Example:**

```swift
struct RegisterRequest: Codable {
    let email: String
    let password: String
}

struct AuthResponse: Codable {
    let user: User
    let access_token: String
    let refresh_token: String
}

func register(email: String, password: String) async throws -> AuthResponse {
    let url = URL(string: "\(baseURL)/auth/register")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let body = RegisterRequest(email: email, password: password)
    request.httpBody = try JSONEncoder().encode(body)
    
    let (data, response) = try await URLSession.shared.data(for: request)
    
    guard let httpResponse = response as? HTTPURLResponse,
          httpResponse.statusCode == 201 else {
        throw AuthError.registrationFailed
    }
    
    let authResponse = try JSONDecoder().decode(AuthResponse.self, from: data)
    
    // Store tokens securely
    try KeychainService.save(authResponse.access_token, for: "access_token")
    try KeychainService.save(authResponse.refresh_token, for: "refresh_token")
    
    return authResponse
}
```

---

### 2. Login Flow

```
┌─────────┐                 ┌─────────┐                 ┌──────────┐
│   iOS   │                 │   API   │                 │ Database │
│   App   │                 │ Server  │                 │          │
└────┬────┘                 └────┬────┘                 └────┬─────┘
     │                           │                           │
     │  POST /auth/login         │                           │
     │  {email, password}        │                           │
     ├──────────────────────────►│                           │
     │                           │                           │
     │                           │  Find user by email       │
     │                           ├──────────────────────────►│
     │                           │◄──────────────────────────┤
     │                           │                           │
     │                           │  Verify password          │
     │                           │  (bcrypt.compare)         │
     │                           │                           │
     │                           │  Generate new JWT tokens  │
     │                           │                           │
     │                           │  Update refresh token     │
     │                           ├──────────────────────────►│
     │                           │                           │
     │  Response                 │                           │
     │  {access_token,           │                           │
     │   refresh_token}          │                           │
     │◄──────────────────────────┤                           │
     │                           │                           │
     │  Store tokens securely    │                           │
     │                           │                           │
```

**iOS Implementation:**

```swift
struct LoginRequest: Codable {
    let email: String
    let password: String
}

struct TokenResponse: Codable {
    let access_token: String
    let refresh_token: String
}

func login(email: String, password: String) async throws -> TokenResponse {
    let url = URL(string: "\(baseURL)/auth/login")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let body = LoginRequest(email: email, password: password)
    request.httpBody = try JSONEncoder().encode(body)
    
    let (data, response) = try await URLSession.shared.data(for: request)
    
    guard let httpResponse = response as? HTTPURLResponse,
          httpResponse.statusCode == 200 else {
        throw AuthError.loginFailed
    }
    
    let tokenResponse = try JSONDecoder().decode(TokenResponse.self, from: data)
    
    // Store tokens
    try KeychainService.save(tokenResponse.access_token, for: "access_token")
    try KeychainService.save(tokenResponse.refresh_token, for: "refresh_token")
    
    return tokenResponse
}
```

---

### 3. Token Refresh Flow

```
┌─────────┐                 ┌─────────┐                 ┌──────────┐
│   iOS   │                 │   API   │                 │ Database │
│   App   │                 │ Server  │                 │          │
└────┬────┘                 └────┬────┘                 └────┬─────┘
     │                           │                           │
     │  Access token expired     │                           │
     │  (401 response)           │                           │
     │                           │                           │
     │  POST /auth/refresh       │                           │
     │  {refreshToken}           │                           │
     ├──────────────────────────►│                           │
     │                           │                           │
     │                           │  Verify JWT signature     │
     │                           │                           │
     │                           │  Find user by token sub   │
     │                           ├──────────────────────────►│
     │                           │◄──────────────────────────┤
     │                           │                           │
     │                           │  Verify refresh token     │
     │                           │  (bcrypt.compare)         │
     │                           │                           │
     │                           │  Generate new tokens      │
     │                           │                           │
     │                           │  Update refresh token     │
     │                           ├──────────────────────────►│
     │                           │                           │
     │  Response                 │                           │
     │  {access_token,           │                           │
     │   refresh_token}          │                           │
     │◄──────────────────────────┤                           │
     │                           │                           │
     │  Update stored tokens     │                           │
     │                           │                           │
     │  Retry original request   │                           │
     │  with new access token    │                           │
     ├──────────────────────────►│                           │
     │                           │                           │
```

**iOS Implementation:**

```swift
func refreshAccessToken() async throws -> TokenResponse {
    guard let refreshToken = try? KeychainService.load("refresh_token") else {
        throw AuthError.noRefreshToken
    }
    
    let url = URL(string: "\(baseURL)/auth/refresh")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let body = ["refreshToken": refreshToken]
    request.httpBody = try JSONSerialization.data(withJSONObject: body)
    
    let (data, response) = try await URLSession.shared.data(for: request)
    
    guard let httpResponse = response as? HTTPURLResponse,
          httpResponse.statusCode == 200 else {
        // Refresh token expired or invalid - require login
        try? KeychainService.delete("access_token")
        try? KeychainService.delete("refresh_token")
        throw AuthError.refreshFailed
    }
    
    let tokenResponse = try JSONDecoder().decode(TokenResponse.self, from: data)
    
    // Update stored tokens
    try KeychainService.save(tokenResponse.access_token, for: "access_token")
    try KeychainService.save(tokenResponse.refresh_token, for: "refresh_token")
    
    return tokenResponse
}
```

---

### 4. Authenticated Request Flow

```
┌─────────┐                 ┌─────────┐                 ┌──────────┐
│   iOS   │                 │   API   │                 │ Database │
│   App   │                 │ Server  │                 │          │
└────┬────┘                 └────┬────┘                 └────┬─────┘
     │                           │                           │
     │  GET /auth/me             │                           │
     │  Authorization: Bearer    │                           │
     │  {access_token}           │                           │
     ├──────────────────────────►│                           │
     │                           │                           │
     │                           │  Verify JWT signature     │
     │                           │  Extract payload          │
     │                           │  {sub: userId}            │
     │                           │                           │
     │                           │  Load user by ID          │
     │                           ├──────────────────────────►│
     │                           │◄──────────────────────────┤
     │                           │                           │
     │  Response                 │                           │
     │  {user: {...}}            │                           │
     │◄──────────────────────────┤                           │
     │                           │                           │
```

**iOS Implementation:**

```swift
func makeAuthenticatedRequest<T: Decodable>(
    endpoint: String,
    method: String = "GET",
    body: Encodable? = nil
) async throws -> T {
    guard let accessToken = try? KeychainService.load("access_token") else {
        throw AuthError.notAuthenticated
    }
    
    let url = URL(string: "\(baseURL)\(endpoint)")!
    var request = URLRequest(url: url)
    request.httpMethod = method
    request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    if let body = body {
        request.httpBody = try JSONEncoder().encode(body)
    }
    
    do {
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        // Handle 401 - token expired
        if httpResponse.statusCode == 401 {
            // Try to refresh token
            _ = try await refreshAccessToken()
            
            // Retry request with new token
            return try await makeAuthenticatedRequest(
                endpoint: endpoint,
                method: method,
                body: body
            )
        }
        
        guard httpResponse.statusCode == 200 else {
            throw NetworkError.httpError(httpResponse.statusCode)
        }
        
        return try JSONDecoder().decode(T.self, from: data)
        
    } catch {
        throw error
    }
}
```

---

### 5. Logout Flow

```
┌─────────┐                 ┌─────────┐                 ┌──────────┐
│   iOS   │                 │   API   │                 │ Database │
│   App   │                 │ Server  │                 │          │
└────┬────┘                 └────┬────┘                 └────┬─────┘
     │                           │                           │
     │  POST /auth/logout        │                           │
     │  Authorization: Bearer    │                           │
     │  {access_token}           │                           │
     ├──────────────────────────►│                           │
     │                           │                           │
     │                           │  Extract user from token  │
     │                           │                           │
     │                           │  Clear refresh token      │
     │                           │  (set to NULL)            │
     │                           ├──────────────────────────►│
     │                           │                           │
     │  Response                 │                           │
     │  {message: "success"}     │                           │
     │◄──────────────────────────┤                           │
     │                           │                           │
     │  Clear local tokens       │                           │
     │  Clear user data          │                           │
     │  Navigate to login        │                           │
     │                           │                           │
```

**iOS Implementation:**

```swift
func logout() async throws {
    // Call logout endpoint (optional but recommended)
    do {
        let url = URL(string: "\(baseURL)/auth/logout")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        
        if let accessToken = try? KeychainService.load("access_token") {
            request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        }
        
        _ = try await URLSession.shared.data(for: request)
    } catch {
        // Continue with local cleanup even if server call fails
        print("Logout API call failed: \(error)")
    }
    
    // Clear all local auth data
    try? KeychainService.delete("access_token")
    try? KeychainService.delete("refresh_token")
    
    // Clear user defaults
    UserDefaults.standard.removeObject(forKey: "current_user")
    
    // Clear cached data
    clearCache()
    
    // Navigate to login screen
    navigateToLogin()
}
```

---

### 6. Password Reset Flow

```
┌─────────┐                 ┌─────────┐                 ┌──────────┐
│   iOS   │                 │   API   │                 │ Database │
│   App   │                 │ Server  │                 │          │
└────┬────┘                 └────┬────┘                 └────┬─────┘
     │                           │                           │
     │  POST /auth/forgot-password                           │
     │  {email}                  │                           │
     ├──────────────────────────►│                           │
     │                           │                           │
     │                           │  Find user by email       │
     │                           ├──────────────────────────►│
     │                           │◄──────────────────────────┤
     │                           │                           │
     │                           │  Generate reset token     │
     │                           │  (32 bytes, hex)          │
     │                           │  Hash token (bcrypt)      │
     │                           │  Set expiry (1 hour)      │
     │                           │                           │
     │                           │  Save token & expiry      │
     │                           ├──────────────────────────►│
     │                           │                           │
     │                           │  Send email (in prod)     │
     │                           │  Log token (dev mode)     │
     │                           │                           │
     │  Response                 │                           │
     │  {message}                │                           │
     │◄──────────────────────────┤                           │
     │                           │                           │
     │  User receives email      │                           │
     │  with reset link          │                           │
     │                           │                           │
     │  POST /auth/reset-password                            │
     │  {token, newPassword}     │                           │
     ├──────────────────────────►│                           │
     │                           │                           │
     │                           │  Find user with valid     │
     │                           │  non-expired token        │
     │                           ├──────────────────────────►│
     │                           │◄──────────────────────────┤
     │                           │                           │
     │                           │  Hash new password        │
     │                           │  Clear reset token        │
     │                           │  Clear refresh token      │
     │                           │  (invalidate sessions)    │
     │                           │                           │
     │                           │  Update user              │
     │                           ├──────────────────────────►│
     │                           │                           │
     │  Response                 │                           │
     │  {message: "success"}     │                           │
     │◄──────────────────────────┤                           │
     │                           │                           │
     │  Navigate to login        │                           │
     │                           │                           │
```

---

## JWT Token Structure

### Access Token Payload

```json
{
  "email": "user@example.com",
  "sub": "7bdebd26-6626-4716-86d0-cce370e37b74",
  "iat": 1771155325,
  "exp": 1771156225
}
```

**Fields:**
- `email`: User's email address
- `sub`: User ID (UUID) - "subject" of the token
- `iat`: Issued at timestamp (Unix epoch)
- `exp`: Expiration timestamp (Unix epoch)

### Token Validation

The server validates tokens by:
1. Verifying JWT signature using `JWT_SECRET`
2. Checking expiration time
3. Loading user from database using `sub` field
4. Ensuring user is still active

---

## Security Best Practices

### Token Storage (iOS)

**DO:**
- ✅ Store tokens in iOS Keychain
- ✅ Use `.whenUnlockedThisDeviceOnly` accessibility
- ✅ Enable data protection
- ✅ Clear tokens on logout
- ✅ Clear tokens on account deletion

**DON'T:**
- ❌ Store in UserDefaults
- ❌ Store in plain text files
- ❌ Log tokens to console
- ❌ Send tokens via analytics
- ❌ Store in iCloud

### Network Security

**DO:**
- ✅ Use HTTPS in production
- ✅ Implement certificate pinning
- ✅ Validate SSL certificates
- ✅ Use App Transport Security

**DON'T:**
- ❌ Allow plaintext HTTP in production
- ❌ Disable SSL validation
- ❌ Trust self-signed certificates

### Password Requirements

Current backend validation:
- Minimum 6 characters
- No maximum length
- No complexity requirements (for MVP)

**Recommended for Production:**
- Minimum 8 characters
- Mix of uppercase, lowercase, numbers
- Special characters
- Check against leaked password databases

---

## Error Handling

### Common Authentication Errors

```swift
enum AuthError: Error {
    case invalidCredentials      // 401 - wrong email/password
    case emailAlreadyExists      // 409 - duplicate registration
    case tokenExpired            // 401 - access token expired
    case refreshFailed           // 401 - refresh token invalid
    case notAuthenticated        // No token stored
    case networkError            // Connection issues
    case serverError             // 500 errors
}
```

### Error Response Examples

**Invalid Credentials:**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "timestamp": "2026-02-15T10:00:00.000Z"
}
```

**Email Already Exists:**
```json
{
  "statusCode": 409,
  "message": "Email already exists",
  "timestamp": "2026-02-15T10:00:00.000Z"
}
```

**Unauthorized (Token Invalid/Expired):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "timestamp": "2026-02-15T10:00:00.000Z"
}
```

---

## Testing Authentication

### Manual Testing with cURL

**Register:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Get Current User:**
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Refresh Token:**
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

---

## Authentication State Management (iOS)

### Recommended Architecture

```swift
class AuthenticationManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    
    private var accessToken: String?
    private var refreshToken: String?
    
    init() {
        loadStoredTokens()
    }
    
    func loadStoredTokens() {
        accessToken = try? KeychainService.load("access_token")
        refreshToken = try? KeychainService.load("refresh_token")
        isAuthenticated = accessToken != nil
        
        if isAuthenticated {
            Task {
                try await loadCurrentUser()
            }
        }
    }
    
    func register(email: String, password: String) async throws {
        let response = try await register(email: email, password: password)
        accessToken = response.access_token
        refreshToken = response.refresh_token
        currentUser = response.user
        isAuthenticated = true
    }
    
    func login(email: String, password: String) async throws {
        let response = try await login(email: email, password: password)
        accessToken = response.access_token
        refreshToken = response.refresh_token
        isAuthenticated = true
        
        try await loadCurrentUser()
    }
    
    func logout() async {
        try? await logout()
        accessToken = nil
        refreshToken = nil
        currentUser = nil
        isAuthenticated = false
    }
    
    private func loadCurrentUser() async throws {
        currentUser = try await makeAuthenticatedRequest(
            endpoint: "/auth/me",
            method: "GET"
        )
    }
}
```

---

## Summary

The REKI authentication system provides:
- ✅ Secure JWT-based authentication
- ✅ Automatic token refresh
- ✅ Password reset flow
- ✅ Session management
- ✅ Simple iOS integration

For questions or issues, refer to the test scripts:
- `test-auth.ps1` - Full authentication testing
- `test-users.ps1` - User managementAPIcalls
