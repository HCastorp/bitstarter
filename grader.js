#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing
*/

var fs = require('fs');
var rest = require('restler');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

//var cheerioHtmlFile = function(htmlfile) {
//    return cheerio.load(fs.readFileSync(htmlfile));
//};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var cheerioHtml = function(html) {
    return cheerio.load(html);
};

var checkHtmlFile = function(htmlfile, checksfile) {
    var rawHtml = fs.readFileSync(htmlfile);
    var $ = cheerioHtml(rawHtml);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for (var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
};

var checkHtml = function(html, checksfile) {
    $ = cheerioHtml(html);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for (var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
};

var checkFile = function(filename, checksfile) {
    var html = fs.readFileSync(filename);
    return checkHtml(html, checksfile);
};

var checkURL = function(URL, checksfile) {
    rest.get(URL).on('complete', function(result) {
	if (result instanceof Error) {
	    console.log('Error: ' + result.message);
	} else {
	    callback(result);
	}
    });
    var callback = function(result) {
	var checkJson = checkHtml(result, checksfile);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
    };
};

var clone = function(fn) {
    // workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
	.option('-c, --checks <check_file.', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
	.option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
	.option('-u, --url <url>', 'url to check')
	.parse(process.argv);
    console.log(program.url);
    if(program.url) {
	checkURL(program.url, program.checks);
    } else {
	var checkJson = checkFile(program.file, program.checks);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
    }
} else {
    exports.checkHtmlFile = checkFile;
}
