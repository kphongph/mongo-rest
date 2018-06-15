var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var passport = require('passport');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var session = require('express-session');
var rewrite = require('express-urlrewrite');
var MongoClient = require('mongodb').MongoClient;
var route = require('./route');

var argv = require('minimist')(process.argv.slice(2));

var mongodb = null;

var app = express();

app.use(passport.initialize());
app.use(passport.session());
app.use(cors());

app.use(bodyParser.json({
  limit: '50mb'
}));

app.use(bodyParser.urlencoded({
  extended: true
}));

var jwtOptions = {}

jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeader();
jwtOptions.secretOrKey = argv.jwt_secret;

passport.use(new JwtStrategy(jwtOptions, function(jwt_payload, done) {
  done(null, jwt_payload);
}));

var ensureLogin = function(req, res, next) {
  passport.authenticate(['jwt'], function(err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.json({
        'ok': false,
        'message': 'Authentication Required'
      });
    } else {
      return next();
    }
  })(req, res, next);
};

app.param('db', function(req, res, next, value) {
  req.db = mongodb.db(value);
  next();
});

app.param('collection', function(req, res, next, value) {
  req.collection = req.db.collection(value);
  next();
});

// app.use('/mongodb/:db/:collection', ensureLogin, route);
app.use('/mongodb/:db/:collection', route);

MongoClient.connect(argv.mongodb_url, function(err, client) {
  if(!err) {
    mongodb = client;
    app.listen(3000, function() {
      console.log('Server listening on port %d', this.address().port);
    });
  } else {
    throw new Error(err);
  }
});
