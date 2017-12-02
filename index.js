'use strict';

var port = process.env.PORT || 8080;
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var app = require('express')();
var fs = require('fs');

if (cluster.isMaster) {
    for (var i = 0; i < 90; i++) {
        var worker = cluster.fork();
    }
} else {
    let dict = fs.readFileSync('dict.txt', 'utf8').toString().split('\n');
    let workerId = cluster.worker.id;
    let data = '';
    for (var i = 0; i < 100000; i++) {
        data += createFakeData(workerId, i, dict);
    }
    fs.writeFile(`data/myjsonfile${workerId}.json`, data, 'utf8', () => {
        var shell = require('shelljs');
        shell.cd('data');
        // shell.exec(`curl -H 'Content-Type: application/x-ndjson' -XPOST 'localhost:9200/testtt/doc/_bulk?pretty' --data-binary @myjsonfile${workerId}.json &>/dev/null`);
        console.log(`json created for ${workerId}`)
    });
}


function createFakeData(workerId, i, dict) {
    const index = {
        "index": {
            "_id": `${workerId}${i}`
        }
    };
    let story = '', title = '';

    for (let i = 0; i < 20; i++)
        story += ' ' + dict[Math.floor(Math.random() * dict.length)];

    const body = {
        "timestamp": Math.floor(Math.random() * 39225),
        "title": dict[Math.floor(Math.random() * dict.length)] + ' ' + dict[Math.floor(Math.random() * dict.length)],
        "story": story,
        "author": dict[Math.floor(Math.random() * dict.length)] + ' ' + dict[Math.floor(Math.random() * dict.length)]
    };

    return `\n${JSON.stringify(index)}\n${JSON.stringify(body)}\n`;
}
