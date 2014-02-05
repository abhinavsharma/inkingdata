var senses = ['touch', 'sight', 'smell', 'sound', 'taste'];

var sanitizeData = function(data) {
  return _.map(data, function(row) {
    var processedRow = {
      'experience': row['gsx$experience']['$t'],
    };
    _.map(senses, function (sense) {
      processedRow['rate-' + sense] = parseInt(row['gsx$rate-' + sense]['$t']);
      processedRow['occ-' + sense] = row['gsx$occ-' + sense]['$t'] === 'Y' ? 
        true : false;
    });
    processedRow['locations'] = row['gsx$locations']['$t'].split(',');
    return processedRow;
  });
};

var generateClusters = function(data) {
  var exploded = _.flatten(_.map(data, function(row) {
    return _.map(row.locations, function(location) {
      row['location'] = location;
      return row;
    })
  }));
  return _.groupBy(exploded, 'location');
};

var createTable = function(dataGroup) {
  var $table = $('<table></table>');
  $table.width('100%');
  var $thead = $('<thead></thead>');
  var $tbody = $('<tbody></tbody>');
  var $headrow = $('<tr><td>Experience</td></tr>');
  _.each(senses, function(sense) {
    $headrow.append($('<td>' + sense + '</td>'));
  })

  _.each(dataGroup, function(row) {
    var $bodyrow = $('<tr><td>' + row.experience + '</td></tr>');
    _.each(senses, function(sense) {
      $bodyrow.append('<td>' + row['rate-' + sense]+ '</td>');
    });
    $tbody.append($bodyrow);
  })
  $thead.append($headrow);
  $table.append($thead);
  $table.append($tbody);
  return $table;
};

var handleData = function(data) {
    console.log('handleData');
    var data = sanitizeData(data.feed.entry);
    var clusters = generateClusters(data);
    var locations = _.keys(clusters);
    _.each(locations, function(location) {
      var $title = $('<h2>' + location + '</h2>');
      var $table = createTable(_.uniq(clusters[location]));
      $('#content-area').append($title);
      $('#content-area').append($table);
    });
    
}

var linkFail = function() {
  $('.spreadsheet-link').val('');
  $('.spreadsheet-link').attr('placeholder', 'Sorry, that link is invalid, please try again');
}

$('#go').click(function() {
  console.log('go')
  var uri = $('.spreadsheet-link').val();
  if (!uri) {
    linkFail();
    return;
  }
  var match = uri.match(/key=(.*?)&/);
  if (match && match.length === 2) {
    var key = match[1];
    var google_uri = "https://spreadsheets.google.com/feeds/list/" + 
      key + 
      "/od6/public/values?alt=json-in-script&callback=handleData";
    var $script = $('<script></script>');
    $script.attr('src', google_uri);
    $(document.body).append($script);
    console.log(google_uri);
  } else {
    linkFail();
    return;
  }
});