var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var hotstart = require('hotstart');
var flash = require('connect-flash');

var routes = require('./routes/index');
var settings = require('./settings');

var fs = require('fs');
var accessLog = fs.createWriteStream('access.log', {flags: 'a'});
var errorLog = fs.createWriteStream('error.log', {flags: 'a'});

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(logger({stream: accessLog}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  resave:false,//添加这行  
  saveUninitialized: true,//添加这行   
  secret: settings.cookieSecret,
  key: settings.db,//cookie name
  cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},//30 days
  store: new MongoStore({
    db: settings.db,
    host: settings.host,
    port: settings.port
  })
}));
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));

//记录错误日志中间件
app.use(function (err, req, res, next) {
  var meta = '[' + new Date() + '] ' + req.url + '\n';
  errorLog.write(meta + err.stack + '\n');
  next();
});

//app.use('/', routes);
//我们在 routes/index.js 中通过 module.exports 导出了一个函数接口，在 app.js 中通过 require 加载了 index.js 然后通过 routes(app) 调用了 index.js 导出的函数。
routes(app);

app.use(hotstart({
  dir: __dirname,  //必须
  handle: '/app.js',  
  ignore:['/public','/node_modules'], //忽略的目录 。如果 view cache 为 false,将还会忽略掉view path
  suffix:['.js'],  //过滤的后缀  如果 view cache 为 true, if view cache true,将还会忽略掉 view engine
  route: '/', // 简单的外部路由
  tpl: 'EJS',  //模版缓存清理，目前只只持 jade ,EJS 
}, app));
//要是你项目是用express自动生成的，那你需要设置：
app.use(hotstart({dir:__dirname, tpl:'EJS'},app));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


