@echo off
echo Packaging ARKON for LIDM Submission...
echo Exuding sensitive files and directories...

REM Requires 7-Zip or powershell Compress-Archive
REM We will use powershell Compress-Archive but it doesn't support complex exclusions easily.
REM Instead, we will create a temporary folder, copy files, and zip that.

set TEMP_DIR=arkon-temp-submission
set OUT_ZIP=arkon-LIDM-submission.zip

echo 1. Creating temporary directory...
if exist %TEMP_DIR% rmdir /S /Q %TEMP_DIR%
if exist %OUT_ZIP% del %OUT_ZIP%
mkdir %TEMP_DIR%

echo 2. Copying files (this might take a minute)...
xcopy . %TEMP_DIR% /E /I /H /Y /EXCLUDE:exclude.txt

echo 3. Creating ZIP file...
powershell Compress-Archive -Path "%TEMP_DIR%\*" -DestinationPath %OUT_ZIP% -Force

echo 4. Cleaning up...
rmdir /S /Q %TEMP_DIR%

echo DONE! Created %OUT_ZIP% safely without .env files.
pause
