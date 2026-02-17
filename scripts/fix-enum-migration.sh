#!/bin/bash

# Quick fix script for enum migration error on live server
# Run this on your Ubuntu server

echo "========================================="
echo "REKI App - Enum Migration Fix"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database connection details (adjust as needed)
DB_NAME="reki_db"
DB_USER="postgres"

echo -e "${YELLOW}Step 1: Checking current enum values...${NC}"
sudo -u postgres psql -d $DB_NAME -c "SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'venue_category_enum') ORDER BY enumlabel;"

echo ""
echo -e "${YELLOW}Step 2: Adding CASINO enum value if not exists...${NC}"
sudo -u postgres psql -d $DB_NAME -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CASINO' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'venue_category_enum')) THEN ALTER TYPE venue_category_enum ADD VALUE 'CASINO'; RAISE NOTICE 'CASINO enum value added'; ELSE RAISE NOTICE 'CASINO enum value already exists'; END IF; END \$\$;"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Enum value added successfully${NC}"
else
    echo -e "${RED}✗ Failed to add enum value${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 3: Checking if migration entry needs cleanup...${NC}"
MIGRATION_EXISTS=$(sudo -u postgres psql -t -d $DB_NAME -c "SELECT COUNT(*) FROM migrations WHERE name = 'AddImageBasedVenues1771200100000';")

if [ "$MIGRATION_EXISTS" -gt 0 ]; then
    echo -e "${YELLOW}Found incomplete migration entry, removing it...${NC}"
    sudo -u postgres psql -d $DB_NAME -c "DELETE FROM migrations WHERE name = 'AddImageBasedVenues1771200100000';"
    echo -e "${GREEN}✓ Migration entry cleaned up${NC}"
else
    echo -e "${GREEN}✓ No cleanup needed${NC}"
fi

echo ""
echo -e "${YELLOW}Step 4: Verifying enum values...${NC}"
sudo -u postgres psql -d $DB_NAME -c "SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'venue_category_enum') ORDER BY enumlabel;"

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Fix completed! Now run:${NC}"
echo -e "${GREEN}  npm run migration:run${NC}"
echo -e "${GREEN}=========================================${NC}"
