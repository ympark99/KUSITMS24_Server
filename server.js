const express = require('express');
const router = express.Router();
const app = express();
//body parser 설정
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : true}));
app.use('/public', express.static(('public'))); // 미들웨어-> public 사용 선언
const methodOverride = require('method-override') // put 사용
app.use(methodOverride('_method'))

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
    res.render('index.ejs');
});

app.get('/write', function(req, res){
    res.render('write.ejs');
});

app.get('/beta', function(req, res){
    res.send('베타 페이지입니다.');
});

app.get('/list', function(req, res){
    db.collection('post').find().toArray(function(err, result){
        if(err) return console.log(err);
        console.log(result);
        res.render('list.ejs',{ posts : result });
    });
})

// data 저장
app.post('/add', function(req, res){
    //  res.send('전송 완료');
    db.collection('counter').findOne({name : '게시물개수'}, function(err, result){
        if(err) return console.log(err);
        console.log(result.totalPost);
        var allPosts = result.totalPost;

        // 데이터 저장 -> 저장시 _id 꼭 적어야함
        db.collection('post').insertOne({_id : allPosts + 1, title : req.body.title, date : req.body.date}, function(err, result){
            if(err) return console.log(err);
            console.log('db에 저장 완료');
            // counter의 totalPost 1 증가시킴(게시물개수)
            // $set : 바꿀 값, $inc : 더해줄 값
            db.collection('counter').updateOne({name : '게시물개수'},{ $inc : {totalPost : 1}},function(err, result){
                if(err) return console.log(err);
            });
            res.redirect('/list');
        });
    });
});

app.delete('/delete', function(req, res){
    console.log(req.body);
    // 숫자로 변환
    req.body._id = parseInt(req.body._id);    
    db.collection('post').deleteOne(req.body, function(err, result){
        if(err) return console.log(err);
        console.log('삭제 완료');
        res.status(200).send({ message : 'success' });
        // 전체 개수 -1
        db.collection('counter').updateOne({name : '게시물개수'},{ $inc : {totalPost : -1}},function(err, result){
            if(err) return console.log(err);
        });        
    })
})

// :id -> 각 id별 페이지 파라미터
app.get('/detail/:id', function(req, res){
    db.collection('post').findOne({_id : parseInt(req.params.id)}, function(err, result){
        if(err) return console.log(err);
        res.render('detail.ejs', { data : result });
    })
})

app.get('/edit/:id', function(req, res){
    db.collection('post').findOne({_id : parseInt(req.params.id)}, function(err, result){
        if(err) return console.log(err);
        res.render('edit.ejs', { post : result });
    })
})

// 수정 기능
app.put('/edit', function(req, res){
    db.collection('post').updateOne({ _id : parseInt(req.body.id) },{ $set : { title : req.body.title, date : req.body.date} }, function(err, result){
        console.log('수정완료');
        res.redirect('/list');
    })
})

// 로그인
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

// 미들웨어 설정
app.use(session({ secret : '비밀코드', resave : true, saveUninitialized : false}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', function(req, res){
    res.render('login.ejs');
})

app.post('/login', passport.authenticate('local', {
    failureRedirect : '/fail'
}), function(req, res){
    res.redirect('/');
})

passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
}, function (inputId, inputPw, done) {
    //console.log(inputId, inputPw);
    db.collection('login').findOne({ id: inputId }, function (err, result) {
        if (err) return done(err);
    
        if (!result) return done(null, false, { message: 'ID is not found' });
        if (inputPw == result.pw) {
            return done(null, result); // serializeUser의 user로 들어감
        } else {
            return done(null, false, { message: 'Password incorrect' });
        }
        })
}));

// session 저장(로그인 성공시), id 이용
passport.serializeUser(function(user, done){
    done(null, user.id); // 세션 정보 쿠키로 보냄
})
// 세션 데이터 가진 사람 db에서 찾음
passport.deserializeUser(function(id, done){
    done(null, {});
})