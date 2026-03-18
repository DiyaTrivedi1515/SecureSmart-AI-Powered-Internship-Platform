# SecureSmart - Universal Start Script
# Works on ANY PC regardless of install location.
# Just copy this file along with the project and run it.

Write-Host ""
Write-Host "  ██████  ███████  ██████  ██    ██ ██████  ███████ " -ForegroundColor Cyan
Write-Host "  ██      ██      ██       ██    ██ ██   ██ ██      " -ForegroundColor Cyan
Write-Host "  ███████ █████   ██       ██    ██ ██████  █████   " -ForegroundColor Cyan
Write-Host "       ██ ██      ██       ██    ██ ██   ██ ██      " -ForegroundColor Cyan
Write-Host "  ███████ ███████  ██████   ██████  ██   ██ ███████ " -ForegroundColor Cyan
Write-Host ""
Write-Host "  SecureSmart AI Internship Platform" -ForegroundColor White
Write-Host "  -------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

# Auto-detect the project root based on where this script lives
$BASE_PATH = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "Project Root: $BASE_PATH" -ForegroundColor Gray

# 1. Kill existing processes
Write-Host "Cleaning up existing processes..." -ForegroundColor DarkGray
Stop-Process -Name "node" -ErrorAction SilentlyContinue
Stop-Process -Name "python" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# 2. Start ML Service (Python)
Write-Host "Starting AI Microservice on Port 5001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '[ML SERVICE]' -ForegroundColor Yellow; Set-Location '$BASE_PATH\ml-service'; python ml_api.py"

Start-Sleep -Seconds 2

# 3. Start Backend (Node.js)
Write-Host "Starting Backend API on Port 5000..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '[BACKEND]' -ForegroundColor Blue; Set-Location '$BASE_PATH\backend'; node server.js"

Start-Sleep -Seconds 2

# 4. Start Frontend (Next.js)
Write-Host "Starting Frontend on Port 3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '[FRONTEND]' -ForegroundColor Green; Set-Location '$BASE_PATH\frontend'; npm run dev"

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "  -------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  All services started!" -ForegroundColor Green
Write-Host "  Visit:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "  API:    http://localhost:5000/api/status" -ForegroundColor Cyan
Write-Host "  ML:     http://localhost:5001" -ForegroundColor Cyan
Write-Host "  -------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""
