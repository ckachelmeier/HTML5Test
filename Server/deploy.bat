@ECHO off

set "dir1=C:\Users\Digineerian\Dropbox\Work Items\Code\Html5Test\Server"

FOR %%X in ("%dir1%\*.ts") DO (
echo Compiling %%~fX
tsc "%%~fX"
)

node server.js