@echo off
title DairyMitra - डेयरी मित्र
echo ===================================================
echo 🥛 डेयरी मित्र (DairyMitra) - चालू किया जा रहा है...
echo ===================================================

if exist .venv\Scripts\python.exe (
    .venv\Scripts\python.exe server.py
) else (
    python server.py
)

pause
