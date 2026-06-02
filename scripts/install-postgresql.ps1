# Run as Administrator: Right-click PowerShell -> Run as administrator, then:
#   cd "C:\Users\jgoldberger\Desktop\Online Map"
#   .\scripts\install-postgresql.ps1

$ErrorActionPreference = "Stop"
$installer = "$env:TEMP\postgresql-16-installer.exe"

if (-not (Test-Path $installer)) {
  Write-Host "Downloading PostgreSQL 16 installer (~340 MB)..."
  $url = "https://get.enterprisedb.com/postgresql/postgresql-16.6-1-windows-x64.exe"
  Invoke-WebRequest -Uri $url -OutFile $installer -UseBasicParsing
}

Write-Host "Installing PostgreSQL (superuser password: sip, port: 5432)..."
$args = @(
  "--mode", "unattended",
  "--superpassword", "sip",
  "--serverport", "5432",
  "--unattendedmodeui", "none",
  "--install_runtimes", "0"
)
Start-Process -FilePath $installer -ArgumentList $args -Wait

Write-Host "Creating SIP database..."
$psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
if (-not (Test-Path $psql)) {
  Write-Host "psql not found at $psql — adjust path if PostgreSQL installed elsewhere."
  exit 1
}

$env:PGPASSWORD = "sip"
& $psql -U postgres -h localhost -p 5432 -c "CREATE USER sip WITH PASSWORD 'sip' SUPERUSER;" 2>$null
& $psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE sip OWNER sip;" 2>$null

Write-Host ""
Write-Host "Add to .env:"
Write-Host 'DATABASE_URL="postgresql://sip:sip@localhost:5432/sip?schema=public"'
Write-Host ""
Write-Host "Then run: npx prisma migrate deploy && npm run db:seed"
