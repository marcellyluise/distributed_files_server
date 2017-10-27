exports.Home = function(request, response) {
    response.pageInfo = {};
    response.pageInfo.title = "Redes UnB";
    response.render('Home', response.pageInfo);
};

// Add the other controllers here...
/*
exports.Home = function(request, response) {
    response.pageInfo = {};
    response.pageInfo.title = "Visitante";
    response.render('Home', response.pageInfo);
};
*/