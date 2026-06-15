#!/usr/bin/env pwsh
# setup.ps1 — Run this once to set up slides.flowlog.dev locally
# Usage: .\setup.ps1

Write-Host "slides.flowlog.dev — Setup" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

# 1. Install deps
Write-Host "`n[1/4] Installing dependencies..." -ForegroundColor Cyan
npm install

# 2. Check for .env.local
if (-not (Test-Path ".env.local")) {
  Write-Host "`n[2/4] Creating .env.local..." -ForegroundColor Cyan
  Copy-Item ".env.local" ".env.local"
  Write-Host "  -> Edit .env.local and add your ANTHROPIC_API_KEY" -ForegroundColor Yellow
} else {
  Write-Host "`n[2/4] .env.local already exists" -ForegroundColor Green
}

# 3. Git init
Write-Host "`n[3/4] Initializing git..." -ForegroundColor Cyan
if (-not (Test-Path ".git")) {
  git init
  git add .
  git commit -m "feat: initial slides.flowlog.dev — AI presentation builder with Pinvest template"
  Write-Host "  -> Git repo initialized" -ForegroundColor Green
} else {
  Write-Host "  -> Git repo already exists" -ForegroundColor Green
}

# 4. Start dev
Write-Host "`n[4/4] Starting dev server..." -ForegroundColor Cyan
Write-Host "  -> Open http://localhost:3008" -ForegroundColor Yellow
Write-Host ""
npm run dev
