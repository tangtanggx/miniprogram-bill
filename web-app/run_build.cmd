@echo off
cd /d E:\lingxi\20260426-14-15-57-500\accounting-app
call "C:\Users\yaozh\.workbuddy\binaries\node\versions\22.14.0\npm.cmd" run build > build_output.txt 2>&1
echo EXIT_CODE=%ERRORLEVEL% >> build_output.txt
