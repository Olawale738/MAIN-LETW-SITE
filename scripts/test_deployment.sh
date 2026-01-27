#!/bin/bash
# Test your deployment after going live
# Usage: ./scripts/test_deployment.sh https://your-backend.onrender.com https://your-frontend.vercel.app

BACKEND_URL=$1
FRONTEND_URL=$2

if [ -z "$BACKEND_URL" ] || [ -z "$FRONTEND_URL" ]; then
    echo "Usage: ./scripts/test_deployment.sh <backend-url> <frontend-url>"
    echo "Example: ./scripts/test_deployment.sh https://letw-backend.onrender.com https://letw.vercel.app"
    exit 1
fi

echo "🧪 Testing Deployment..."
echo "========================"
echo ""

# Test Backend Health
echo "1️⃣  Testing Backend Health..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "   ✅ Backend health check passed"
else
    echo "   ❌ Backend health check failed (HTTP $HEALTH_RESPONSE)"
fi
echo ""

# Test Backend Root
echo "2️⃣  Testing Backend API Root..."
ROOT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/")
if [ "$ROOT_RESPONSE" = "200" ]; then
    echo "   ✅ Backend API root accessible"
else
    echo "   ❌ Backend API root failed (HTTP $ROOT_RESPONSE)"
fi
echo ""

# Test Frontend
echo "3️⃣  Testing Frontend..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo "   ✅ Frontend accessible"
else
    echo "   ❌ Frontend failed (HTTP $FRONTEND_RESPONSE)"
fi
echo ""

# Test CORS (simplified)
echo "4️⃣  Testing CORS Configuration..."
CORS_RESPONSE=$(curl -s -H "Origin: $FRONTEND_URL" -H "Access-Control-Request-Method: GET" -X OPTIONS "$BACKEND_URL/api/auth/me" -o /dev/null -w "%{http_code}")
if [ "$CORS_RESPONSE" = "200" ] || [ "$CORS_RESPONSE" = "204" ]; then
    echo "   ✅ CORS appears to be configured"
else
    echo "   ⚠️  CORS check returned HTTP $CORS_RESPONSE (may need verification)"
fi
echo ""

echo "========================"
echo "✅ Deployment test complete!"
echo ""
echo "Next steps:"
echo "1. Visit $FRONTEND_URL in your browser"
echo "2. Try registering a new account"
echo "3. Check browser DevTools → Network tab for API calls"
echo "4. Verify no CORS errors in Console"

