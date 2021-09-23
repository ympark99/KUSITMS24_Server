const express = require('express');
const router = express.Router();
const app = express();
//body parser 설정
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : true}));
app.set('view engine', 'ejs');

require("dotenv").config();

// mongodb 연결
var db; // 연결 변수
const MongoClient = require('mongodb').MongoClient;
const connectUrl = 'mongodb+srv://' + process.env.id +':' + process.env.password + '@cluster0.x4v7d.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
MongoClient.connect( connectUrl ,{ useUnifiedTopology : true },function(err, client){
    if(err) return console.log(err);

    db = client.db('todoapp'); // todoapp db에 연결

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

app.get('/list', function(req, res){
    db.collection('post').find().toArray(function(err, result){
        if(err) console.log(err);
        console.log(result);
        res.render('list.ejs',{ posts : result });
    });
})

// data 저장
app.post('/add', function(req, res){
    // 데이터 저장 -> 저장시 _id 꼭 적어야함
    db.collection('post').insertOne({_id : Math.random() * 1e16, title : req.body.title, date : req.body.date}, function(err, result){
        if(err) return console.log(err);
        console.log('추가 완료');
    });
});