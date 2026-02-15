# REKI Database Setup & Migrations Guide

## Table of Contents
- [Database Architecture](#database-architecture)
- [Initial Setup](#initial-setup)
- [Database Schema](#database-schema)
- [Migrations](#migrations)
- [Seeded Data](#seeded-data)
- [Backup & Restore](#backup--restore)

---

## Database Architecture

### Technology Stack

- **Database**: PostgreSQL 14+
- **ORM**: TypeORM 0.3.x
- **Migration System**: TypeORM Migrations
- **Connection Pooling**: Built-in TypeORM

### Database Structure

```
reki_db
├── cities (1 record - Manchester)
├── venues (22 demo venues)
├── venue_live_state (real-time busyness/vibe)
├── venue_vibe_schedules (time-based vibe rules)
├── offers (demo offers with analytics)
├── offer_redemptions (redemption history)
├── users (user accounts)
├── user_preferences (filtering preferences)
├── notifications (user notifications)
└── migrations (migration tracking)
```

---

## Initial Setup

### 1. Install PostgreSQL

**Windows:**
```bash
# Download from https://www.postgresql.org/download/windows/
# Or use Chocolatey
choco install postgresql
```

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

#### Using psql Command Line

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE reki_db;

# Verify creation
\l

# Exit
\q
```

#### Using pgAdmin (GUI)

1. Open pgAdmin
2. Connect to PostgreSQL server
3. Right-click "Databases" → Create → Database
4. Name: `reki_db`
5. Click "Save"

### 3. Configure Connection

Ensure `.env` file has correct database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=reki_db
```

### 4. Run Migrations

```bash
# Run all migrations (creates all tables + seeds data)
npm run migration:run
```

Expected output:
```
query: SELECT * FROM "migrations" "migrations" ORDER BY "id" DESC
query: START TRANSACTION
query: CREATE TABLE IF NOT EXISTS cities...
...
Migration CreateRekiWeek1Week2Tables1700000000001 has been executed successfully.
Migration SeedManchesterDemoData1700000000002 has been executed successfully.
Migration ExpandedManchesterSeedData1700000000003 has been executed successfully.
Migration AddVenueOwner1768412173209 has been executed successfully.
Migration AddNotificationsTable1768457114642 has been executed successfully.
Migration AddAuthTokenFields1771142000000 has been executed successfully.
Migration AddNotificationPreferences1771146400000 has been executed successfully.
query: COMMIT
```

---

## Database Schema

### Core Entities

#### 1. Cities

**Purpose**: Store city information (currently Manchester only)

**Table**: `cities`

```sql
CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    country VARCHAR NOT NULL,
    timezone VARCHAR NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Fields**:
- `id`: `3ff5e526-7819-45d5-9995-bd6db919c9b2` (Manchester)
- `name`: "Manchester"
- `timezone`: "Europe/London"

#### 2. Venues

**Purpose**: Store venue information

**Table**: `venues`

```sql
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id),
    owner_id UUID REFERENCES users(id),
    name VARCHAR NOT NULL,
    category VARCHAR NOT NULL,  -- BAR, CLUB, RESTAURANT
    address VARCHAR,
    postcode VARCHAR,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    cover_image_url VARCHAR,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `idx_venues_city_id` on `city_id`
- `idx_venues_owner_id` on `owner_id`
- `idx_venues_name` on `name`

#### 3. Venue Live State

**Purpose**: Store real-time busyness and vibe

**Table**: `venue_live_state`

```sql
CREATE TABLE venue_live_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID UNIQUE REFERENCES venues(id),
    busyness VARCHAR,  -- QUIET, MODERATE, BUSY
    vibe VARCHAR,      -- CHILL, PARTY, LIVE_MUSIC, SPORTS
    busyness_updated_at TIMESTAMPTZ,
    vibe_updated_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Features**:
- One-to-one with venues
- Updated by automation cron jobs
- Tracks last update timestamps

#### 4. Venue Vibe Schedules

**Purpose**: Time-based vibe rules for automation

**Table**: `venue_vibe_schedule`

```sql
CREATE TABLE venue_vibe_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID REFERENCES venues(id),
    day_of_week INTEGER,  -- 0=Sunday, 6=Saturday
    start_time TIME,
    end_time TIME,
    vibe VARCHAR,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- Composite index on `(venue_id, day_of_week)`
- Index on `is_active`

**Example**:
- Friday 22:00-02:00: PARTY vibe (handles overnight)
- Monday 12:00-14:00: CHILL vibe (lunch)

#### 5. Offers

**Purpose**: Store venue offers with analytics

**Table**: `offers`

```sql
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID REFERENCES venues(id),
    title VARCHAR NOT NULL,
    description TEXT,
    offer_type VARCHAR,  -- DISCOUNT, FREE_ITEM, HAPPY_HOUR
    min_busyness VARCHAR,  -- Minimum busyness to show offer
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    redeem_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `idx_offers_venue_id` on `venue_id`
- `idx_offers_is_active` on `is_active`
- Composite index on `(venue_id, is_active, starts_at, ends_at)`

**Analytics Fields**:
- `view_count`: Incremented when offer viewed
- `click_count`: Incremented when "View Offer" clicked
- `redeem_count`: Incremented when offer redeemed

#### 6. Offer Redemptions

**Purpose**: Track offer redemption history

**Table**: `offer_redemptions`

```sql
CREATE TABLE offer_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID REFERENCES offers(id),
    venue_id UUID REFERENCES venues(id),
    user_id UUID REFERENCES users(id),
    redeemed_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `idx_redemptions_offer_id` on `offer_id`
- `idx_redemptions_venue_id` on `venue_id`
- `idx_redemptions_user_id` on `user_id`

#### 7. Users

**Purpose**: User authentication and profiles

**Table**: `users`

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    refresh_token VARCHAR,
    password_reset_token VARCHAR,
    password_reset_expires TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Security**:
- Passwords hashed with bcrypt (salt rounds: 10)
- Refresh tokens hashed before storage
- Password reset tokens expire after 1 hour

#### 8. User Preferences

**Purpose**: User filtering and notification preferences

**Table**: `user_preferences`

```sql
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    preferred_categories TEXT[],
    min_busyness VARCHAR,
    preferred_vibes TEXT[],
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    offer_notifications BOOLEAN DEFAULT true,
    busyness_notifications BOOLEAN DEFAULT false
);
```

**Key Features**:
- One-to-one with users
- Auto-created on registration with defaults
- Arrays for multi-select preferences

#### 9. Notifications

**Purpose**: User notifications

**Table**: `notifications`

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type VARCHAR NOT NULL,  -- OFFER_AVAILABLE, BUSYNESS_CHANGE
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    data JSONB,  -- Additional data (offerId, venueId, etc.)
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `idx_notifications_user_id` on `user_id`
- Composite index on `(user_id, is_read)`

**Notification Types**:
- `OFFER_AVAILABLE`: New offer created
- `BUSYNESS_CHANGE`: Venue busyness changed

---

## Migrations

### Migration Files

Located in: `src/database/migrations/`

### Current Migrations

1. **1700000000001-CreateRekiWeek1Week2Tables.ts**
   - Creates core tables (cities, venues, offers, etc.)
   - Sets up indexes and foreign keys
   - Initial Week 1-2 schema

2. **1700000000002-SeedManchesterDemoData.ts**
   - Seeds Manchester city
   - Creates 10 demo venues
   - Creates demo offers with analytics data

3. **1700000000003-ExpandedManchesterSeedData.ts**
   - Adds 12 more venues
   - Creates vibe schedules
   - Expands demo scenario data

4. **1768412173209-AddVenueOwner.ts**
   - Adds `owner_id` to venues
   - Creates users and preferences tables
   - Migrates offer_redemptions columns

5. **1768457114642-AddNotificationsTable.ts**
   - Creates notifications table
   - Adds indexes for performance

6. **1771142000000-AddAuthTokenFields.ts**
   - Adds refresh_token, password_reset fields
   - Enhances authentication system

7. **1771146400000-AddNotificationPreferences.ts**
   - Adds notification preference fields
   - Sets default values

### Running Migrations

```bash
# Run all pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate new migration (after entity changes)
npm run migration:generate -- src/database/migrations/MigrationName
```

### Migration Best Practices

**DO:**
- ✅ Test migrations on development database first
- ✅ Back up database before running migrations
- ✅ Review generated migrations before running
- ✅ Use transactions for data migrations
- ✅ Handle NULL values carefully

**DON'T:**
- ❌ Edit migration files after they've run
- ❌ Delete migration files
- ❌ Skip migrations
- ❌ Run migrations directly in production (use deployment pipeline)

---

## Seeded Data

### Manchester Demo Data

#### City
- **ID**: `3ff5e526-7819-45d5-9995-bd6db919c9b2`
- **Name**: Manchester
- **Country**: United Kingdom
- **Timezone**: Europe/London

#### Venues (22 total)

**Notable Venues:**
1. **Albert's Schloss**
   - Address: 27 Peter Street
   - Category: BAR
   - Known for: Bavarian atmosphere

2. **Revolution Manchester**
   - Address: Parsonage Gardens
   - Category: BAR
   - Known for: Cocktails

3. **Gorilla Bar**
   - Address: 54-56 Whitworth Street West
   - Category: BAR
   - Known for: Live music

4. **The Warehouse Project (TEST)**
   - Category: CLUB
   - Known for: Electronic music

5. **Factory Manchester (TEST)**
   - Category: CLUB
   - Known for: Nightclub

#### Offers

Demo offers with realistic analytics:
- Various offer types: DISCOUNT, HAPPY_HOUR, FREE_ITEM
- Time-based availability
- Pre-populated analytics (views, clicks, redemptions)
- Conversion rates: 5-25%

#### Vibe Schedules

Realistic time-based vibes:
- **Weekday Lunch** (12:00-14:00): CHILL
- **Friday Evening** (18:00-23:00): PARTY
- **Saturday Night** (22:00-02:00): PARTY (overnight)
- **Sunday Afternoon** (14:00-18:00): SPORTS

### Accessing Seeded Data

```sql
-- Get Manchester city ID
SELECT id, name FROM cities WHERE name = 'Manchester';

-- Get all venues
SELECT id, name, category, address 
FROM venues 
WHERE city_id = '3ff5e526-7819-45d5-9995-bd6db919c9b2';

-- Get offers with analytics
SELECT 
    o.title,
    o.offer_type,
    o.view_count,
    o.click_count,
    o.redeem_count,
    v.name as venue_name
FROM offers o
JOIN venues v ON o.venue_id = v.id
WHERE o.is_active = true;

-- Get vibe schedules
SELECT 
    v.name,
    vs.day_of_week,
    vs.start_time,
    vs.end_time,
    vs.vibe
FROM venue_vibe_schedule vs
JOIN venues v ON vs.venue_id = v.id
ORDER BY v.name, vs.day_of_week, vs.start_time;
```

---

## Backup & Restore

### Creating Backups

#### Full Database Backup

```bash
# Create backup file
pg_dump -U postgres -d reki_db -F c -f reki_backup.dump

# Or plain SQL format
pg_dump -U postgres -d reki_db > reki_backup.sql
```

#### Schema Only

```bash
pg_dump -U postgres -d reki_db --schema-only > schema.sql
```

#### Data Only

```bash
pg_dump -U postgres -d reki_db --data-only > data.sql
```

### Restoring Backups

#### From Custom Format (.dump)

```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS reki_db;"
psql -U postgres -c "CREATE DATABASE reki_db;"

# Restore backup
pg_restore -U postgres -d reki_db reki_backup.dump
```

#### From SQL Format (.sql)

```bash
psql -U postgres -d reki_db < reki_backup.sql
```

### Automated Backup Script (Windows PowerShell)

```powershell
# backup-database.ps1
$timestamp = Get-Date -Format \"yyyy-MM-dd_HH-mm-ss\"
$backupFile = \"backups/reki_backup_$timestamp.dump\"

# Create backups directory if not exists
New-Item -ItemType Directory -Force -Path backups

# Create backup
& pg_dump -U postgres -d reki_db -F c -f $backupFile

Write-Host \"Backup created: $backupFile\"

# Keep only last 7 backups
Get-ChildItem backups/*.dump | Sort-Object CreationTime -Descending | Select-Object -Skip 7 | Remove-Item
```

### Production Backup Strategy

**Recommended:**
- Daily full backups
- Keep 7 daily backups
- Weekly backups for 4 weeks
- Monthly backups for 12 months
- Store backups off-site
- Test restore procedures regularly

---

## Database Maintenance

### Analyzing Performance

```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan;

-- Check slow queries (if logging enabled)
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### Vacuuming

```sql
-- Analyze tables (update statistics)
ANALYZE;

-- Vacuum (reclaim space)
VACUUM;

-- Full vacuum (requires table lock)
VACUUM FULL;
```

### Reindexing

```sql
-- Reindex specific table
REINDEX TABLE venues;

-- Reindex entire database
REINDEX DATABASE reki_db;
```

---

## Troubleshooting

### Common Database Issues

#### 1. Migration Fails

**Error**: `Migration XYZ failed`

**Solutions**:
```bash
# Check migration status
npm run migration:show

# Revert failed migration
npm run migration:revert

# Fix issue and re-run
npm run migration:run
```

#### 2. Connection Pool Exhausted

**Error**: `remaining connection slots are reserved`

**Solution**: Adjust connection pool in `app.module.ts`:
```typescript
TypeOrmModule.forRoot({
  // ... other config
  extra: {
    max: 20,  // Maximum connections
    min: 5,   // Minimum connections
  },
})
```

#### 3. Constraint Violation

**Error**: `duplicate key value violates unique constraint`

**Solution**: Check for existing data before insert
```sql
-- Find duplicates
SELECT email, COUNT(*) 
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1;
```

#### 4. Foreign Key Violation

**Error**: `violates foreign key constraint`

**Solution**: Ensure referenced records exist
```sql
-- Check if city exists before creating venue
SELECT id FROM cities WHERE id = 'uuid';
```

---

## Development vs Production

### Development Settings

```typescript
// app.module.ts - Development
TypeOrmModule.forRoot({
  synchronize: false,  // Always use migrations
  logging: true,       // Log all queries
  maxQueryExecutionTime: 1000,  // Warn if query > 1s
})
```

### Production Settings

```typescript
// app.module.ts - Production
TypeOrmModule.forRoot({
  synchronize: false,  // NEVER true in production
  logging: false,      // Disable query logging
  ssl: true,          // Enable SSL
  extra: {
    max: 50,          // More connections
    ssl: {
      rejectUnauthorized: false
    }
  }
})
```

---

## Additional Resources

- [TypeORM Migration Documentation](https://typeorm.io/migrations)
- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [PostgreSQL Performance Tips](https://www.postgresql.org/docs/current/performance-tips.html)

---

## Quick Reference

### Essential Commands

```bash
# Database
psql -U postgres -d reki_db              # Connect to database
\dt                                      # List tables
\d table_name                           # Describe table
\l                                      # List databases
\q                                      # Exit

# Migrations
npm run migration:run                   # Apply migrations
npm run migration:revert                # Undo last migration
npm run migration:generate -- Name      # Generate new migration

# Backup
pg_dump -U postgres -d reki_db > backup.sql
pg_restore -U postgres -d reki_db backup.dump
```

### Manchester City ID
```
3ff5e526-7819-45d5-9995-bd6db919c9b2
```

### Default Test Credentials
```
Email: test@example.com
Password: password123
```
