const fs = require('fs');
module.exports = {
    writeJsonFile: function (filename, jsonData) {
       fs.writeFileSync(filename, JSON.stringify(jsonData, null, '  '));
       console.log('data saved in ' + filename);
    },
    customError: function (message, code) {
        const error = {
            status: 'ko',
            message: message,
            code: code
        };
        console.log(error);
        this.writeJsonFile('error.json', error);
        process.exit(1);
    }
};