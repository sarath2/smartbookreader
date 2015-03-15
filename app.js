require('./lib/prototype.js');
var express = require('express');
var socket = require('./functions/socket.js');
var http = require('http');
var app = express();
//google API Oauth
var _ = require('lodash');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var readline = require('readline');
var google = require('googleapis');
var OAuth2ClientGL = google.auth.OAuth2;
var plus = google.plus('v1');
var drive = google.drive('v2');
// Client ID and client secret are available at
/** generate from https://code.google.com/apis/console **/
var CLIENT_ID = '849237012838-10la8vn95sudo06v2ch6d8gc3jlf9fva.apps.googleusercontent.com';
var CLIENT_SECRET = 'TT8nbY6p26HjBwDvIhxwaReN';
var REDIRECT_URL = 'http://localhost:3000/googleauth';
var oauth2Client = new OAuth2ClientGL(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
//File upload
process.env.TMPDIR = 'tmp';
var fs = require('fs');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var flow = require('./lib/flow-node.js')('tmp');

// auth
// passport library
var passport = require('passport');
var passportStrategy = require('passport-local').Strategy;
var AUTH = require('./config/auth.js');
AUTH.init(passport, passportStrategy);

// all environments
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());

app.use(require('express-promise')());
// auth
app.use(express.session({
	secret: AUTH.getSecretKey()
}));
app.use(passport.initialize()); // Add passport initialization
app.use(passport.session()); // Add passport initialization

app.use(app.router);


app.set('port', process.env.PORT || 3000);

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

// allow cross site scripting, be careful with that in production
app.all('*', function (req, res, next) {
	res.header('Access-Control-Allow-Credentials', true);
	res.header('Access-Control-Allow-Origin', req.headers.origin);
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
	next();
});

process.on('uncaughtException', function (err) {
	console.log('Caught exception: ' + err);
});

// SET environment configuration
var config = require('./config/env');

// Endpoint handlers
var user = require('./functions/user');
var member = require('./functions/member');
var activity = require('./functions/activity');
var wordLookup = require('./functions/word-lookup');
var dictionary = require('./functions/dictionary');
var games_synonyma = require('./functions/games_synonyma');
var games_stats = require('./functions/games_stats');
var trending_category = require('./functions/trending_category');
var my_populer_category = require('./functions/my_populer_category');
var analysis = require('./functions/analysis');
var admin = require('./functions/admin');

var googleuseroauth = require('./functions/google_oauth');

//Analysis data
app.get('/category-users', AUTH.auth, analysis.category_users);
app.get('/category-age-levels', AUTH.auth, analysis.category_age_levels);
app.get('/timespent-age-levels', AUTH.auth, analysis.timespent_age_levels);
//app.get('/word-lookups-timespent', AUTH.auth, analysis.wordLookups);
//Get admin data
app.get('/admin', AUTH.auth, admin.read);
//Get trending category
app.get('/trending-category', AUTH.auth, trending_category.read);
//Get my popular category
app.get('/my-populer-category', AUTH.auth, my_populer_category.read);

// ACTIVITY ROUTES
app.post('/activity', AUTH.auth, activity.create);
app.get('/activity/:id', AUTH.auth, activity.read);

// WORD LOOKUP
app.post('/word-lookup', AUTH.auth, wordLookup.create);
app.get('/word-lookup/:id', AUTH.auth, wordLookup.read);
app.post('/word-lookup/:id', AUTH.auth, wordLookup.update);
app.delete('/word-lookup/:id', AUTH.auth, wordLookup.delete);

// MEMBERSHIP Routes
app.post('/member/register', member.register);
app.post('/member/login', passport.authenticate('local'), member.login);
app.get('/member/loggedin', member.loggedin);
app.post('/member/logout', function (req, res, next) {
	oauth2Client.setCredentials(null);
	next();
}, member.logout);
app.post('/member/forgot', member.forgot);

// USER Routes
app.get('/user/activity', AUTH.auth, user.activity);
app.get('/user/word-lookup', AUTH.auth, user.lookup);
app.get('/user/word-lookup/books', AUTH.auth, user.books);

// GAME Routes
app.get('/games/synonyma/question/:level/:count', AUTH.auth, games_synonyma.getQuestion);
app.post('/games/synonyma/response', AUTH.auth, games_synonyma.saveResponse);

// game stats
app.get('/games/stats/:action/:game', AUTH.auth, games_stats.read);
app.post('/games/stats/:action/:game', AUTH.auth, games_stats.create);

// DICTIONARY
app.get('/dictionary/:word', dictionary.lookup);

//Oauth Routes
//static route
app.use(express.static(__dirname + '/public'));

app.get('/googleauth', function (req, res, next) {
	res.sendfile('public/index.html');
});
var oAuthRes = null;
app.post('/googleauth', function (req, res, next) {
	//console.log(req.body);
	oAuthRes = null;
	oAuthRes = req.body;
	res.status(200).end();
	res.json(true);
});
//use for string content check
if (!('contains' in String.prototype)) {
	String.prototype.contains = function (str, startIndex) {
		return ''.indexOf.call(this, str, startIndex) !== -1;
	};
}

app.post('/member/getOaut', function (req, res, next) {
	if (oAuthRes) {
		if (oAuthRes.urlseg) {
			res.oAuthResParams = oAuthRes.urlseg;
			next();
		} else {
			res.status(200);
			res.json({
				logged: false
			});
		}
	} else {
		res.status(200);
		res.json({
			logged: false
		});
	}
}, googleuseroauth.getUrlParams, function (req, res, next) {
	getAccessToken(oauth2Client, res.urlParams.code, function () {
		var usrProfile = {};
		// retrieve user profile
		plus.people.get({
			userId: 'me',
			auth: oauth2Client
		}, function (err, profile) {
			if (err) {
				console.log('An error occured', err);
				res.status(200);
				res.json({
					logged: false
				});
				return;
			} else {
				usrProfile.token = oauth2Client.credentials.refresh_token;
				usrProfile.name = profile.displayName;
				usrProfile.email = profile.emails[0].value;
				usrProfile.gender = profile.gender ? (profile.gender == 'male' ? 'M' : 'F') : 'M';
				res.profile = usrProfile;
				next();
			}
		});
	});
}, googleuseroauth.getUserProfile);
//Get ggl access token
function getAccessToken(oauth2Clnt, code, callback) {
	// request access token
	oauth2Clnt.getToken(code, function (err, tokens) {
		console.log('tokens=', tokens);
		// set tokens to the client
		if (tokens) {
			oauth2Clnt.setCredentials(tokens);
			callback();
		}
		
	});
}

// Handle uploads through client
app.post('/uploadtodrive', multipartMiddleware, function (req, res) {
	flow.post(req, function (status, filename, original_filename, identifier) {
		if (status === 'done') {
			var s = fs.createWriteStream('./tmp/' + filename);
			s.on('error', function (error) {
				console.log("Caught::", error);
			});
			s.on('finish', function () {
				//Upload to Gdrive
				drive.files.insert({
					resource: {
						title: filename,
						mimeType: 'application/epub+zip'
					},
					media: {
						mimeType: 'application/epub+zip',
						body: fs.createReadStream('tmp/' + filename)
					},
					auth: oauth2Client
				}, function (err, response) {
					//Remove file from tmp after 15s
					setTimeout(function () {
						fs.unlinkSync('./tmp/' + filename);
					}, 15000);
					res.send(200, {
						// NOTE: Uncomment this funciton to enable cross-domain request.
						'Access-Control-Allow-Origin': '*'
					});
				});
			});
			flow.write(identifier, s, {
				end: true,
				onDone: flow.clean
			});
		}

	});
});
// Gdrive upload,Handle status checks on chunks
app.get('/uploadtodrive', function (req, res) {
	flow.get(req, function (status, filename, original_filename, identifier) {
		console.log('GET', status);
		res.send(status == 'found' ? 200 : 404);
	});
});
//Read ebubs from google drive
app.get('/readGdrive', function (req, res) {
	drive.files.list({
		q: "mimeType='application/epub+zip'",
		auth: oauth2Client
	}, function (err, response) {
		//console.log('response=', response.items);

		var result = [];
		_.forEach(response.items, function (file) {
			result.push({
				id: file.id,
				title: file.title,
				iconLink: file.iconLink,
				selfLink: file.selfLink,
				downloadUrl: file.downloadUrl,
				webContentLink: file.webContentLink,
				fileSize: file.fileSize,
				token: oauth2Client.credentials.access_token
			});
		});
		res.status(200);
		res.contentType('application/json');
		res.send(JSON.stringify(result));
	});
});
//Download ebubs from google drive
app.post('/downloadGdrive', function (req, res) {
	var file = req.body;
	if (file.downloadUrl) {
		var accessToken = oauth2Client.credentials.access_token;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', file.downloadUrl);
		xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
		xhr.onload = function () {
			callback(xhr.responseText);
		};
		xhr.onerror = function () {
			callback(null);
		};
		xhr.send();
	} else {
		callback(null);
	}
	res.status(200);
});

// Server is starting, hold on!
var server = http.createServer(app);

server.listen(process.env.VCAP_APP_PORT || 3000, function () {

	console.log('Express server listening on port ' + app.get('port'));

	// start socket
	socket.init(server);

});