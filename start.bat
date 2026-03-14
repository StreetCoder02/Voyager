@echo off
echo Starting Voyager Backend Server...
start cmd /k "cd server && npm start"

echo Starting Voyager Frontend Client...
start cmd /k "cd client && npm run dev"

echo Voyager Fleet Management is starting up...
echo The backend simulation runs on Port 5000.
echo The frontend will open automatically in your browser.
