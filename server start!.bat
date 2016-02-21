cd nginx-1.8.0
start nginx_stop.bat
timeout 5 > NUL
start nginx.exe
cd ..
node server.js