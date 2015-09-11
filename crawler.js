var eventproxy = require('eventproxy');
var request = require('request');
var cheerio = require('cheerio');

var config = require('config');

var crawler_headers = config.crawler_headers;
var commit_url_prefix = config.commit_url_prefix;
var uesr_url_prefix = config.uesr_url_prefix;


var fetch_user_detail = function (url, done) {
    request({url: url, headers: crawler_headers}, function (err, res, body) {
        console.log('Fetching contributer detail: '+ url);
        if (err) {
            console.error(err);
            return done(err, null);
        }

        console.log('Contributer detail fetched: '+ url);

        var $ = cheerio.load(res.body.toString());
        var detail = {};
        detail.name = $("[itemprop='name']").text();
        detail.additionalName = $("[itemprop='additionalName']").text();
        detail.worksFor = $("[itemprop='worksFor']").text();
        detail.homeLocation = $("[itemprop='homeLocation']").text();
        detail.email = $('.email').text();


        // console.log(detail);
        return done(null, detail);
    });
};

var fetch_contributor_detail_with_commit_id = function (user_info, done) {
    var url = commit_url_prefix + user_info.commit_id;
    // console.log('fetch_contributor_detail_with_commit_id: ', url);
    request({url: url, headers: crawler_headers}, function (err, res, body) {
        if (err) {
            console.error(err);
            return done(err, {  name: user_info.name,
                                additionalName: user_info.name,
                                worksFor:'',
                                homeLocation: '',
                                email: user_info.email});
        } else {
            var $ = cheerio.load(res.body.toString());
            var author_user_name = $('.author-name').children('a').first().text()
            // console.log('author_user_name: ', author_user_name);
            if (author_user_name != '') {
                return fetch_user_detail(uesr_url_prefix + author_user_name, function (err, detail) {
                    return done(err, detail);
                });
            }

            var detail = {};
            detail.name = user_info.name;
            detail.additionalName = $("[itemprop='additionalName']").text();
            detail.worksFor = '';
            detail.homeLocation = '';
            detail.email = user_info.email;

            return done(null, detail);
        }
    });
};

module.exports = {
    fetch_contributor_detail_with_commit_id: fetch_contributor_detail_with_commit_id
};