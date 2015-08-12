var fs = require('fs');
var eventproxy = require('eventproxy');
var procstreams = require('procstreams');
var config = require('config');

/* load configuration */
var users_file_name = config.users_file_name;
var user_info_json_file_name = config.user_info_json_file_name;
var contributers_orgs_map = config.contributers_orgs_map;

var concurrency = config.concurrency;

var crawler = require('./crawler');
var ep = new eventproxy();

var jobs = [];
var jobs_asigned = 0;


/* ----------- custom job functions  ------------ */
jobs = fs.readFileSync(users_file_name).toString().split('\n');
// jobs = [
//         'Mike Danese <mikedanese@google.com>, 57f235a99fba2a0718638e8d2cdf779ace5f6e3d',
//         'Yifan Gu <yifan.gu@coreos.com>, b30e77c1b3ebbb031c0256e552482926d8f19949',
//         'Yifan Gu <guyifan1121@gmail.com>, 7831b7da72d64400e09dd4b797d8b5e38ad6f408',
//         'Yuki Sonoda (Yugui) <yugui@yugui.jp>, df9da65939fda9370cdc47ff90e32fe4d4c0dfb4',
//         'Yuki Yugui Sonoda <yugui@google.com>, 864bfb65da8bdefb2e01df717008e341ca80a300'
//         ];

var result = [];


ep.all('users_detail_fetched', function(data) {
    console.log(data);

});

var user_info_json = {};
var convert_user_info = function() {
    result.forEach(function (item, index) {
        // var key = item.name + ' <' + item.email + '>';
        var key = item.email;
        user_info_json[key] = item;
    });
};

var all_jobs_done_cb = function(list) {
    console.log('jobs_done: ', list);
    console.log('result: ', result);
    convert_user_info();
    fs.writeFile(user_info_json_file_name, JSON.stringify(user_info_json, null, 4), function (err) {
        if(err) {
          console.log(err);
        } else {
          console.log("JSON saved to result.json");
        }
        ep.emit('users_detail_fetched', user_info_json);
    });
};

var each_job_done_cb = function(job_id, next) {
    if (jobs[job_id] != '') {
        var item_values = jobs[job_id].replace('>', '').replace(' <', ', ').split(', ');
        var tmp_user_info = {
            name: item_values[0],
            email: item_values[1],
            commit_id: item_values[2]
        };

        crawler.fetch_contributor_detail_with_commit_id(tmp_user_info, function (err, detail) {

            detail.name = detail.name || tmp_user_info.name;
            detail.additionalName = detail.additionalName || tmp_user_info.name;
            detail.worksFor = detail.worksFor || '';
            detail.homeLocation = detail.homeLocation || '';
            detail.email = tmp_user_info.email;

            detail.orgnization = 'independent';
            if (detail.worksFor != '') {
                detail.orgnization = detail.worksFor;
            } else {
                detail.orgnization = detail.email.split('@')[1];
            }

            if (contributers_orgs_map[detail.additionalName] != null) {
                detail.orgnization = contributers_orgs_map[detail.additionalName];
            }

            result[job_id] = detail;
            next(job_id);
        });        
    } else{
        next(job_id);
    };
};
/* ----------- custom job functions  ------------ */

var process_next_job = function(job_id) {
    // console.log(data);
    console.log('job_id: ' + job_id + ' done.');
    ep.emit('job_done', job_id);

    // for next job
    if (jobs_asigned >= jobs.length) {
        return ;
    } else{
        job_id = jobs_asigned;
        start(job_id);
    };
};



ep.after('job_done', jobs.length, function(list) {
    all_jobs_done_cb(list);
});

var start = function (job_id) {
    if (jobs_asigned >= jobs.length) {
        return ;
    }

    // console.log('job_id: ' + job_id + ' started, data: '+ jobs[job_id]);
    jobs_asigned++;
    each_job_done_cb(job_id, process_next_job);


};


/* start crawler with 20 workers */
for (var i = concurrency - 1; i >= 0; i--) {
    start(jobs_asigned);
};

