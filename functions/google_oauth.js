var db = require('../lib/db.js');
var resultModel = require('../lib/models/result.js');
var crypto = require('crypto');

exports.getUrlParams = function (req, res, next) {
	var dataAr = {};
	if (res.oAuthResParams) {
		var splitChr = '?'; //use for code
		if (res.oAuthResParams.contains('#')) {
			splitChr = '#'; //use for token
		}
		var stateStr = (res.oAuthResParams.split(splitChr)[1]).split('&');
		dataAr.logged = true;
		stateStr.forEach(function (obj) {
			var itm = obj.split('=');
			switch (itm[0]) {
			case 'state':
				dataAr.state = itm[1];
				break;
			case 'code':
				dataAr.code = itm[1];
				break;
			case 'access_token':
				dataAr.access_token = itm[1];
				break;
			case 'token_type':
				dataAr.token_type = itm[1];
				break;
			case 'expires_in':
				dataAr.expires_in = itm[1];
				break;
			}
		});
	} else {
		dataAr.logged = false;
	}
	res.urlParams = dataAr;
	next();
};
//get user profile
exports.getUserProfile = function (req, res) {
	res.status(200);
	var uMail = res.profile.email;
	db.execute('SELECT * FROM user WHERE oauth_email = ?', [uMail], function (err, result) {
		if (err) {
			res.json({
				logged: false
			});
		} else {
			if (result.length === 0) {
				var newPassword = generatePassword();
				var newHashedPassword = crypto.createHash('md5').update(newPassword).digest('hex');
				//for new user
				var user = {
					user_first_name: res.profile.name.split(" ")[0],
					user_last_name: res.profile.name.split(" ")[1],
					user_email: uMail,
					user_password: newHashedPassword,
					user_gender: res.profile.gender,
					oauth_email: uMail,
					user_created_date: new Date()
				};
				if (res.profile.token) {
					user.oauth_taken = res.profile.token;
				}
				db.execute('SELECT * FROM user WHERE user_email = ?', [user.user_email], function (err, result) {
					if (err) {
						res.json({
							logged: false
						});
					} else {
						// if no user with given email
						if (result.length == 0) {
							db.execute('INSERT INTO user SET ?', user, function (err, result) {
								if (err) {
									res.json({
										logged: false
									});
								} else {
									user.user_id = result.insertId;
									res.profile.logged = true;
									res.json(res.profile);
								}
							});
						} else {
							res.json({
								logged: false
							});
						}
					}
				});
			} else {
				//if user already exists
				res.profile.logged = true;
				res.json(res.profile);
			}
		}
	});
};

// create new user
exports.registerMember = function (req, res) {

};

function generatePassword() {
	var text = "";
	var possible = "abcdefghijklmnopqrstuvwxyz";
	for (var i = 0; i < 6; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
}