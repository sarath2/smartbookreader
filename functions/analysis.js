var db = require('../lib/db.js');
var resultModel = require('../lib/models/result.js');
var _ = require('lodash');

exports.category_users = function (req, res) {
	db.execute("select category,count(user_id)as count from ( select category,user_id from activity where category is not null and category <>'NO_CATEGORY' group by category,user_id) A group by category order by count desc limit 10", function (err, result) {
		if (err) {
			res.send(500, new resultModel.result(false, {}, 'Error while getting activity!'));
		} else {
			res.send(new resultModel.result(true, result));
		}
	});
};
exports.category_age_levels = function (req, res) {
	db.execute("select category,age_level,count(user_id) as count from activity where category is not null and age_level is not null and category <>'NO_CATEGORY' group by category,age_level order by category", function (err, result) {
		if (err) {
			res.send(500, new resultModel.result(false, {}, 'Error while getting activity!'));
		} else {
			res.send(new resultModel.result(true, result));
		}
	});
};
exports.timespent_age_levels = function (req, res) {
	//	db.execute("select category,count(user_id)as count from ( select category,user_id from activity where category is not null and category <>'NO_CATEGORY' group by category,user_id) A group by category order by count desc limit 10", function (err, result) {
	//		if (err) {
	//			res.send(500, new resultModel.result(false, {}, 'Error while getting activity!'));
	//		} else {
	//			_.forEach(result, function(res){
	//				console.log(res);
	//			});
	//		}
	//	});
//	db.execute("select user_id,book_name,category,age_level,activity_type_id,activity_created_time from activity where category is not null and age_level is not null and category <>'NO_CATEGORY'", function (err, result) {
//		if (err) {
//			res.send(500, new resultModel.result(false, {}, 'Error while getting activity!'));
//		} else {
//			res.send(new resultModel.result(true, result));
//		}
//	});
		db.execute("select a.user_id,a.book_name,a.category,a.age_level,a.activity_type_id,a.activity_created_time,w.lookupWordsCount from activity a left join (SELECT user_id,book_name,count(word_lookup_word) lookupWordsCount FROM word_lookup group by user_id,book_name) w on a.user_id = w.user_id and a.book_name = w.book_name where a.category is not null and a.age_level is not null and a.category <>'NO_CATEGORY'", function (err, result) {
		if (err) {
			res.send(500, new resultModel.result(false, {}, 'Error while getting activity!'));
		} else {
			res.send(new resultModel.result(true, result));
		}
	});
};
//exports.wordLookups = function (req, res) {
//	db.execute("select a.user_id,a.book_name,a.category,a.age_level,a.activity_type_id,a.activity_created_time,w.lookupWordsCount from activity a left join (SELECT user_id,book_name,count(word_lookup_word) lookupWordsCount FROM word_lookup group by user_id,book_name) w on a.user_id = w.user_id and a.book_name = w.book_name where a.category is not null and a.age_level is not null and a.category <>'NO_CATEGORY'", function (err, result) {
//		if (err) {
//			res.send(500, new resultModel.result(false, {}, 'Error while getting activity!'));
//		} else {
//			res.send(new resultModel.result(true, result));
//		}
//	});
//};