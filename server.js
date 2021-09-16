const express = require('express');
const app = express();
//body parser 설정
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : true}));

require("dotenv").config();

const MongoClient = require('mongodb').MongoClient;
MongoClient.connect('mongodb+srv://' + process.env.id +':' + process.env.password + '@cluster0.x4v7d.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',function(err, client){
    app.listen(8080, function(){
        console.log('listening on 8080');
    });
})

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.get('/write', function(req, res){
    res.sendFile(__dirname + '/write.html');
});

app.get('/beta', function(req, res){
    res.send('베타 페이지입니다.');
});

// data 저장
app.post('/add', function(req, res){
    res.send(req.body);
});