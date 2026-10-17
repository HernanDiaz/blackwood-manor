@echo off
cd /d "%~dp0"
echo 1. Gemma 4 E2B (recomendado)
echo 2. Qwen3.5 2B
echo 3. SmolLM3 3B
choice /c 123 /n /m "Elige modelo: "
if errorlevel 3 (set MODEL=smol) else if errorlevel 2 (set MODEL=qwen) else (set MODEL=gemma)
node local-play.mjs %MODEL%
pause
