var db = require('../lib/db.js');
var resultModel = require('../lib/models/result.js');

exports.read = function(req, res){
    db.execute('select U.user_id,user_email,user_first_name,user_last_name,user_created_date,A.c as activity,B.quiz_taken from user U left join (SELECT user_id , COUNT(DISTINCT book_name) AS C FROM activity GROUP BY user_id HAVING C >1) as A on U.user_id= A.user_id left join (SELECT user_id ,COUNT(DISTINCT user_id) as quiz_taken FROM word_lookup WHERE word_lookup_quiz_taken = 1) as B on U.user_id = B.user_id', function(err, result){
        if(err)
            res.send(500, new resultModel.result(false, {}, 'Error while getting activity!'));

        else{
            res.send(new resultModel.result(true, result));
        }
    });
};


