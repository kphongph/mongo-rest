var uuid = require('node-uuid');
var JSONStream = require('JSONStream');
var express = require('express');
var router = express.Router();

router.get('/data/:id?', function(req, res) {
  var key = req.params.id ? req.params.id : '';
  var collection = req.collection;
  var opt = {limit: 10};
  if (req.query.limit) {
    var limit = parseInt(req.query.limit);
    if(limit != -1) {
      opt['limit'] = limit ? limit : 10;
    }
  }
  if(key == '') {
    collection.find({}, opt)
    .pipe(JSONStream.stringify())
    .pipe(res);
  } else {
    collection.findOne({"_id":key}, opt,function(err,doc) {
      if(!err) {
        if(!doc) {
          res.json({
            'ok': false,
            'message': 'Not Found'
          });
        } else {
          res.json(doc);
        }
      } else {
        res.json({
          'ok': false,
          'message': err
        });
      }
    });
  }
});

router.post('/data/:id?', function(req, res) {
  var key = req.params.id ? req.params.id : '';
  key = (key == '') ? {} : {
    "_id": key
  };
  var value = req.body;
  var collection = req.collection;
  if (!key._id) {
    key['_id'] = uuid.v1().replace(/-/g, '');
    value['_id'] = key['_id'];
  }

  collection.update(key, value, {
    'upsert': true
  }, function(err, resc) {
    if (err) {
      res.json({
        'ok': false,
        'message': err
      });
    } else {
      var result = resc.result;
      res.json({
        'ok': result.ok == 1 ? true : false,
        'key': key['_id']
      });
    }
  });
});

router.delete('/data/:id', function(req, res) {
  var key = req.params.id;
  var collection = req.collection;
  collection.deleteOne({'_id':key}, function(err, resc) {
    if (err) {
      res.json({
        'ok': false,
        'message': err
      });
    } else {
      var result = resc.result;
      res.json({
        'ok': result.ok == 1 ? true : false,
        'key': key
      });
    }
  });
});

router.post('/query', function(req, res) {
  var collection = req.collection;
  var body = req.body;
  var limit = 0;
  limit = body.limit?parseInt(body.limit):0;
  if(body.count){
    collection.count(body.count,function(err, count) {
      res.json(count);
    });
  }
  else if(body.aggregate){
    collection.aggregate(body.aggregate)
    .pipe(JSONStream.stringify())
    .pipe(res);
  }
  else if(body.distinct) {
    collection.distinct(body.distinct,body.query).then(function(docs) {
      res.json(docs);
    });
  } 
  else {
    collection.find(body.query,body.projection)
    .limit(limit)
    .pipe(JSONStream.stringify())
    .pipe(res);
  }
});

router.post('/mapreduce/:id', function(req, res) {
  var collection = req.collection;
  var body = req.body;
  var _collection = req.mongodb.db.collection('_mr_design');
  _collection.findOne({"_id":req.params.id},function(err,doc) {
    var map = eval(doc.map);
    var reduce = eval(doc.reduce);
    var finalfn = eval(doc.finalfn);
    var obj = new Object();
    obj.out = doc.out;
    obj.finalize = finalfn;
    obj.query = body.query;
    collection.mapReduce(map, reduce, obj, 
      function(err, collection) {
        if (err) {
          res.json({
            'ok': false,
            'message': err
          });
        } else {
          res.json({
            'ok': true
          });
        }
      }
    );
  });
});

module.exports = router;
