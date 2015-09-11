var fs = require('fs');
var config = require('config');

/* load configuration */
var commits_ranking_file = config.commits_ranking_file;
var user_info_json_file_name = config.user_info_json_file_name;
var orgs_ranking_output_file = config.orgs_ranking_output_file;
var orgs_mapping = config.orgs_mapping;

var commits_ranking_by_users = fs.readFileSync(commits_ranking_file).toString().split('\n');
var user_info = require('./' + user_info_json_file_name);


var orgs_ranking = {};
var unranked_data = [];


var rank_orgs = function() {
    commits_ranking_by_users.forEach(function(item) {
        if (item != '') {
            var item_values = item.replace(' ##', ', ').replace('>', '').replace(' <', ', ').split(', ');
            var commits_count = parseInt(item_values[0]);
            var user = user_info[item_values[2]];
            if (user) {
                var org = orgs_mapping[user.orgnization] || user.orgnization;
                if (orgs_ranking[org]) {
                    orgs_ranking[org].commits += commits_count;
                } else{
                    orgs_ranking[org] = {
                        commits: commits_count
                    };
                };
            } else {
                console.log(item);
                unranked_data.push(item);
            };
        }
    });

    // console.log(orgs_ranking);

    fs.writeFile(orgs_ranking_output_file, JSON.stringify(orgs_ranking, null, 4), function (err) {
        if(err) {
          console.log(err);
        } else {
          console.log("orgs_ranking saved to "+orgs_ranking_output_file);
        }
        console.log(unranked_data);
    });
};

rank_orgs();