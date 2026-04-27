#!/bin/bash
# fix-frontend.sh - Run this script to enable team access

echo "========================================="
echo "Fixing Frontend for Team Access"
echo "========================================="

# Get your local IP address
MY_IP=$(ipconfig getifaddr en0 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo "Detected IP: $MY_IP"
echo "Teammates will access at: http://$MY_IP:5173"
echo ""

# Create/update frontend .env file
echo "Creating frontend .env file..."
cat > /Users/sjwork/Desktop/officers\ roster/Officers-Roster/frontend/.env << EOF
VITE_API_URL=http://$MY_IP:8000/api
EOF

# Create config.js for API base
echo "Creating config.js..."
cat > /Users/sjwork/Desktop/officers\ roster/Officers-Roster/frontend/src/config.js << 'EOF'
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
EOF

echo "Fixing component files - removing hardcoded API_BASE lines..."

cd /Users/sjwork/Desktop/officers\ roster/Officers-Roster/frontend/src

# Remove hardcoded API_BASE lines from all JSX files
find . -name "*.jsx" -exec sed -i '' '/const API_BASE = .http.:.8000.api./d' {} \;

# Add import to files that don't have it and contain API_BASE usage
for file in pages/*.jsx pages/admin/*.jsx components/*.jsx; do
  if [ -f "$file" ]; then
    if grep -q "API_BASE" "$file" && ! grep -q "import { API_BASE }" "$file"; then
      # Determine correct relative path for import
      if [[ "$file" == pages/admin/* ]]; then
        echo "import { API_BASE } from '../../config';" > temp.txt
        cat "$file" >> temp.txt
        mv temp.txt "$file"
      elif [[ "$file" == pages/* ]]; then
        echo "import { API_BASE } from '../config';" > temp.txt
        cat "$file" >> temp.txt
        mv temp.txt "$file"
      elif [[ "$file" == components/* ]]; then
        echo "import { API_BASE } from '../config';" > temp.txt
        cat "$file" >> temp.txt
        mv temp.txt "$file"
      fi
      echo "  Fixed: $file"
    fi
  fi
done

# Special fix for Login.jsx - replace hardcoded URLs
if [ -f "pages/Login.jsx" ]; then
  sed -i '' "s|http://localhost:8000/api/token/|\${API_BASE}/token/|g" pages/Login.jsx
  sed -i '' "s|http://localhost:8000/api/users/me/|\${API_BASE}/users/me/|g" pages/Login.jsx
  echo "  Fixed: pages/Login.jsx"
fi

echo ""
echo "========================================="
echo "✅ Frontend fixes complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. cd frontend"
echo "2. rm -rf node_modules/.vite"
echo "3. npm run dev -- --host 0.0.0.0"
echo ""
echo "Teammates can now access at: http://$MY_IP:5173"
echo "========================================="