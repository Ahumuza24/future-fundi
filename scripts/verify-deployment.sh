#!/bin/bash
# Production Deployment Verification Script
# Run this before deploying to production

echo "🚀 Future Fundi - Production Deployment Verification"
echo "===================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# 1. Check environment variables
echo "📋 Checking Environment Variables..."
echo ""

# Frontend env check
if [ -f "frontend/.env.production" ]; then
    echo -e "${GREEN}✓${NC} frontend/.env.production exists"
    if grep -q "VITE_API_URL" frontend/.env.production; then
        echo -e "${GREEN}✓${NC} VITE_API_URL is set"
        API_URL=$(grep "VITE_API_URL" frontend/.env.production | cut -d '=' -f 2)
        echo "  → $API_URL"
    else
        echo -e "${RED}✗${NC} VITE_API_URL not found in .env.production"
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}⚠${NC} frontend/.env.production not found"
    echo "  Create it with: VITE_API_URL=https://your-backend.onrender.com/api"
    ((WARNINGS++))
fi

echo ""

# Backend env check
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓${NC} backend/.env exists"
    
    # Check critical backend env vars
    for var in DJANGO_SECRET_KEY DATABASE_URL CORS_ALLOWED_ORIGINS DJANGO_ALLOWED_HOSTS; do
        if grep -q "$var" backend/.env; then
            echo -e "${GREEN}✓${NC} $var is set"
        else
            echo -e "${RED}✗${NC} $var not found in backend/.env"
            ((ERRORS++))
        fi
    done
else
    echo -e "${YELLOW}⚠${NC} backend/.env not found (OK for production if using Render env vars)"
    ((WARNINGS++))
fi

echo ""
echo "===================================================="
echo "🔍 Checking Code Quality..."
echo ""

# 2. Check for merge conflicts
echo "Checking for merge conflicts..."
if git grep -l "<<<<<<" -- '*.py' '*.ts' '*.tsx' '*.js' '*.jsx' 2>/dev/null | grep -v node_modules; then
    echo -e "${RED}✗${NC} Merge conflicts found in code!"
    ((ERRORS++))
else
    echo -e "${GREEN}✓${NC} No merge conflicts"
fi

echo ""

# 3. Check for console.log in production code
echo "Checking for console.log statements..."
CONSOLE_LOGS=$(find frontend/src -name "*.tsx" -o -name "*.ts" | xargs grep -n "console\." 2>/dev/null | grep -v "console.error" | wc -l)
if [ "$CONSOLE_LOGS" -gt 10 ]; then
    echo -e "${YELLOW}⚠${NC} Found $CONSOLE_LOGS console.log statements (consider removing for production)"
    ((WARNINGS++))
else
    echo -e "${GREEN}✓${NC} Console logs are minimal ($CONSOLE_LOGS found)"
fi

echo ""

# 4. Check if dependencies are installed
echo "Checking dependencies..."
if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Frontend node_modules exists"
else
    echo -e "${RED}✗${NC} Frontend dependencies not installed. Run: cd frontend && pnpm install"
    ((ERRORS++))
fi

if [ -f "backend/requirements.txt" ]; then
    echo -e "${GREEN}✓${NC} Backend requirements.txt exists"
else
    echo -e "${RED}✗${NC} Backend requirements.txt not found"
    ((ERRORS++))
fi

echo ""
echo "===================================================="
echo "🧪 Running Tests..."
echo ""

# 5. Try to build frontend
echo "Testing frontend build..."
cd frontend
if pnpm build --mode production 2>&1 | grep -q "built in"; then
    echo -e "${GREEN}✓${NC} Frontend builds successfully"
else
    echo -e "${RED}✗${NC} Frontend build failed"
    ((ERRORS++))
fi
cd ..

echo ""

# 6. Check Django configuration
echo "Checking Django configuration..."
cd backend
if python manage.py check --deploy --settings=fundi.settings 2>&1 | grep -q "no issues"; then
    echo -e "${GREEN}✓${NC} Django deployment check passed"
else
    echo -e "${YELLOW}⚠${NC} Django deployment check has warnings (review them)"
    ((WARNINGS++))
fi
cd ..

echo ""
echo "===================================================="
echo "📊 Summary"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo "✅ Ready for production deployment"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
    echo "⚠️  Review warnings before deploying"
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s) and $WARNINGS warning(s) found${NC}"
    echo "❌ Fix errors before deploying to production"
    exit 1
fi
