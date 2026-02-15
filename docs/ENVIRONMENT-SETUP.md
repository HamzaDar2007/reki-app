# REKI Environment Setup Guide

## Prerequisites

Before setting up the REKI backend, ensure you have the following installed:

### Required Software

**1. Node.js**
- Version: 18.x or higher
- Download: https://nodejs.org/
- Verify installation:
  ```bash
  node --version  # Should show v18.x.x or higher
  npm --version   # Should show 9.x.x or higher
  ```

**2. PostgreSQL**
- Version: 14.x or higher
- Download: https://www.postgresql.org/download/
- Verify installation:
  ```bash
  psql --version  # Should show PostgreSQL 14.x or higher
  ```

**3. Git**
- Latest version
- Download: https://git-scm.com/

---

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd reki-app
```

### 2. Install Dependencies

```bash
npm install
```

If you encounter peer dependency issues:
```bash
npm install --legacy-peer-deps
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Environment Variables](#environment-variables) section below).

### 4. Setup Database

```bash
# Create database
psql -U postgres
CREATE DATABASE reki_db;
\q

# Run migrations
npm run migration:run
```

### 5. Start Development Server

```bash
npm run start:dev
```

The server will start at `http://localhost:3000`

API Documentation available at: `http://localhost:3000/api`

---

## Environment Variables

### Complete `.env` Configuration

```env
# ============================================
# DATABASE CONFIGURATION
# ============================================

# PostgreSQL connection details
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=reki_db

# ============================================
# TYPEORM CONFIGURATION
# ============================================

# Enable SQL query logging (useful for debugging)
TYPEORM_LOGGING=false

# ============================================
# JWT AUTHENTICATION
# ============================================

# Secret key for signing JWT tokens
# IMPORTANT: Change this in production!
JWT_SECRET=your_super_secret_jwt_key_change_in_production

# ============================================
# APPLICATION CONFIGURATION
# ============================================

# Server port
PORT=3000

# Environment mode
NODE_ENV=development

# ============================================
# NOTIFICATION SYSTEM
# ============================================

# Enable/disable notifications
NOTIFICATION_ENABLED=true

# Email configuration (using Gmail SMTP)
# For Gmail: Enable "App Passwords" in Google Account settings
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# ============================================
# DEMO CONFIGURATION
# ============================================

# Enable demo mode features
DEMO_MODE=true

# Default city for demo
DEMO_CITY=Manchester
```

### Variable Descriptions

#### Database Variables

**DB_HOST**
- Description: PostgreSQL server hostname
- Default: `localhost`
- Production: Use hosted database IP/hostname

**DB_PORT**
- Description: PostgreSQL server port
- Default: `5432`
- Note: Only change if using non-standard port

**DB_USERNAME**
- Description: PostgreSQL username
- Default: `postgres`
- Production: Use dedicated database user

**DB_PASSWORD**
- Description: PostgreSQL password
- Default: `postgres`
- Production: Use strong, unique password

**DB_DATABASE**
- Description: Database name
- Default: `reki_db`
- Note: Must match created database name

#### JWT Variables

**JWT_SECRET**
- Description: Secret key for JWT token signing
- Default: `your_super_secret_jwt_key_change_in_production`
- **CRITICAL**: Must be changed in production
- Recommendation: Use 32+ character random string
- Generate secure key:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

#### Application Variables

**PORT**
- Description: Server listening port
- Default: `3000`
- Note: Ensure port is available

**NODE_ENV**
- Description: Application environment
- Values: `development`, `production`, `test`
- Default: `development`
- Effects:
  - `development`: Detailed error messages, hot reload
  - `production`: Optimized performance, minimal logging

**TYPEORM_LOGGING**
- Description: Enable SQL query logging
- Values: `true`, `false`
- Default: `false`
- Note: Set to `true` for debugging database issues

#### Notification Variables

**NOTIFICATION_ENABLED**
- Description: Enable notification system
- Values: `true`, `false`
- Default: `true`
- Note: Disable if email not configured

**EMAIL_USER**
- Description: SMTP email address
- Format: `email@example.com`
- Note: Currently configured for Gmail

**EMAIL_PASS**
- Description: Email password or app-specific password
- Note: For Gmail, use App Password (not account password)
- Setup Gmail App Password:
  1. Go to Google Account settings
  2. Security → 2-Step Verification
  3. App passwords → Generate new
  4. Copy 16-character password

#### Demo Variables

**DEMO_MODE**
- Description: Enable demo features
- Values: `true`, `false`
- Default: `true`
- Features: Demo scenarios, test data

**DEMO_CITY**
- Description: Default demo city
- Default: `Manchester`
- Note: Matches seeded city data

---

## Environment-Specific Configurations

### Development Environment

```env
NODE_ENV=development
TYPEORM_LOGGING=true
DEMO_MODE=true
PORT=3000
JWT_SECRET=dev_secret_key_not_for_production
```

### Production Environment

```env
NODE_ENV=production
TYPEORM_LOGGING=false
DEMO_MODE=false
PORT=3000

# Use strong secrets
JWT_SECRET=<generate-strong-random-key>

# Use production database
DB_HOST=<production-db-host>
DB_PORT=5432
DB_USERNAME=<production-db-user>
DB_PASSWORD=<strong-password>
DB_DATABASE=reki_production

# Production email service
EMAIL_USER=<production-email>
EMAIL_PASS=<production-email-password>
```

### Testing Environment

```env
NODE_ENV=test
TYPEORM_LOGGING=false
DEMO_MODE=true
PORT=3001

# Separate test database
DB_DATABASE=reki_test

# Disable notifications during tests
NOTIFICATION_ENABLED=false
```

---

## NPM Scripts

The `package.json` includes several useful scripts:

### Development

```bash
# Start development server with hot reload
npm run start:dev

# Start with debugging enabled
npm run start:debug

# Build the application
npm run build

# Start production server (requires build first)
npm start
```

### Database

```bash
# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate new migration
npm run migration:generate -- src/database/migrations/MigrationName

# Seed database (runs all migrations)
npm run db:seed

# Reset database (revert + run migrations)
npm run db:reset
```

### Code Quality

```bash
# Format code with Prettier
npm run format

# Lint code with ESLint
npm run lint

# Run tests
npm test

# Run end-to-end tests
npm run test:e2e
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000  # Windows
lsof -ti:3000                  # macOS/Linux

# Kill the process
taskkill /PID <PID> /F         # Windows
kill -9 <PID>                  # macOS/Linux

# Or change PORT in .env
PORT=3001
```

#### 2. Database Connection Failed

**Error:** `Connection terminated unexpectedly`

**Solutions:**
- Verify PostgreSQL is running:
  ```bash
  # Windows
  services.msc  # Check PostgreSQL service
  
  # macOS
  brew services list
  
  # Linux
  sudo systemctl status postgresql
  ```

- Check database credentials in `.env`
- Verify database exists:
  ```bash
  psql -U postgres -c "\l" | grep reki_db
  ```

#### 3. Migration Errors

**Error:** `Migration failed`

**Solutions:**
- Check if database is empty:
  ```bash
  npm run migration:revert
  npm run migration:run
  ```

- Drop and recreate database:
  ```bash
  psql -U postgres
  DROP DATABASE reki_db;
  CREATE DATABASE reki_db;
  \q
  npm run migration:run
  ```

#### 4. JWT Authentication Fails

**Error:** `Unauthorized` or `Invalid token`

**Solutions:**
- Ensure `JWT_SECRET` in `.env` matches between server restarts
- Clear old tokens and re-authenticate
- Verify token format: `Bearer <token>`

#### 5. Email Notifications Not Sending

**Error:** `Invalid login` or email send fails

**Solutions:**
- For Gmail:
  1. Enable 2-factor authentication
  2. Generate App Password (not account password)
  3. Use 16-character app password in `EMAIL_PASS`
- Verify `NOTIFICATION_ENABLED=true`
- Check email credentials in `.env`

#### 6. Module Not Found Errors

**Error:** `Cannot find module '@nestjs/...'`

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

---

## Verification Checklist

After setup, verify everything works:

### 1. Server Health Check
```bash
curl http://localhost:3000
```
Expected: `{"status":"ok","message":"REKI MVP API is running"}`

### 2. Database Connection
```bash
curl http://localhost:3000/cities
```
Expected: List of cities including Manchester

### 3. Authentication
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```
Expected: User object with tokens

### 4. Swagger Documentation
Open browser: `http://localhost:3000/api`
Expected: Interactive API documentation

### 5. Run Test Scripts
```bash
# Test authentication
.\test-auth.ps1       # Windows
./test-auth.ps1       # macOS/Linux

# Test venues
.\test-venues.ps1

# Test discovery
.\test-discovery.ps1

# Test automation
.\test-automation.ps1

# Test analytics
.\test-analytics.ps1
```

---

## Development Workflow

### Recommended IDE Setup

**Visual Studio Code Extensions:**
- ESLint
- Prettier
- REST Client (for testing)
- PostgreSQL Explorer

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "Description of changes"

# Push changes
git push origin feature/your-feature
```

### Code Style

- Use Prettier for formatting: `npm run format`
- Fix linting issues: `npm run lint`
- Follow NestJS conventions
- Write descriptive commit messages

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to strong random key
- [ ] Set `NODE_ENV=production`
- [ ] Use production database credentials
- [ ] Configure production email service
- [ ] Disable `DEMO_MODE`
- [ ] Set up SSL/HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up monitoring and logging
- [ ] Enable rate limiting
- [ ] Configure backups
- [ ] Review security headers
- [ ] Test all endpoints in production environment

---

## Getting Help

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review test scripts for working examples
3. Check Swagger documentation at `/api`
4. Review server logs for detailed error messages
5. Contact the backend development team

---

## Additional Resources

- [API Integration Guide](./API-INTEGRATION-GUIDE.md)
- [Authentication Flow](./AUTHENTICATION-FLOW.md)
- [Database Setup](./DATABASE-SETUP.md)
- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
