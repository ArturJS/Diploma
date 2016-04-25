cd nginx-1.8.0
start nginx_stop.bat
timeout 5 > NUL
start nginx.exe
cd ..
start comet-start.bat
start ws-start.bat
nodemon static-server.js
cd nginx-1.8.0
start nginx_stop.bat