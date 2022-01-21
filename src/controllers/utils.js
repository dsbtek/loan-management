const currency = require('../utilities/currency');

class Utilities {
    getCurrencies(req, res){
        try {
            res.send({currency});
        } catch (error) {
            res.processError(400, 'Error fetching currency list', error);
        }
    }

}

module.exports = new Utilities();