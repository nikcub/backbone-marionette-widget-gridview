GridView.WidgetGridView = Marionette.LayoutView.extend({
  template: _.template('<div id="main-gridstack" class="grid-stack">  </div>'),

  collectionEvents: {
    'add':    'onCollectionAdd',
    'remove': 'onCollectionRemove',
    'reset':  'onCollectionReset',
    'change': 'onModelChange'
  },

  initialize: function(options) {
    options = options || {};
    options.gsOptions = options.gsOptions || {};

    if (_.isUndefined(options.autoPos)) {
      options.autoPos = true;
    }
    if (!options.collection) {
      throw new Error('Missing collection inside initialization options');
    }
    this.options = options;
    this.rendered = false;
  },

  setAutoPos: function(autoPos) {
    this.options.autoPos = autoPos;
  },

  setGridstackOptions: function(options) {
    this.options.gsOptions = options;
  },

  onCollectionAdd: function(widget) {
    this.saveCollection();
    this.addWidgetView(widget);
  },

  onCollectionRemove: function(widget) {
    this.saveCollection();
    this.removeWidgetView(widget);
  },

  onCollectionReset: function() {
    this.saveCollection();
    this.resetGridView();
  },

  onModelChange: function() {
    this.saveCollection();
  },

  saveCollection: function() {
    if (!_.isEmpty(this.options.autoSave)) {
      var options = this.options.autoSave.options || {};
      if (_.isFunction(options)) {
        options = options();
      }
      this.options.autoSave.callback(this.collection, options);
    }
  },

  onRender: function() {
    this.rendered = true;
    this.initializeGridstack();
    this.populateWidgetViews();
  },

  initializeGridstack: function() {
    this.$('.grid-stack').gridstack(this.options.gsOptions);
    this.gridstack = this.$('.grid-stack').data('gridstack');
    this.$('.grid-stack').on('change', _.bind(this.updateAllWidgetsAttributes, this));
  },

  populateWidgetViews: function() {
    this.collection.each(function(widget) {
      this.addWidgetView(widget);
    }, this);
  },

  addWidgetView: function(widget) {
    if (this.rendered) {
      var widgetInfo = widget.getGridstackAttributes();
      if (this.gridstack.will_it_fit(widgetInfo.x,
          widgetInfo.y,
          widgetInfo.width,
          widgetInfo.height,
          this.options.autoPos)) {

        this.gridstack.add_widget(widgetInfo.el,
          widgetInfo.x,
          widgetInfo.y,
          widgetInfo.width,
          widgetInfo.height,
          this.options.autoPos);
        if (this.options.autoPos) {
          this.updateWidgetAttributesById(widgetInfo.id);
        }
        this.addRegion(widgetInfo.id, '#' + widgetInfo.id);
        this.showWidgetView(widget);

      } else {
        this.collection.remove(widget, { silent: true });
        this.saveCollection();
        alert('Not enough free space to place the widget id : ' + widgetInfo.id);
      }
    } else {
      alert('The grid view needs to be rendered before trying to add widgets to the view');
    }
  },

  removeWidgetView: function(widget) {
    if (this.rendered) {
      var widgetId = widget.get('widgetId'),
          $el      = this.$('#' + widgetId).closest('.grid-stack-item');

      this.removeRegion(widgetId);
      this.gridstack.remove_widget($el);
      //temporary fix for issue : https://github.com/troolee/gridstack.js/issues/167
      this.updateAllWidgetsAttributes();
    } else {
      alert('The grid view needs to be rendered before trying to remove widgets from the view');
    }
  },

  resetGridView: function() {
    if (this.rendered) {
      this.gridstack.remove_all();
      this.initializeGridstack();
      this.populateWidgetViews();
    } else {
      alert('The grid view needs to be rendered before trying to reset the view');
    }
  },

  showWidgetView: function(widget) {
    var view = this.getViewToShow(widget);
    this.listenTo(view, 'remove:widget', this.removeWidget);
    this.getRegion(widget.get('widgetId')).show(view);
  },

  getViewToShow: function(widget) {
    if (!this.options.customViews) {
      if (!widget.isDefaultView()) {
        widget.set('viewType', widget.getDefaultView());
      }
      return new GridView.WidgetView({ model: widget });
    } else {
      if (this.options.customViews[widget.get('viewType')]) {
        return new this.options.customViews[widget.get('viewType')]({ model: widget });
      } else {
        if (!widget.isDefaultView()) {
          widget.set('viewType', widget.getDefaultView());
        }
        return new GridView.WidgetView({ model: widget });
      }
    }
  },

  removeWidget: function(args) {
    this.collection.remove(args.model);
  },

  updateAllWidgetsAttributes: function() {
    this.collection.each(function(widget) {
      this.updateWidgetAttributesById(widget.get('widgetId'));
    }, this);
  },

  updateWidgetAttributesById: function(id) {
    var $item = this.$('#' + id).closest('.grid-stack-item');
    this.collection.findWhere({ widgetId: id }).set({
      x:      parseInt($item.attr('data-gs-x')),
      y:      parseInt($item.attr('data-gs-y')),
      width:  parseInt($item.attr('data-gs-width')),
      height: parseInt($item.attr('data-gs-height'))
    });
  }

});
