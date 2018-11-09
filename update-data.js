var fs = require('fs');
const chalk = require('chalk');

const key = 'xc52ew92dm2rvrspswxyg4ua6j2cd7rb';
let server = 'sargeras';
let local = 'fr_FR';

const TIMER = 20 * 1000;
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
            res.on('end', () => {
                try {
                    resolve(JSON.parse(bodyChunks.join('')));
                } catch (e){
                    reject(e);
                }
                
            })
        });
        req.on('error', err => reject(err))
    });

}

function loadFile(fileName, apiUrl) {

    return new Promise((resolve, reject) => {
        getData(apiUrl)
            .then((data) => {
                getData(data.files[0].url)
                    .then((data) => {
                        writing = true;
                        dateOldFile = new Date();
                        data.server = server;
                        data.local = local;
                        data.time = dateOldFile.getTime();
                        fs.writeFile(fileName + '.json', JSON.stringify(data), 'utf8', err => {
                            if (err) {
                                reject(err);
                            } else {
                                console.log(chalk.green('FILE GENERATED'));
                                resolve(data);
                            }
                        });
                    })
                    .catch(err => {
                        reject(err);
                    });
            })
            .catch((err) => {
                console.error(chalk.red('Cant get to api'), apiUrl);
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

module.exports = (params) => {

    if(params) {
        if(params.server) {
            server = params.server;
        }
    
        if(params.local) {
            local = params.local;
        }
    }


    const fileName = './datas/'+server + '-' + local;
    const apiUrl = 'https://eu.api.battle.net' + '/wow/auction/data/' + server + '?locale=' + local + '&apikey=' + key;

    return new Promise((resolve, reject) => {
        if (fs.existsSync(fileName + '.json')) {
            let data = fs.readFileSync(fileName + '.json');
            var jsonContent = JSON.parse(data);
            const actual = new Date();
            const diffTime = Math.abs(dateOldFile.getTime() - actual.getTime());

            if (diffTime > TIMER) {
                console.log('UPDATING FILE');
                //fs.rename(fileName + '.json', fileName + '_old.json', () => {});
                loadFile(fileName, apiUrl)
                    .then(resolve);
            } else {
                resolve(jsonContent);
            }
        } else {
            console.log('LOADING FILE');
            loadFile(fileName, apiUrl)
                .then(resolve);
        }
    });
}