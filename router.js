var Controllers = require('./controllers/Controllers');

module.exports = function(app) {

    // Main Routes
    app.get('/', Controllers.Home);

};