@echo off
cd /d "%~dp0"
echo 1. Qwen3.5 2B (predeterminado, 1.40 GB)
echo 2. Gemma 4 E2B
echo 3. SmolLM3 3B
choice /c 123 /n /m "Elige modelo: "
if errorlevel 3 (set MODEL=smol) else if errorlevel 2 (set MODEL=gemma) else (set MODEL=qwen)
node local-play.mjs %MODEL%
pause
