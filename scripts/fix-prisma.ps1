# Fix Prisma Permission Issues Script
# Run this script when you encounter Prisma generation errors

Write-Host "🔧 Fixing Prisma permission issues..." -ForegroundColor Yellow

# Kill any running Node processes that might be locking files
Write-Host "Stopping Node processes..." -ForegroundColor Blue
taskkill /f /im node.exe 2>$null | Out-Null

# Wait a moment for processes to fully terminate
Start-Sleep -Seconds 2

# Remove Prisma cache directory
Write-Host "Cleaning Prisma cache..." -ForegroundColor Blue
if (Test-Path "node_modules\.prisma") {
    Remove-Item -Recurse -Force "node_modules\.prisma" -ErrorAction SilentlyContinue
    Write-Host "✓ Prisma cache cleaned" -ForegroundColor Green
} else {
    Write-Host "✓ No Prisma cache found" -ForegroundColor Green
}

# Remove any lock files
Write-Host "Cleaning lock files..." -ForegroundColor Blue
Get-ChildItem -Path "node_modules" -Recurse -Name "*lock*" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item "node_modules\$_" -Force -ErrorAction SilentlyContinue
}

# Regenerate Prisma client
Write-Host "Regenerating Prisma client..." -ForegroundColor Blue
try {
    npx prisma generate
    Write-Host "✓ Prisma client generated successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Prisma generation failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Try running: npm run db:generate:force" -ForegroundColor Yellow
}

Write-Host "`n🎉 Prisma fix completed!" -ForegroundColor Green
Write-Host "You can now run: npm run build" -ForegroundColor Cyan
