const Xray = require('x-ray'); // scraping tool working with nodejs
const path = require('path');
const fs = require('fs');
const read = fs.readFileSync;

const filters = require('./filters');
const tools = require('./global-tools');

// 1) first we clean the html to be able to work with
const corruptedHtml = read(path.resolve(__dirname, 'test.html'));
const cleanHtml = corruptedHtml.toString().replace(/\\"/gm, '"');

const x = Xray({
    filters: {
        trim: filters.trim,
        priceToFloat: filters.priceToFloat,
        extractDate: filters.extractDate,
        formatDate: filters.formatDate,
        formatHour: filters.formatHour,
        passengersAge: filters.passengersAge,
        ticketType: filters.ticketType,
        extractNumber: filters.extractNumber,
    }
});

// 2) then we scrap the data needed from the html file
x(cleanHtml, {
        "result": x('#main-column', {
                totalPrice: 'table.total-amount td.very-important | priceToFloat',
                kindOfTrip: x('.product-header', ['.product-type img@alt']
                ),
                travelDate: x('.pnr-summary', ['.pnr-summary | extractDate | formatDate']
                ),
                pnr: x('#block-travel td.digital-box-cell table.block-pnr', [{
                    code: '.pnr-ref span | trim',
                    name: '.pnr-name span | trim',
                }]),
                trains: x('.product-details', [
                    {
                        typeAndId: ['td.segment:not(.segment-departure) | trim'],
                        times: ['.origin-destination-hour | formatHour | trim'],
                        stations: ['.origin-destination-station | trim']
                    }
                ]),
                trainAmount: ['table.product-header tr td:nth-child(7) | priceToFloat'],
                otherAmount: ['.amount | priceToFloat'],
                passengers: x('#block-command .passengers tr', [{
                        age: 'td.typology | passengersAge | trim',
                        num: 'td.typology strong | extractNumber',
                        type: 'td.fare-details | ticketType'
                    }]
                ),
            }
        )
    }
)((err, scrapedData) => {
    // 3) now we have all the data needed, so only things left are to check the datas integrities and saved it to the desired format

    /**
     * INTEGRITY CHECK
     */
    // if the number of round-trip is different from the number of round-trip date
    if (scrapedData.result.kindOfTrip.length !== scrapedData.result.travelDate.length) {
        tools.customError('Number of travel  date doesn\'t match number of trip', 400);
    }
    // if one of the trip is not a round-trip
    scrapedData.result.kindOfTrip.forEach((value) => {
        if (value !== 'Train Aller-retour') {
            tools.customError('This script only support round-trip at the moment !', 400);
        }
    });
    // or if it's a round trip but we only got one date
    scrapedData.result.travelDate.forEach((value) => {
        if (value.length !== 2) {
            tools.customError('Should be 2 dates for a round-trip order', 400);
        }
    });
    // etc...

    /**
     * FORMATING THE DATA
     */
    const formatedData = {
        "status": "ok",
        "result": {
            "trips": []
        }
    };
    const nbPnrInfo = scrapedData.result.pnr.length;
    const pnrInfo = scrapedData.result.pnr[nbPnrInfo - 1];
    const oneOrder = {
        code: pnrInfo.code,
        name: pnrInfo.name,
        details: {
            price: scrapedData.result.totalPrice
        }
    };
    const roundTrip = [];

    let i = 0;
    while (i < scrapedData.result.kindOfTrip.length) { // loop on the round-trips
        let k = 0;
        while (k < scrapedData.result.travelDate[i].length) { // loop on the date of each round-trip
            let oneRoundTrip = {
                type: k % 2 ? 'Retour' : 'Aller',
                date: scrapedData.result.travelDate[i][k],
                trains: [
                    {
                        departureTime: scrapedData.result.trains[0].times[0],
                        departureStation: scrapedData.result.trains[0].stations[0],
                        arrivalTime: scrapedData.result.trains[0].times[1],
                        arrivalStatio: scrapedData.result.trains[0].stations[1],
                        type: scrapedData.result.trains[0].typeAndId[0],
                        number: scrapedData.result.trains[0].typeAndId[1]
                    }
                ]
            };

            scrapedData.result.trains.splice(0, 1);

            let l = 0;
            let passengers = [];
            let passengersNum = 0;
            while (l < scrapedData.result.passengers.length) {
                if (typeof scrapedData.result.passengers[l].age === 'undefined') {
                    scrapedData.result.passengers.splice(l, 1);
                    continue;
                }
                if (passengersNum <= scrapedData.result.passengers[l].num) {
                    passengersNum = scrapedData.result.passengers[l].num;
                    passengers.push({
                        type: scrapedData.result.passengers[l].type,
                        age: scrapedData.result.passengers[l].age,
                    });
                    scrapedData.result.passengers.splice(l, 1);
                } else {
                    break
                }
                l++
            }
            oneRoundTrip.trains[0].passengers = passengers;
            roundTrip.push(oneRoundTrip);
            k++
        }
        i++
    }

    let prices = [];
    scrapedData.result.trainAmount.forEach((price) => {
        prices.push({value: price});
    });
    scrapedData.result.otherAmount.forEach((price) => {
        prices.push({value: price});
    });

    formatedData.result.custom = {prices: prices};

    oneOrder.details.roundTrips = roundTrip;
    formatedData.result.trips.push(oneOrder);
    tools.writeJsonFile('result.json', formatedData);
});
