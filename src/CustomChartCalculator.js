(function() {
  var Ext;

  Ext = window.Ext4 || window.Ext;

  Ext.define('CustomChartCalculator', {
    extend: 'Rally.data.lookback.calculator.BaseCalculator',
    mixins: {
      observable: "Ext.util.Observable"
    },
    filters: [],
    additionalCode: [],
    constructor: function() {
      this.mixins.observable.constructor.call(this);
      this.callParent(arguments);
      this._runAdditionalCode();
    },
    prepareChartData: function(store) {
      var snapshots;
      snapshots = _.pluck(store.data.items, 'raw');
      snapshots = this._applyFilters(snapshots, this.filters);
      return this.runCalculation(snapshots);
    },
    _applyFilters: function(data, filters) {
      return _.reduce(filters, function(memo, filter) {
        return _.filter(memo, filter, this);
      }, data, this);
    },
    _runAdditionalCode: function() {
      var code, _i, _len, _ref;
      if (this.additionalCode) {
        _ref = this.additionalCode;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          code = _ref[_i];
          code.call(this);
        }
      }
    },
    transformXdata: function(snapshotsByOid) {
      throw new Error('This method must be overridden');
    },
    transformYdata: function(snapshotsByOid) {
      throw new Error('This method must be overridden');
    },
    runCalculation: function(snapshots) {
      var chartData, groupedSnapshots, prefixTable, seriesData, xdata, ydata;
      groupedSnapshots = _.groupBy(snapshots, function(snapshot) {
        return snapshot.ObjectID;
      });
      xdata = this.transformXdata(groupedSnapshots);
      ydata = this.transformYdata(groupedSnapshots);
      prefixTable = {
        HierarchicalRequirement: 'US',
        Defect: 'DE',
        Task: 'T'
      };
      seriesData = _.map(groupedSnapshots, function(snapshots, oid) {
        var lastDate;
        lastDate = snapshots[snapshots.length - 1]._ValidTo === "9999-01-01T00:00:00.000Z" ? new Date() : new Date(snapshots[snapshots.length - 1]._ValidTo);
        return {
          x: xdata[oid],
          y: ydata[oid],
          detailUrl: this._createDetailUrl(oid),
          id: prefixTable[this.artifactType] + snapshots[0]._UnformattedID,
          lastDate: lastDate
        };
      }, this);
      chartData = {
        series: [
          {
            name: 'Stories',
            data: seriesData
          }
        ]
      };
      if (this.showTrendLine) {
        chartData.series.push({
          name: 'Trend Line',
          data: this._fitTrendData(seriesData),
          type: 'line'
        });
      }
      return chartData;
    },
    _artifactDetailTable: {
      HierarchicalRequirement: 'userstory',
      Defect: 'defect',
      Task: 'task'
    },
    _createDetailUrl: function(oid) {
      return "https://rally1.rallydev.com/#/" + this.projectOid + "d/detail/" + this._artifactDetailTable[this.artifactType] + "/" + oid;
    },
    _fitTrendData: function(sourceData) {
      var data;
      return fitData((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = sourceData.length; _i < _len; _i++) {
          data = sourceData[_i];
          _results.push([data.x, data.y]);
        }
        return _results;
      })()).data;
    }
  });

}).call(this);
