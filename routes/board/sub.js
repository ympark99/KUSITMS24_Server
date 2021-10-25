var router = require('express').Router();

router.get('/sports', function(req, res){
    res.send('스포츠 게시판');
});

router.get('/game', function(req, res){
    res.send('게임 게시판');
});

// 내보낼 변수명
module.exports = router;