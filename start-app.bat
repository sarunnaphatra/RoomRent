@echo off
echo Starting Backend...
start "Backend Server" cmd /k "cd Backend && npm start"

echo Starting Frontend...
start "Frontend App" cmd /k "cd Frontend && npm run dev"

echo Application started!
