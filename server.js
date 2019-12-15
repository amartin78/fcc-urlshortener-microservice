'use strict';

require('dotenv').config();
var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

var dns = require('dns');

var Schema = mongoose.Schema;
var schema = new Schema({
  original_url: String,
  short_url: Number
});

var bodyParser = require('body-parser');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());

var UShort = mongoose.model('UShort', schema);


/** this project needs to parse POST bodies **/
// you should mount the body-parser here
// app.use('/', bodyParser.urlencoded({extended: false}));
var urlencodedParser = bodyParser.urlencoded({extended: false});

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


// shorturl API
app.post("/api/shorturl/new", urlencodedParser, function(req, res, done) {
  
  var original_url = req.body.url;
  var short_url = parseInt(Math.random() * 1000) + 3000;
  var error = false;
  var uShort = new UShort({original_url: original_url, short_url: short_url});
  var regex = /http[s]*:\/\//;
  
  if (!original_url.match(regex)) {
    error = true;
  } else {
    dns.lookup(original_url.split(original_url.match(regex))[1], function (err, address, family){
      if(err) {
        error = true;
      } 
    });
  }
  
  uShort.save(function(err, data) {
    if(error) return res.send({error: 'invalid URL'});
    done(null, res.send({original_url: data['original_url'], 
            short_url: data['short_url']}));
  });
});

app.get('/api/shorturl/:surl', function(req, res, done) {
  UShort.find({short_url: req.params['surl']}, function(err, data) {
    var oUrl = data[0]['original_url'];
    res.redirect(301, oUrl);
  });
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});