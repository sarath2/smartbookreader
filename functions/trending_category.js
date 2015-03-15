var db = require('../lib/db.js');
var resultModel = require('../lib/models/result.js');

exports.read = function(req, res){
    db.execute("select category,count(category) count from (select category, book_name from activity where category is not null and category <>'NO_CATEGORY' group by category, book_name) A where category is not null and category <>'NO_CATEGORY' group by category order by count desc limit 10", function(err, result){
        if(err)
            res.send(500, new resultModel.result(false, {}, 'Error while getting activity!'));

        else{
            res.send(new resultModel.result(true, result));
        }
    });
};


