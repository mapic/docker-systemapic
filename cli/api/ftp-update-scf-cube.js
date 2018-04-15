const jsftp = require("jsftp");
const async = require('async');
const _ = require('lodash');
const supertest = require('supertest');
const api = supertest('https://' + process.env.MAPIC_API_DOMAIN);
const moment = require('moment');
const fs = require('fs');
const path = require('path');

// connect
const ftp = new jsftp({
  host: process.env.MAPIC_FTP_HOST, // Host name for the current FTP server.
  port: process.env.MAPIC_FTP_PORT, // Port number for the current FTP server (defaults to 21).
  user: process.env.MAPIC_FTP_USER, // Username
  pass: process.env.MAPIC_FTP_PASS, // Password
});


const PATTERN = 'SCF_MOD_';
const DATE_PATTERN = 'YYYYMMDD';
const CUBE_ID = "cube-c47bc1da-2cdb-40a5-983c-e656a916060b";
var cube_object = {};

var access_token = '';
var filtered_files = [];
var filtered_date_files = [];
var ftp_files = [];
var scf = {};
var ops = [];

ops.push(function (callback) {
    api.get('/v2/users/token')
    .query({
        username : process.env.MAPIC_API_USERNAME,
        password : process.env.MAPIC_API_AUTH,
    })
    .send()
    .end(function (err, res) {
        if (err) return callback(err);
        var tokens = JSON.parse(res.text);
        access_token = tokens.access_token;
        console.log('access_token', access_token);
        callback();
    });
});

ops.push(function (callback) {
    ftp.ls(".", callback);
});

ops.push(function (files, callback) {

    ftp_files = files;

    files.forEach(function (f) {

        // filter out only relevant files
        if (_.includes(f.name, PATTERN)) {
            filtered_files.push(f.name);
        }

    });

    callback(null);
});

ops.push(function (callback) {

    // get cube
    api.get('/v2/cubes/get')
    .query({
        access_token : access_token,
        cube_id : CUBE_ID
    })
    .end(function (err, res) {
        if (err) return callback(err);
        var cube = res.body;
        cube_object = cube;
        callback(null, cube);
    });

});

ops.push(function (cube, callback) {

    var datasets = cube.datasets;

    // get last dataset
    var last = datasets.reverse()[0];
    var last_filename = last.description;
    var date_string_1 = last_filename.split(PATTERN)[1];
    var date_string = date_string_1.split('.tif')[0];
    var last_date = moment(date_string, DATE_PATTERN);

    // find files in ftp which are AFTER the last date in dataset
    filtered_files.forEach(function (f) {

        var date_string_1 = f.split(PATTERN)[1];
        var date_string = date_string_1.split('.tif')[0];
        var ff_date = moment(date_string, DATE_PATTERN);

        // query
        if (ff_date.isAfter(last_date)) {
            filtered_date_files.push(f);
        }
    });

    callback();
});

ops.push(function (callback) {

    // for each file
    async.eachSeries(filtered_date_files, function (file, done) {

        // download file
        ftp.get(file, '/tmp/' + file, function (err) {
            
            if (err) {
                console.error("There was an error retrieving the file.");
                return done(err);
            }

            // upload dataset
            api.post('/v2/data/import')
            .type('form')
            .field('access_token', access_token)
            .field('data', fs.createReadStream(path.resolve('/tmp/' + file)))
            .end(function (err, res) {
                if (err) {
                    console.log('post/import err:', err);
                    return done(err);
                }
                var status = res.body;

                // test data
                var data = {
                    access_token : access_token,
                    cube_id : CUBE_ID,
                    datasets : [{
                        id : status.file_id,
                        description : file,
                        timestamp : moment().format()
                    }]
                }

                // add dataset to cube
                api.post('/v2/cubes/add')
                .send(data)
                .end(function (err, res) {
                    if (err) return done(err);
                    var cube = res.body;
                    done();
                });
            });
        });

    // final callback
    }, callback);

});


// get SCF JSON data file from ftp
ops.push(function (callback) {

    // for each of masks in cube

    var cube = cube_object;

    var mask_names = [];
    var filtered_mask_names = [];
    cube.masks.forEach(function (m) {
        mask_names.push('mask-' + m.meta.title + '.scf.json');
    });

    ftp_files.forEach(function (f) {

        if (_.includes(mask_names, f.name)) {
            filtered_mask_names.push(f.name);
        }
    });

    // for each file
    async.eachSeries(filtered_mask_names, function (file, done) {

        // download file
        var filepath = '/tmp/' + file;
        ftp.get(file, filepath, function (err) {

            var scf_file = fs.readFileSync(filepath, 'utf-8');

            scf[file] = scf_file;

            done();
        });
    }, callback);


});

ops.push(function (callback) {


    _.each(scf, function (value, key) {

        var scf_data = JSON.parse(value);
        var scf_filename = key;
        var mask_name_1 = key.split('mask-')[1];
        var mask_name = mask_name_1.split('.scf.json')[0];

        _.each(cube_object.masks, function (v, idx) {
        
            if (v.meta.title == mask_name) {

                // check if same
                var original_data = JSON.stringify(cube_object.masks[idx].data);
                var new_data = JSON.stringify(scf_data);

                if (original_data != new_data) {
                    cube_object.masks[idx].data = scf_data;
                }

            }

        })

    });


    callback();
});

ops.push(function (callback) {
    // save cube with new data...
    async.eachSeries(cube_object.masks, function (m, done) {

        // update cube mask
        api.post('/v2/cubes/updateMask')
        .send({
            access_token : access_token,
            cube_id : CUBE_ID,
            mask : m
        })
        .end(done);
    }, callback);
});


async.waterfall(ops, function (err) {
    console.log('async done', err);
    process.exit();
});




















