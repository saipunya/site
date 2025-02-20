const { publicDecrypt } = require('crypto');
const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const ejs = require('ejs');

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.get('/',(req,res) => {
    res.render('index')
})
app.listen(port,()=>{
    console.log('server is listening on port', port);
})