@echo off
rem MIKU: open the app through a small local web server (127.0.0.1:3939) so MIKU RADIO can play songs inside the page.
rem Opening index.html directly (file://) does not allow YouTube to play in the page.
start "" /min powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0tools\miku-server.ps1"
powershell -NoProfile -Command "Start-Sleep -Milliseconds 900"
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://127.0.0.1:3939/
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=http://127.0.0.1:3939/
) else (
  start "" http://127.0.0.1:3939/
)
