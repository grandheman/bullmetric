@echo off
setlocal
title BullMetric Setup & Deploy

echo ========================================================
echo           BullMetric - Firebase Deployment Script
echo ========================================================
echo.
echo This script will help you deploy BullMetric to your own Firebase account.
echo.

:: 1. Check for Node.js
echo [1/6] Checking for Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed.
    echo         Please install it from https://nodejs.org/ and try again.
    pause
    exit /b
)
echo       Node.js is installed.

:: 2. Check for Firebase CLI
echo [2/6] Checking for Firebase CLI...
call firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo       Firebase CLI not found. Installing now...
    call npm install -g firebase-tools
) else (
    echo       Firebase CLI is already installed.
)

:: 3. Install Dependencies
echo [3/6] Installing project dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b
)

:: 4. Firebase Login
echo [4/6] Ensuring you are logged in to Firebase...
echo       (A browser window may open asking for permission)
call firebase login

:: 5. Configure Project
echo.
echo ========================================================
echo CONFIGURATION NEEDED
echo ========================================================
echo Please ensure you have created a project in the Firebase Console:
echo https://console.firebase.google.com/
echo.
echo Make sure you have enabled:
echo  - Authentication (Email/Password)
echo  - Firestore Database (Production mode)
echo.
set /p PROJECT_ID="Enter your Firebase Project ID (e.g. bullmetric-123): "

if "%PROJECT_ID%"=="" (
    echo [ERROR] Project ID cannot be empty.
    pause
    exit /b
)

echo.
echo Configuring project '%PROJECT_ID%'...
call firebase use %PROJECT_ID% --alias default
if %errorlevel% neq 0 (
    echo [ERROR] Could not set project. Check if the ID is correct and you have permissions.
    pause
    exit /b
)

:: 6. Build and Deploy
echo [5/6] Building production bundle...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed.
    pause
    exit /b
)

echo [6/6] Deploying to Firebase...
call firebase deploy
if %errorlevel% neq 0 (
    echo [ERROR] Deployment failed.
    pause
    exit /b
)

echo.
echo ========================================================
echo              DEPLOYMENT SUCCESSFUL!
echo ========================================================
echo Your app should now be live.
pause
