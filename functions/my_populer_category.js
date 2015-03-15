var db = require('../lib/db.js');
var resultModel = require('../lib/models/result.js');

exports.read = function(req, res){
	 var user_id = req.user.result.user_id;
    db.execute('select category,count(category) count from activity where category is not null and user_id = ? group by category', [user_id], function(err, result){
        if(err)
            res.send(500, new resultModel.result(false, {}, 'Error while getting activity!'));

        else{
            res.send(new resultModel.result(true, result));
        }
    });
};


