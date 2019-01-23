const tools = require('./global-tools');
module.exports = {
    trim: function (value) {
        tools.typeCheck('string', value);
        return value.trim()
    },
    priceToFloat: function (value) {
        tools.typeCheck('string', value);
        return parseFloat(value.replace(',', '.').replace(/[^0-9.]/g, ''))
    },
    extractDate: function (value) {
        tools.typeCheck('string', value);

        let dates = [];
        value.replace(/([0-9]{2}\/[0-9]{2}\/[0-9]{4})/g, async function (match, p1) {
            await dates.push(p1)
        });

        return dates;
    },
    formatDate: function (value) {
        if (Array.isArray(value) === false) {
            tools.customError('array expected!', 400)
        }

        let i = 0;
        const dates = [];
        while (i < value.length) {
            let dateArray = value[i].split('/');
            const d = new Date(Date.UTC(dateArray[2], dateArray[1], dateArray[0], 0, 0, 0, 0));
            dates.push(d);
            i++
        }

        return dates;
    },
    formatHour: function (value) {
        tools.typeCheck('string', value);
        return value.replace('h', ':')
    },
    passengersAge: function (value) {
        tools.typeCheck('string', value);
        return value.replace(/(.*)(\(.*\))/, '$2')
    },
    ticketType: function (value) {
        tools.typeCheck('string', value);
        if (value.indexOf('Billet échangeable')) {
            return 'échangeable';
        }
        return value;
    },
    extractNumber: function (value) {
        tools.typeCheck('string', value);
        let num = value.replace(/[^0-9]/g, '');
        return parseInt(num);
    }
};