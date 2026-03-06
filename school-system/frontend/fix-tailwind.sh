#!/bin/bash
# Run this from inside the school-system/frontend directory
echo "Fixing Tailwind CSS version..."
rm -rf node_modules package-lock.json
npm install
echo ""
echo "✅ Done! Now run: npm start"
