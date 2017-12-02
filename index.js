'use strict';

const cluster = require('cluster');
const fs = require('fs');
const shelljs = require('shelljs');

const port = process.env.PORT || 8080;
const numberOfClusters = 100;
const recordsPerFile = 500;
const uploadToES = true;
const ES_URL = 'localhost:9200';
const ES_INDEX = 'testtt';

if (cluster.isMaster) {
    for (let i = 0; i < numberOfClusters; i++)
        cluster.fork();

    process.on('beforeExit', code => uploadToES && updateDataToES());

} else {
    const dict = fs.readFileSync('dict.txt', 'utf8').toString().split('\n');
    const workerId = cluster.worker.id;
    let data = '';

    for (let i = 0; i < recordsPerFile; i++)
        data += createFakeData(workerId, i, dict);

    !fs.existsSync('data') && fs.mkdirSync('data');

    fs.writeFile(`data/json-data-${workerId}.json`, data, 'utf8', () => {
        console.log(`json created for ${workerId}`)
        cluster.worker.destroy();
    });

}

function updateDataToES() {
    shelljs.exec(` 
    for i in $(seq ${numberOfClusters})
    do  
      echo $i
      curl -H 'Content-Type: application/x-ndjson' -XPOST '${ES_URL}/${ES_INDEX}/doc/_bulk?pretty' --data-binary @data/json-data-$i.json >/dev/null;
    done`)
}

function createFakeData(workerId, i, dict) {
    const storyLength = 20;
    const index = {
        "index": {
            "_id": `${workerId}${i}`
        }
    };

    let story = '', title = '';

    for (let i = 0; i < storyLength; i++)
        story += ' ' + dict[Math.floor(Math.random() * dict.length)];

    const body = {
        "timestamp": Math.floor(Math.random() * 39225),
        "title": dict[Math.floor(Math.random() * dict.length)] + ' ' + dict[Math.floor(Math.random() * dict.length)],
        "story": story,
        "author": dict[Math.floor(Math.random() * dict.length)] + ' ' + dict[Math.floor(Math.random() * dict.length)]
    };

    return `\n${JSON.stringify(index)}\n${JSON.stringify(body)}\n`;
}
