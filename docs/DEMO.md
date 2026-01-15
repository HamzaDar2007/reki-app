# Demo Control Layer - Investor Scenarios

## Overview
The Demo Control Layer provides "God Mode" buttons for instant venue state simulation during investor presentations.

## Demo Endpoints

### POST /demo/friday-evening
**Purpose**: Simulate peak Friday night activity
**Effect**: Sets ALL venues to BUSY + PARTY vibe
**Use Case**: Show how the app looks during peak hours

```bash
curl -X POST http://localhost:3000/demo/friday-evening
```

### POST /demo/quiet-monday  
**Purpose**: Simulate quiet Monday morning
**Effect**: Sets ALL venues to QUIET + CHILL vibe
**Use Case**: Demonstrate offer availability during quiet periods

```bash
curl -X POST http://localhost:3000/demo/quiet-monday
```

### POST /demo/mixed-busyness
**Purpose**: Create realistic variety across venues
**Effect**: Distributes venues across QUIET/MODERATE/BUSY states
**Use Case**: Show natural variation in venue activity

```bash
curl -X POST http://localhost:3000/demo/mixed-busyness
```

### POST /demo/reset
**Purpose**: Reset all venues to default state
**Effect**: Returns all venues to QUIET + CHILL
**Use Case**: Clean slate for new demo scenarios

```bash
curl -X POST http://localhost:3000/demo/reset
```

## Investor Demo Flow

### Scenario 1: Peak Hours Impact
1. `POST /demo/friday-evening` - Set peak activity
2. `GET /venues` - Show all venues are busy
3. `GET /venues/{id}/offers` - Demonstrate limited offers during busy times

### Scenario 2: Quiet Period Opportunities  
1. `POST /demo/quiet-monday` - Set quiet period
2. `GET /venues/{id}/offers` - Show increased offer availability
3. Highlight business value proposition

### Scenario 3: Real-World Variety
1. `POST /demo/mixed-busyness` - Create realistic distribution
2. `GET /venues` - Show natural venue variation
3. Demonstrate user discovery experience

### Scenario 4: Dynamic Changes
1. `POST /demo/quiet-monday` - Start quiet
2. `GET /venues/{id}/offers` - Note available offers
3. `POST /demo/friday-evening` - Switch to busy
4. `GET /venues/{id}/offers` - Show offer changes
5. Highlight real-time responsiveness

## Technical Implementation
- Updates `venue_live_state` table directly
- Bypasses normal business logic for instant results
- Maintains data consistency
- Provides immediate visual feedback

## Integration
- Available in Swagger UI: `/api`
- Included in Postman collection
- Tagged as 'demo' in API documentation