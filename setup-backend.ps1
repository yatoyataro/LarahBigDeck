# Setup Script for LarahBigDeck Backend
# Run this script after creating your Supabase project

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "LarahBigDeck Backend Setup Script" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray

npm install next@latest react@latest react-dom@latest
npm install @supabase/ssr @supabase/supabase-js
npm install --save-dev @types/node @types/react @types/react-dom typescript eslint eslint-config-next

Write-Host "✓ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Create .env.local if it doesn't exist
if (!(Test-Path ".env.local")) {
    Write-Host "Creating .env.local file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env.local"
    Write-Host "✓ .env.local created" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Edit .env.local with your Supabase credentials!" -ForegroundColor Yellow
    Write-Host "   Get your credentials from: https://app.supabase.com/project/_/settings/api" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "✓ .env.local already exists" -ForegroundColor Green
    Write-Host ""
}

# Update package.json with API scripts
Write-Host "Updating package.json with API scripts..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json

if (!$packageJson.scripts."dev:api") {
    $packageJson.scripts | Add-Member -NotePropertyName "dev:api" -NotePropertyValue "next dev -p 3001" -Force
    $packageJson.scripts | Add-Member -NotePropertyName "build:api" -NotePropertyValue "next build" -Force
    $packageJson.scripts | Add-Member -NotePropertyName "start:api" -NotePropertyValue "next start -p 3001" -Force
    
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
    Write-Host "✓ Scripts added to package.json" -ForegroundColor Green
} else {
    Write-Host "✓ API scripts already exist in package.json" -ForegroundColor Green
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Create a Supabase project at https://supabase.com" -ForegroundColor White
Write-Host "2. Run the SQL migrations in Supabase Dashboard (SQL Editor):" -ForegroundColor White
Write-Host "   - supabase/migrations/20241022000001_initial_schema.sql" -ForegroundColor Gray
Write-Host "   - supabase/migrations/20241022000002_storage_policies.sql" -ForegroundColor Gray
Write-Host "3. Create 'deck-uploads' storage bucket in Supabase Dashboard" -ForegroundColor White
Write-Host "4. Update .env.local with your Supabase credentials" -ForegroundColor White
Write-Host "5. Run 'npm run dev:api' to start the backend server" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "- BACKEND_README.md - Complete setup guide" -ForegroundColor White
Write-Host "- API_TESTING_GUIDE.md - API testing instructions" -ForegroundColor White
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Cyan
