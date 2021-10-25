var router = require('express').Router();

// 로그인 검사
function isLogin(req, res, next){
    if(req.user) next(); // 로그인시 req.user는 반드시 있음
    else res.send('로그인이 필요합니다.');
}

router.use(isLogin); // isLogin이 모든 미들웨어에 적용

// router.use('/shirts', isLogin); // shirts에만 로그인 검사 적용

router.get('/shirts', function(req, res){
    res.send('셔츠 파는 페이지입니다.');
});

router.get('/pants', function(req, res){
    res.send('바지 파는 페이지입니다.');
});

// 내보낼 변수명
module.exports = router;