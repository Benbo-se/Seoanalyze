#!/bin/bash

echo "🚀 NGINX DEPLOYMENT SCRIPT"
echo "=========================="

echo "1. Creating backup of current nginx config..."
sudo cp /etc/nginx/sites-available/seoanalyze.conf /etc/nginx/sites-available/seoanalyze.conf.backup

echo "2. Copying new dual-routing configuration..."
sudo cp /home/reda/seo-analyzer-nextjs/nginx-config-new.conf /etc/nginx/sites-available/seoanalyze.conf

echo "3. Testing nginx configuration..."
if sudo nginx -t; then
    echo "✅ Configuration test PASSED"
    
    echo "4. Reloading nginx with new configuration..."
    sudo systemctl reload nginx
    
    echo "🎉 DEPLOYMENT COMPLETE!"
    echo ""
    echo "✅ seoanalyze.se/ → Next.js 15 (port 5001)"
    echo "✅ seoanalyze.se/old/ → React backup (port 5000)"
    echo ""
    echo "Testing endpoints..."
    sleep 3
    echo "Next.js health: $(curl -s https://seoanalyze.se/health | jq -r '.status' 2>/dev/null || echo 'Testing...')"
    
else
    echo "❌ Configuration test FAILED"
    echo "Restoring backup..."
    sudo cp /etc/nginx/sites-available/seoanalyze.conf.backup /etc/nginx/sites-available/seoanalyze.conf
    echo "🛡️ Backup restored. No changes made."
fi