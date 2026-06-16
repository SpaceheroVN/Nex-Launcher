@echo off
TITLE ✨ NEX Application Builder ✨
CLS

:: Set ANSI colors
SET "ESCAPE="
SET "RED=%ESCAPE%[31m"
SET "GREEN=%ESCAPE%[32m"
SET "YELLOW=%ESCAPE%[33m"
SET "CYAN=%ESCAPE%[36m"
SET "RESET=%ESCAPE%[0m"

:: Change to project root
cd /d "%~dp0.."

:: ==============================
:: 🚀 START SCRIPT
:: ==============================
ECHO %CYAN%============================================%RESET%
ECHO %CYAN%         NEX APPLICATION BUILD SCRIPT        %RESET%
ECHO %CYAN%============================================%RESET%
ECHO.

:: 🔤 Ask for version input only
ECHO %YELLOW%[PROMPT]%RESET% Please specify version tag for the .exe file (e.g. v1.0)
SET /p version_input="Enter version (default: none): "
IF "%version_input%"=="" (
    SET output_name=Nex
) ELSE (
    SET output_name=Nex_%version_input%
)
ECHO.

:: 🧪 Virtual environment setup
SET venv_path=venv
IF NOT EXIST "%venv_path%" (
    ECHO %YELLOW%[INFO]%RESET% 'venv' folder not found. Creating virtual environment...
    python -m venv "%venv_path%"
    IF %ERRORLEVEL% NEQ 0 (
        ECHO %RED%[ERROR]%RESET% Failed to create virtual environment.
        GOTO end
    )
)
ECHO %YELLOW%[INFO]%RESET% Activating virtual environment...
call "%venv_path%\Scripts\activate.bat"
IF %ERRORLEVEL% NEQ 0 (
    ECHO %RED%[ERROR]%RESET% Could not activate the virtual environment.
    GOTO end
)
ECHO.

:: 🧹 Clean up previous build
ECHO %YELLOW%[INFO]%RESET% Cleaning up previous build artifacts...
IF EXIST build rmdir /s /q build
IF EXIST "%output_name%.spec" del "%output_name%.spec"
ECHO.

:: 🔨 Build with PyInstaller
ECHO %YELLOW%[INFO]%RESET% Building %output_name%.exe...
pyinstaller --noconfirm ^
    --onefile ^
    --noconsole ^
    --name "%output_name%" ^
    --icon "icons/logo.ico" ^
    --add-data "icons;icons" ^
    --exclude-module QtWebEngineCore ^
    --exclude-module QtMultimedia ^
    --exclude-module QtWebEngine ^
    --exclude-module QtNfc ^
    --exclude-module QtPositioning ^
    --exclude-module QtQuick ^
    --exclude-module QtLocation ^
    --exclude-module QtSensors ^
    --exclude-module QtTest ^
    --upx-dir "C:\Users\Space\OneDrive\Documents\My_Dev\Installer_v2\.setup\upx-5.0.1-win64" ^
    nex.py

:: 📦 Build result
IF %ERRORLEVEL% EQU 0 (
    ECHO %GREEN%[SUCCESS]%RESET% Build completed! Your file is in the 'dist' folder as '%output_name%.exe'.
) ELSE (
    ECHO %RED%[ERROR]%RESET% PyInstaller failed with code: %ERRORLEVEL%.
)
ECHO.

:end
ECHO %CYAN%============================================%RESET%
ECHO %CYAN%       Press any key to close the builder      %RESET%
ECHO %CYAN%============================================%RESET%
pause >nul
