module.exports = {
    trim: function (value) {
        return typeof value === 'string' ? value.trim() : value
    },
    priceToFloat: function (value) {
        return typeof value === 'string' ? parseFloat(value.replace(',', '.').replace(/[^0-9.]/g, '')) : value
    },
    extractDate: function (value) {
        if (typeof value !== 'string') {
            return value
        }

        let dates = [];
        value.replace(/([0-9]{2}\/[0-9]{2}\/[0-9]{4})/g, async function (match, p1) {
            await dates.push(p1)
        });

        return dates;
    },
    formatDate: function (value) {
        if (Array.isArray(value) === false) {
            return value;
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
        return typeof value === 'string' ? value.replace('h', ':') : value
    },
    passengersAge: function (value) {
        return typeof value === 'string' ? value.replace(/(.*)(\(.*\))/, '$2') : value
    },
    ticketType: function (value) {
        if (value.indexOf('Billet échangeable')) {
            return 'échangeable';
        }
        return value;
    },
    extractNumber: function (value) {
        let num = value.replace(/[^0-9]/g, '');
        return parseInt(num);
    }
};