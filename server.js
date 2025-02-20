
const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const ejs = require('ejs');

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist'))
app.get('/',(req,res) => {
    res.render('index')
})
app.get('/product/:fruit',(req,res) => {
    let  fruit = req.params.fruit
    res.render('product', {data: fruit})
    
})
app.listen(port,()=>{
    console.log('server is listening on port', port);
})