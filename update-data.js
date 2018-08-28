const key = 'arxr7nstg8rxrn7c7ceacvy9ss83ynrq';
const server = 'sargeras';
const local = 'fr_FR';
let apiUrl = 'https://eu.api.battle.net' + '/wow/auction/data/' + server + '?locale=' + local + '&apikey=' + key;
var fs = require('fs');

const TIMER = 20 * 1000;

const chalk = require('chalk');
let dateOldFile = new Date();

function getData(apiUrl) {
    const lib = apiUrl.startsWith('https') ? require('https') : require('http');
    return new Promise((resolve, reject) => {
        const req = lib.get(apiUrl, function (res) {
            // Buffer the body entirely for processing as a whole.
            const bodyChunks = [];
            res.on('data', chunk => {
                bodyChunks.push(chunk);
            });
            res.on('end', () => resolve(JSON.parse(bodyChunks.join(''))))
        });
        req.on('error', err => reject(err))
    });

}

function loadFile() {

    return new Promise((resolve, reject) => {
        getData(apiUrl)
            .then((data) => {
                getData(data.files[0].url)
                    .then((data) => {
                        writing = true;
                        dateOldFile = new Date();
                        data.time = dateOldFile.getTime();
                        fs.writeFile(server + '-' + local + '.json', JSON.stringify(data), 'utf8', () => {
                            console.log(chalk.green('FILE GENERATED'));
                            resolve(data);
                        });
                    })
                    .catch(err => {
                        reject(err);
                    });
            })
            .catch((err) => {
                console.error(chalk.red('Cant get to api'));
            })
    });
}
const loading = () => {
    var h = ['|', '/', '-', '\\'];
    var i = 0;

    return setInterval(() => {
        i = (i > 3) ? 0 : i;
        console.clear();
        console.log(h[i]);
        i++;
    }, 300);
};

module.exports = () => {

    const fileName = server + '-' + local;

    return new Promise((resolve, reject) => {
        if (fs.existsSync(fileName + '.json')) {
            let data = fs.readFileSync(fileName + '.json');
            var jsonContent = JSON.parse(data);
            const actual = new Date();
            const diffTime = Math.abs(dateOldFile.getTime() - actual.getTime());

            if (diffTime > TIMER) {
                console.log('UPDATING FILE');
                //fs.rename(fileName + '.json', fileName + '_old.json', () => {});
                loadFile()
                    .then(resolve);
            } else {
                resolve(jsonContent);
            }
        } else {
            console.log('LOADING FILE');
            loadFile()
                .then(resolve);
        }
    });
}