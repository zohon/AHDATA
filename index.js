const updateData = require('./update-data.js');
const fs = require("fs");
var _ = require('lodash');
const chalk = require('chalk');

let fish = require('./fish.json');
fiss = _.map(fish, item => {
    item.type = chalk.blue('fish');
    return item;
});

let cooking = require('./cooking.json');
cooking = _.map(cooking, item => {
    item.type = chalk.red('cooking');
    return item;
});

let tailor = require('./tailor.json');
tailor = _.map(tailor, item => {
    item.type = chalk.magenta('tailor');
    return item;
});

const listData = [
    ...fish,
    ...cooking,
    ...tailor
];

let oldData = [];
const TIMER = 10 * 1000;

(function start() {
    updateData()
        .then(data => {
            displayInfo(data);
            setTimeout(() => {
                start();
            }, TIMER);
        });
})();

function displayInfo(data) {
    const allJsonData = data;


    let result = _.map(listData, item => {
        const infos = getInfoItem(allJsonData, item);
        if (_.first(infos)) {
            item.nb = _.sumBy(infos, 'quantity');
            item.low = getFirstRealPrice(infos).bid;
            item.margin = getFirstRealPrice(infos).bid;
            item.cost = '';
            item.mean = getAveragePrice(infos);

            if (item.recipe) {
                const recipe = _.map(item.recipe, compo => {
                    const infosRecipe = getInfoItem(allJsonData, compo);
                    if (_.first(infosRecipe)) {
                        return Math.round(getFirstRealPrice(infosRecipe).bid * compo.quantity);
                    }
                    return 0;
                })
                
                item.mean = getAveragePrice(infos);
                item.cost = _.sum(recipe);
                item.margin = item.mean - _.sum(recipe);
            }

        }
        return item;
    })
    result = _.orderBy(result, ['margin'], ['desc']);

    const event = new Date();
    const fileDate = new Date(allJsonData.time);
    console.log('\x1Bc');
    console.log(chalk.blue(fileDate.toLocaleString()), chalk.green(event.toLocaleString()));
    console.log(chalk.yellow('-----------------------------------------------'));
    _.each(result, res => {
        const info = [res.zone, res.area, res.info];
        const display = [
            chalk.bold(res.type),
            chalk.bold(res.label),
            chalk.cyan(res.low),
            chalk.magenta(res.mean),
            chalk.red(res.cost),
            chalk.yellow(res.margin),
            chalk.green("["+res.nb+"]"),
            _.filter(info).join(' ')
        ]

        console.log(
            _.filter(display).join(' ')
        );
    });
    oldData = result;
}

function getInfoItem(allJsonData, item) {
    const fishs = _.filter(allJsonData.auctions, { item: item.id });
    const prices = _.map(fishs, fish => {
        return { bid: Math.round((fish.bid / fish.quantity) / 100) / 100, quantity: fish.quantity };
    });
    return _.orderBy(prices, ['bid', 'quantity'], ['asc', 'asc']);
}

function getFirstRealPrice(items) {
    const average = getAveragePrice(items);
    return _.find(items, item => {
        return item.bid >= average * 0.3;
    });
}


function getAveragePrice(Prices) {
    const allPrice = _.map(Prices, 'bid');
    const reduceValidPrices = filterOutliers(allPrice);
    return Math.round(_.mean(reduceValidPrices));
}

function filterOutliers(someArray) {  

    // Copy the values, rather than operating on references to existing values
    var values = someArray.concat();

    // Then sort
    values.sort((a, b) =>  a - b);

    /* Then find a generous IQR. This is generous because if (values.length / 4) 
     * is not an int, then really you should average the two elements on either 
     * side to find q1.
     */     
    var q1 = values[Math.floor((values.length / 4))];
    // Likewise for q3. 
    var q3 = values[Math.ceil((values.length * (3 / 4)))];
    var iqr = q3 - q1;

    // Then find min and max values
    var maxValue = q3 + iqr*1.5;
    var minValue = q1 - iqr*1.5;

    // Then filter anything beyond or beneath these values.
    var filteredValues = values.filter(x => (x <= maxValue) && (x >= minValue));

    // Then return
    return filteredValues;
}