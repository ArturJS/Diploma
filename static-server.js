var express = require('express'),
    app = express(),
    __dirname = './public';

app.use(express.static(__dirname));
console.info('\n\nStatic server started! Port 8088!');
app.listen(8088);