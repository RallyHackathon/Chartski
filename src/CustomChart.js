(function() {
  var Ext;

  Ext = window.Ext4 || window.Ext;

  Ext.define('CustomChart', {
    extend: 'Rally.ui.chart.Chart',
    _haveDataToRender: function() {
      return true;
    },
    _getChart: function() {
      return this.down('highchart');
    },
    _getChartData: function() {
      return this.calculator.prepareChartData(this.loadedStores);
    },
    getTotalPoints: function() {
      return this.chartData.series[0].data.length;
    },
    _clearData: function() {
      var chart;
      chart = this._getChart().chart;
      while (chart.series.length) {
        chart.series[0].remove(false);
      }
    },
    updateData: function() {
      var chart, series, _i, _len, _ref;
      this.chartData = this._getChartData();
      this._clearData();
      chart = this._getChart().chart;
      _ref = this.chartData.series;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        series = _ref[_i];
        chart.addSeries(series, false);
      }
      chart.redraw();
      return this.fireEvent('chartRendered', this);
    },
    _renderChart: function() {
      Highcharts.setOptions(Ext.global["Highcharts" + this.themename + "Theme"]);
      return this.down('#chart').add({
        margin: 20,
        xtype: 'highchart',
        chartConfig: this.getChartConfig(),
        series: this.chartData.series
      });
    }
  });

}).call(this);
