@echo off
REM MiniShop mail server - chay:  double-click file nay
cd /d "%~dp0"
if not exist node_modules (
  echo Dang cai deps lan dau...
  call npm install
)
echo Starting MiniShop mail server on port 4000...
call npm start
pause