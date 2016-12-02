var express = require('express');
var router = express.Router();
var User = require('../models/user'),
    Tip = require('../models/tip');

module.exports = router;

router.get('/', function(req, res) {
    var page = parseInt(req.query.p) || 1;
    Tip.getTips(page, function(err, tips, total) {
        if (err) {
            tips = [];
        }
        res.render('./tips/tips_index', {
            title: 'Main Page',
            tips: tips,
            page: page,
            isFirstPage: (page - 1) == 0,
            isLastPage: ((page - 1) * 6 + tips.length) == total,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

router.get('/new', checkLogin);
router.get('/new', function(req, res) {
    res.render('./tips/new_tip', {
        title: 'New Tip',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});

router.post('/new', checkLogin);
router.post('/new', function(req, res) {
    var currentUser = req.session.user,
        tags = [req.body.tag1, req.body.tag2, req.body.tag3],
        tip = new Tip(req.body.title, tags, req.body.content);
    tip.save(function(err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('./');
        }
        req.flash('success', "You made it! A new Tip.");
        res.redirect('./');
    });
});

//获取单个Tip
router.get('/single/:id', function(req, res) {
    Tip.getOne(req.params.id, function(err, tip) {
        if (err) {
            req.flash('error', err);
            return res.redirect('./');
        }
        res.render('./tips/single_tip', {
            title: tip.title,
            tip: tip,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        })
    })
});

//得到所有标签
router.get('/tags', function(req, res) {
    Tip.getTags(function(err, tags) {
        if (err) {
            req.flash('error', err);
            return res.redirect('./');
        }
        res.render('./tips/tips_tags', {
            title: 'Tags',
            tags: tags,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

//获得某标签下所有Tip
router.get('/tags/:tag', function(req, res) {
    Tip.getTag(req.params.tag, function(err, tips) {
        if (err) {
            req.flash('error', err);
            return res.redirect('./');
        }
        res.render('./tips/tips_tag', {
            title: 'TAG' + req.params.tag,
            tips: tips,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

router.get('/edit/:id', checkLogin);
router.get('/edit/:id', function(req, res) {
    var currentUser = req.session.user;
    Tip.edit(req.params.id, function(err, tip) {
        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }
        res.render('./tips/tips_edit', {
            title: 'Edit',
            tip: tip,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        })
    });
});

router.post('/edit/:id', checkLogin);
router.post('/edit/:id', function(req, res) {
    var currentUser = req.session.user;
    var title = req.body.title,
        content = req.body.content,
        tags = [req.body.tag1, req.body.tag2, req.body.tag3];

    Tip.update(req.params.id, title, content, tags, function(err) {
        var url = encodeURI('/tips/single/' + req.params.id);
        if (err) {
            req.flash('error', err);
            return res.redirect(url); //出错！返回文章页
        }
        req.flash('success', '修改成功!');
        res.redirect(url); //成功！返回文章页
    });
});

router.get('/remove/:id', checkLogin);
router.get('/remove/:id', function(req, res) {
    var currentUser = req.session.user;
    Tip.remove(req.params.id, function(err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }
        req.flash('success', '删除成功!');
        res.redirect('/tips');
    });
});

router.get('/archive', function(req, res) {
    Tip.getArchive(function(err, tips) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        res.render('./tips/tips_archive', {
            title: '归档',
            tips: tips,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

router.get('/search', function(req, res) {
    Tip.search(req.query.keyword, function(err, tips) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        res.render('./tips/tips_archive', {
            title: "SEARCH:" + req.query.keyword,
            tips: tips,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

function checkLogin(req, res, next) {
    if (!req.session.user) {
        req.flash('error', '未登录!');
        res.redirect('/login');
    }
    next();
}

function checkNotLogin(req, res, next) {
    if (req.session.user) {
        req.flash('error', '已登录!');
        res.redirect('back');
    }
    next();
}