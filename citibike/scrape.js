var Citibike = require('citibike');
var Forecast = require('forecast.io');
var winston = require('winston');

var cb = new Citibike();
var fc = new Forecast({'APIKey': 'daf048beaacaa3a0e8bebc0133a94983'})
winston.add(winston.transports.File, { filename: '/Users/abhinav/inkingdata/citibike/bike.log' });

var MINUTE = 60000;

var interval = setInterval(function() {
	cb.getStations(null, function(data) {
		console.log(data);
	});
	fc.get(40.7142, -74.0064, function(err, res, data) {
		console.log(data);
	})
}, 10 * MINUTE);