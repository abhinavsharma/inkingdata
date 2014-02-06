var senses = ['touch', 'sight', 'smell', 'sound', 'taste'];

var sanitizeData = function(data) {
  return _.map(data, function(row) {
    var processedRow = {
      'experience': row['gsx$experience']['$t'],
    };
    _.map(senses, function (sense) {
      processedRow['rate-' + sense] =
        parseInt(row['gsx$rate-' + sense]['$t'], 10);
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
    });
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
  });

  _.each(dataGroup, function(row) {
    var $bodyrow = $('<tr><td>' + row.experience + '</td></tr>');
    _.each(senses, function(sense) {
      $bodyrow.append('<td>' + row['rate-' + sense]+ '</td>');
    });
    $tbody.append($bodyrow);
  });
  $thead.append($headrow);
  $table.append($thead);
  $table.append($tbody);
  return $table;
};

var printCliques = function(cliques) {
  _.each(cliques, function(clique) {
    console.log(_.map(clique, function(node) {return node.experience}, ''));
  });
};

var generateCliques = function(data) {
  var clusters = generateClusters(data);
  var locations = _.keys(clusters);
  var locationCliques = {};
  _.each(locations, function(location) {
    console.log(location);
    var $title = $('<h2>' + location + '</h2>');
    var cluster = _.uniq(clusters[location]);
    var allSubsets = powerSet(cluster);
    var cliques = _.filter(allSubsets, function(subset) {
      if (subset.length < 2) {
        return false;
      }
      var isClique = true;
      for (var i = 0; i < subset.length; i++) {
        for (var j = i + 1; j < subset.length; j++) {
          if (!hasEdge(subset[i], subset[j])) {
            isClique = false;
          }
        }
      }
      return isClique;
    });
    locationCliques[location] = cliques;
  });
  return locationCliques;
};

var renderExperiences = function(data, cls) {
  console.log('Render experiences for ' + cls);
  _.each(senses, function(sense) {
      _.each(
        _.sortBy(data, function(row) {
          var rank = row['rate-' + sense];
          return cls === 'love' ? -rank : +rank;
        }).slice(0,3),
        function(row) {
          var $el = $('<li></li>');
          $el.html(row.experience);
          $('.' + cls + ' ul.' + sense).append($el);
        }
      );
  });
  // overall
  _.each(
    _.sortBy(data, function(row) {
      var rank = _.reduce(
        _.map(senses, function(sense) {
          return row['rate-' + sense];
        }),
        function (s, a) { return s + a; },
        0
      );
      return cls === 'love' ? -rank : +rank;
    }).slice(0,5),
    function(row) {
      var $el = $('<li></li>');
      $el.html(row.experience);
      $('.' + cls + ' ul.all-senses').append($el);
    }
  );
};

var renderCliques = function(lCliques, cls) {
  console.log('Render cliques for ' + cls);
  var locations = _.keys(lCliques);
  var i = 0;
  _.each(locations, function(location) {
    var $location = $('<div>');
    $location.addClass('large-6 medium-6 small-12 columns');
    var $locationTitle = $('<h3>' + location + '</h3><hr />');
    var cliques = lCliques[location];
    if (cliques.length === 0) {
      return;
    }
    var $list = $('<ul>');
    cliques = _.sortBy(cliques, function(clique) {
      if (cls === 'adventures') {
        return - _.reduce(senses, function(score, sense) {
          return score + _.max(clique, function(row) {
            return row['rate-' + sense];
          })['rate-' + sense];
        }, 0);
      } else {
        return _.reduce(senses, function(score, sense) {
          return score + _.min(clique, function(row) {
            return row['rate-' + sense];
          })['rate-' + sense];
        }, 0);
      }
    }).slice(0,5);
    _.each(cliques, function(clique) {
      var $item = $('<li>');
      $item.html(
        _.map(clique, function(row) {return row.experience;}).join(' + ')
      );
      $list.append($item);
    });

    var $locationTitleWrapper = $('<div>');
    $locationTitleWrapper.addClass('text-center');
    $locationTitleWrapper.append($locationTitle);
    $location.append($locationTitleWrapper);
    $location.append($list);
    var $row;
    if (i++ % 2 === 0){
      $row = $('<div>');
      $row.addClass('row');
      $('.' + cls).append($row);
    } else {
      $row = $('.' + cls + '>.row:last-child');
    }
    $row.append($location);
    
  });
};

var handleData = function(data) {
    data = sanitizeData(data.feed.entry);
    renderExperiences(data, 'love');
    renderExperiences(data, 'hate');
    var lCliques = generateCliques(data);
    renderCliques(lCliques, 'adventures');
    renderCliques(lCliques, 'fails');
    $('.instructions').hide();
    $('.results').show();
};

var hasEdge = function(ob1, ob2) {
  var edge = true;
  _.each(senses, function(sense) {
    if (ob1['occ-' + sense] && ob2['occ-' + sense]) {
      edge = false;
    }
  });
  return edge;
};

var powerSet = function(ary) {
  var ps = [[]];
  for (var i=0; i < ary.length; i++) {
    for (var j = 0, len = ps.length; j < len; j++) {
      ps.push(ps[j].concat(ary[i]));
    }
  }
  return ps;
};

var linkFail = function() {
  $('.spreadsheet-link').val('');
  $('.spreadsheet-link').attr('placeholder', 'Sorry, that link is invalid, please try again');
};

var extractSpreadsheetLink = function(uri) {
  if (!uri) {
    return null;
  }
  var match = uri.match(/key=(.*?)&/);
  if (match && match.length === 2) {
    var key = match[1];
    var google_uri = "https://spreadsheets.google.com/feeds/list/" +
      key +
      "/od6/public/values?alt=json-in-script&callback=handleData";
    return google_uri;
  } else {
    return null;
  }
}

$(".spreadsheet-link").bind("paste", function() {
  var self = this;
  setTimeout(function() {
    var link = extractSpreadsheetLink($(self).val());
    console.log(this);
    if (link === null) {
      $(".spreadsheet-link").css('background-color', 'red');
      $(".spreadsheet-link").css('color', '#222222');
      $('.spreadsheet-link').attr('placeholder', 'Sorry, that link is invalid, please try again');
      return;
    }
    $(".spreadsheet-link").css('background-color', 'green');
    $(".spreadsheet-link").css('color', '#ffffff');
    $(".spreadsheet-link").prop('disabled', true);
    $('.spreadsheet-link').val('Thanks! Processing...');
    var $script = $('<script></script>');
    $script.attr('src', link);
    $(document.body).append($script);
  }, 0);
});