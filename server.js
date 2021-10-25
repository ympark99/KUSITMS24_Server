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

// 검색
app.get('/search', (req, res) => {
    //console.log(req.query.value);
    //db.collection('post').find({ title : req.query.value }).toArray(function(err, result){
    /*
    // text index로 빠른검색, or 검색 기능, -로 제외 가능(구글 검색 기능)
    db.collection('post').find({ $text: { $search : req.query.value } }).toArray(function(err, result){        
        console.log(result);
        res.render('search.ejs', { posts : result });
    });
    */
   //aggregate(검색조건 여러개 가능)
   var condition = [
    {
      $search: {
        index: 'titleSearch',
        text: {
          query: req.query.value,
          path: 'title'  // 제목날짜 둘다 찾고 싶으면 ['title', 'date']
        }
      }
    },
    /*
    // 정렬 -1은 역순
    { $sort : { _id : 1 }},
    // 상위 10개만
    { $limit : 10 }    
    */
   // 0은 안가져옴, score은 몽고디비에서 자체 스코어순
   // { $project : { title : 1, _id : 0, score : { $meta : "searchScore " }}}
    
  ];
   db.collection('post').aggregate(condition).toArray(function(err, result){        
    console.log(result);
    res.render('search.ejs', { posts : result });
    });
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
});

app.post('/login', passport.authenticate('local', {
    failureRedirect : '/fail'
}), function(req, res){
    res.redirect('/');
});

// isLogin 미들웨어
app.get('/mypage', isLogin, function(req, res){
    // req.user에 사용자 정보 담겨있음
    console.log(req.user);
    res.render('mypage.ejs', {user : req.user});
});

// 로그인 검사
function isLogin(req, res, next){
    if(req.user) next(); // 로그인시 req.user는 반드시 있음
    else res.send('로그인이 필요합니다.');
}

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
});

// 세션 데이터 가진 사람 개인정보 db에서 찾음
passport.deserializeUser(function(userId, done){
    // db에서 user.id로 유저를 찾은 뒤에 유저 정보를 아래에 넣음
    db.collection('login').findOne({id : userId}, function(err, result){
        done(null, result);
    })
});

app.post('/register', function(req, res){
    db.collection('login').insertOne( { id : req.body.id, pw : req.body.pw }, function(err, result){
        res.redirect('/');
    } )
});

// data 저장
app.post('/add', function(req, res){
    //  res.send('전송 완료');
    db.collection('counter').findOne({name : '게시물개수'}, function(err, result){
        if(err) return console.log(err);
        console.log(result.totalPost);
        var allPosts = result.totalPost;

        //var saveData = { _id : allPosts + 1, writer : req.user._id, title : req.body.title, date : req.body.date};

        // 데이터 저장 -> 저장시 _id 꼭 적어야함
        db.collection('post').insertOne({_id : allPosts + 1, writer : req.user._id, title : req.body.title, date : req.body.date}, function(err, result){
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

    var deleteData = { _id : req.body._id, writer : req.user._id }

    db.collection('post').deleteOne(deleteData, function(err, result){
        if(err) return console.log(err);
        console.log('삭제 완료');
        res.status(200).send({ message : 'success' });
        // 전체 개수 -1
        db.collection('counter').updateOne({name : '게시물개수'},{ $inc : {totalPost : -1}},function(err, result){
            if(err) return console.log(err);
        });        
    })
});

let multer = require('multer');
var storage = multer.diskStorage({
    destination : function(req, file, cb){
        cb(null, './public/image');
    },
    filename : function(req, file, cb){
        cb(null, file.originalname); //저장한 이미지 파일 이름 설정,  + 'date' + new Date(), filefilter도 있음 -> 확장자 거르기, limits -> 용량제한
    }
})

var upload = multer({storage : storage});


app.get('/upload', function(req, res){
    res.render('upload.ejs');
});

// multer 미들웨어로 동작, upload.single은 저장, upload.array('profile',10)는 여러개 파일 업로드
app.post('/upload', upload.single('profile'), function(req, res){
    res.send('upload complete');
});

// 이미지 경로로 접속하면 이미지 보여줌
app.get('/image/:imageName', function(req, res){
    res.sendFile(__dirname + '/public/image' + req.params.imageName);
})

// 고객이 /shop경로로 요청했을때 (shop.js 파일을 첨부)미들웨어 적용
app.use('/shop', require('./routes/shop'));

app.use('/board/sub', require('./routes/board/sub'));