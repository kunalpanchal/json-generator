'use strict';

const cluster = require('cluster');
const fs = require('fs');
const shelljs = require('shelljs');

require('dotenv').config()

if (cluster.isMaster) {
    for (let i = 0; i < process.env.numberOfClusters; i++)
        cluster.fork();

    process.on('beforeExit', code => process.env.uploadToES && updateDataToES());

} else {
    const dict = fs.readFileSync('dict.txt', 'utf8').toString().split('\n');
    const workerId = cluster.worker.id;
    let data = '';

    for (let i = 0; i < process.env.recordsPerFile; i++)
        data += createFakeData(workerId, i, dict);

    !fs.existsSync('data') && fs.mkdirSync('data');

    fs.writeFile(`data/json-data-${workerId}.json`, data, 'utf8', () => {
        console.log(`json created for ${workerId}`)
        cluster.worker.destroy();
    });

}

function updateDataToES() {
    shelljs.exec(` 
    for i in $(seq ${process.env.numberOfClusters})
    do  
      echo $i
      curl -H 'Content-Type: application/x-ndjson' -XPOST '${process.env.ES_URL}/${process.env.ES_INDEX}/doc/_bulk?pretty' --data-binary @data/json-data-$i.json >/dev/null;
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
