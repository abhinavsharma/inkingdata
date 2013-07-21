var FIRST_YEAR = 1950;
var LAST_YEAR = 2012;
var request = require('request');
var driver_dump = {}

for (var i = FIRST_YEAR; i <= LAST_YEAR; i++) {
	(function(index) {
		setTimeout(function() {
			var url = 'http://ergast.com/api/f1/' + index + '/driverStandings.json';
			//console.log(url);
			request(url, function(error, response, body) {
				var data = JSON.parse(body);
				var lists = data['MRData']['StandingsTable']['StandingsLists'][0];

				var season = lists['season'];
				var standings = lists['DriverStandings'];

				
				if (!driver_dump[season]) {
					driver_dump[season] = standings;
				}
				var print_flag = true;
				for (var j = FIRST_YEAR; j <= LAST_YEAR; j++) {
					if (driver_dump[j] === undefined) {
						print_flag = false;
					}
				}
				if (print_flag) {
					console.log(JSON.stringify(driver_dump));
				}
					
			});
		}, (i - FIRST_YEAR) * 100);
	})(i);
}

