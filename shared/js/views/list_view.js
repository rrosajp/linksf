/* globals window */
var Query                            = require('shared/lib/query'),
    facilities                       = require('shared/collections/facilities').instance(),
    searchParams                     = ["fr"],
    parseParams                      = require('shared/lib/query_param_parser'),
    calculateDistanceFromService     = require('shared/lib/distance').calculateDistanceFromService,
    calculateWalkingTimeFromDistance = require('shared/lib/distance').calculateWalkingTimeFromDistance;

function generateQueryParams(inputString, limit ) {
  var queryString  = inputString || window.location.hash.substring(window.location.hash.indexOf('?') + 1),
      params       = parseParams(queryString),
      categories   = _.compact((params.categories || '').split(',')),
      demographics = _.compact((params.demographics || '').split(',')),
      gender       = params.gender || null,
      search       = decodeURIComponent(params.search || ''),
      sort         = params.sort,
      queryParams  = { search: search, limit: limit || 10 },
      filterParams = {};

  if (categories.length > 0) {
    filterParams.categories = categories;
  }

  if (demographics.length > 0) {
    filterParams.age = demographics;
  }

  if (params.gender && params.gender !== 'A') {
    filterParams.gender = params.gender;
  }

  if (params.sort) {
    queryParams.sort = params.sort;
  }

  if (params.hours === 'open') {
    filterParams.open = true;
  }

  queryParams.filter = filterParams;

  return queryParams;
}

function validCategory(category) {
  return category && (/[a-z]+/).test(category.toString());
}

function getData($elements, dataAttrName) {
  var result = [];
  $elements.each(function(n, el) {
    result.push($(el).data(dataAttrName));
  });
  return result;
}

var ListView = Backbone.View.extend({
  template: require('shared/templates/list'),

  events: {
    "click #load-more-link": 'loadMore',
    "click #load-more":      'loadMore',
    "click .more-options":   'goToFilter',
    "click .sort-toggle":    'sortToggle',
    "click #open-toggle":    'openToggle'
  },

  constructor: function (options) {
    Backbone.View.apply(this, arguments);
    this.options = options;
  },

  initialize: function() {
    this.listenTo(this.collection, 'reset', this.render);
  },

  reset: function() {
    this.offset = this.hasMoreResults = null;
  },

  showSpinner: function() {
    this.$('#loading-spinner').show();
  },

  hideSpinner: function() {
    this.$('#loading-spinner').hide();
  },

  submitQuery: function(params, options) {
    options = options || {};
    params.tzOffset = (new Date()).getTimezoneOffset();

    if ( this.options.currentLocation ) { 
      $.extend(params, this.options.currentLocation);  
    }

    return Query.findByFilter(params).done(function(results) {
      this.offset = results.offset;
      this.hasMoreResults = (results.data.length == params.limit);

      if (options.appendData) {
        this.collection.add(results.data);
      } else {
        facilities.reset(results.data);
      }

    }.bind(this));
  },

  loadMore: function() {
    $('#load-more').html($('#loading-spinner').html());

    var params = this.getFilterParams();

    this.submitQuery(params, { appendData: true }).done(function(results) {
      this.render();
    }.bind(this));

    return false;
  },

  goToFilter: function() {
    var queryString  = window.location.hash.substring(window.location.hash.indexOf('?')+1);
    var router = require('routers/router').instance();
    router.navigate("filter?" + queryString, {trigger: true});
    return false;
  },

  generateQueryParams: generateQueryParams,

  getFilterParams: function () {
    var queryParams  = generateQueryParams();

    queryParams.offset = this.offset;
    queryParams.limit  = 10;

    this.options.categories = queryParams.filter.categories || [];

    return queryParams;
  },

  // TODO: there's really no reason to have to cast back and forth like this. 
  // we should define a common format for the url and for the parse cloud func.
  _navigateFromQueryParams: function(p) {
    var navigate = require('shared/lib/navigate');
    navigate({
      categories:   p.filter.categories,
      demographics: p.filter.demographics,
      gender:       p.filter.gender,
      sort:         p.sort,
      hours:        p.filter.open ? "open" : null
    });
  },

  sortToggle: function() { 
    var currentParams = generateQueryParams(); 
    currentParams.sort = ( currentParams.sort == "near" ? "name" : "near" );
    this._navigateFromQueryParams(currentParams);
    return false;
  },
  
  openToggle: function() { 
    var currentParams = generateQueryParams(); 
    currentParams.filter.open = !currentParams.filter.open;
    this._navigateFromQueryParams(currentParams);
    return false;
  },

  resetFilters: function() {
    this.$(".query .selected").removeClass("selected");
    var self = this;

    if ( this.options.categories ) {
      this.options.categories.forEach(function(category) {
        self.$categoryOption(category).addClass("selected");
      });
    }

    this.$(".query-option-gender [data-value='A']").addClass('selected');
  },

  $categoryOption: function(category) {
    if(validCategory(category)) {
      return this.$(".query-option-category [data-value=" + category + "]").addClass("selected");
    } else {
      return $();
    }

  },

  showMore: function(collection, searchLimit) {
    console.log('showMore', collection.length, searchLimit);
    return collection.length >= searchLimit;
  },

  navButtons: [
    {"class": 'left', id: 'backNav-button', text: 'Back'}
  ],

  render: function() {
    var deepJson        = this.collection ? this.deepToJson(this.collection) : [],
        categories      = this.options.categories || [],
        currentLocation = this.options.currentLocation,
        loadingResults  = this.options.loadingResults || [],
        templateJson    = this.flattenServices(deepJson, currentLocation),
        currentParams   = generateQueryParams();

    // replace with template
    this.$el.html(this.template({
      facilities:       templateJson,
      categories:       ListView.CATEGORIES,
      loadingResults:   loadingResults,
      searchParams:     this.filterSelectCategories(categories),
      sortIsProximity:  currentParams.sort == "near",
      openNowChecked:   currentParams.filter.open ? "checked" : ""
    }));

    this.$('.query').hide();
    this.$('.option-group-exclusive .query-option').click(function() {
      $(this).closest(".option-group-exclusive").find(".query-option").removeClass("selected");
      $(this).toggleClass("selected");
    });

    this.$('.option-group .query-option').click(function() {
      $(this).toggleClass("selected");
    });

    if ( this.hasMoreResults ) {
      this.$('#load-more').html('<span id="load-more-container"><a href="#" id="load-more-link"><i class="icon-down-open chevron"></i>More</a></span>');
      this.$('#load-more').show();
    }

    this.resetFilters();
    return this;
  },

  deepToJson: function(collection) {
    var json = [],
        modelJson;

    json = collection.models.map(function(model) {
      modelJson = model.toJSON();
      modelJson.status = model.status();
      modelJson.services = [];

      model.attributes.services.forEach(function(service) {
        modelJson.services.push(service.toJSON());
      });

      return modelJson;
    });

    return json;
  },

  // transforms category names to a unique array of category objects
  filterSelectCategories: function(queryParams) {
    var match, selectedCategories = [];

    if ( queryParams ) {
      queryParams.forEach(function(queryName) {
        var match = _.find(ListView.CATEGORIES, function(e){ return e.key == queryName; });
        if (!_.contains(selectedCategories, match)) {
          selectedCategories.push(match);
        }
      });
    }

    return selectedCategories;
  },

  flattenServices: function(jsonArray, currentLocation) {
    var serviceCategories,
        allNotes,
        flattened = [],
        self = this;

    jsonArray.forEach(function(jsonModel) {
      if (currentLocation) {
        jsonModel.distance        = calculateDistanceFromService(jsonModel.location, currentLocation);
        jsonModel.walkingTime     = calculateWalkingTimeFromDistance(jsonModel.distance);
        jsonModel.showDistance    = jsonModel.walkingTime > 60;
        jsonModel.showWalkingTime = !jsonModel.showDistance;
      }
      serviceCategories = [];
      allNotes = [];

      jsonModel.services.forEach(function(jsonService) {
        serviceCategories.push(jsonService.category);
        allNotes.push(jsonService.notes);
      });

      jsonModel.serviceCategories = self.filterSelectCategories(serviceCategories);
      jsonModel.allNotes = allNotes.join(' ');
      flattened.push(jsonModel);
    });

    return flattened;
  }
});


ListView.CATEGORIES = require('shared/lib/categories');

module.exports = ListView;
