#!/bin/bash

echo "🚀 refract — Starting up..."
echo ""
echo "Step 1: Check environment..."

if [ -z "$ANTHROPIC_API_KEY" ] && ! grep -q "^ANTHROPIC_API_KEY=" .env 2>/dev/null; then
  echo "⚠️  ANTHROPIC_API_KEY not set in .env"
  echo "   Get your key at: https://console.anthropic.com"
  echo "   Add it to .env: ANTHROPIC_API_KEY=sk-ant-..."
  exit 1
fi

echo "✓ Environment configured"
echo ""
echo "Step 2: Starting servers..."
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
npm run dev
