var express = require('express');
var app = express();
var assert = require("assert");
var mongoose = require('mongoose');
var shortid = require('shortid');

var uri = process.env.MLAB_URI||'mongodb://localhost/urls';
// Use bluebird
var options = {
	promiseLibrary: require('bluebird')
};
var db = mongoose.createConnection(uri, options);
ShortUrl = db.model('shortUrl', {
	_id: {
		type: String,
		'default': shortid.generate
	},
	url: {
		type: String,
		required: true
	}
});

db.on('open', function() {
	assert.equal(ShortUrl.collection.findOne().constructor, require('bluebird'));
});

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});


app.get('/new*', function(req, res) {
	var url = req.params[0].substring(1);
	var host = req.get("host");
	var shortUrl = ShortUrl({
		url: url
	});

	shortUrl.save().then(function(d) {
		res.send({
			"original_url": url,
			"short_url": "http://" + host + "/" + d._id
		});
	});
});


app.get('/:id', function(req, res) {
	var id = req.params.id;
	var p = ShortUrl.findById(id);
	p.then((doc) => {
		if (doc == null) {
			res.status(404);
			res.send({
				error: 'Not found url by this id'
			});
		}
		res.redirect(doc.url);
	}).catch(function(d) {
		console.log("Catch exception when finding url by id ", id, ".", d);
		throw d;
	});
});

app.set('port', (process.env.PORT || 4000));

app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});