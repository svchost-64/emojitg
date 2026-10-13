@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo Primer inicio: se ha creado el archivo .env.
  echo Pega tu BOT_TOKEN, guarda y cierra el Bloc de notas.
  start /wait notepad.exe "%~dp0.env"
)
node --env-file=.env bot.mjs
echo.
echo El bot se ha detenido.
pause
