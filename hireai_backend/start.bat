@echo off
title HireAI Backend Server
cd /d "%~dp0"
call venv\Scripts\activate

REM ============================================
REM  SET YOUR GMAIL CREDENTIALS BELOW
REM  (Use a Gmail App Password, NOT your regular password)
REM ============================================
set HIREAI_EMAIL=your_email@gmail.com
set HIREAI_EMAIL_PASS=your_app_password_here

echo.
echo ============================================
echo    HireAI Backend is starting...
echo    Email: %HIREAI_EMAIL%
echo    Press Ctrl+C to stop the server
echo ============================================
echo.
python manage.py runserver 0.0.0.0:8000
pause
