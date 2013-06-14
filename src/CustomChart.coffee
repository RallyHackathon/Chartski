Ext = window.Ext4 || window.Ext

Ext.define 'CustomChart',
  extend: 'Rally.ui.chart.Chart'

  _haveDataToRender: -> true

  _getChart: -> @down 'highchart'

  _getChartData: -> @calculator.prepareChartData @loadedStores

  getTotalPoints: -> @chartData.series[0].data.length

  _clearData: ->
    {chart} = @_getChart()
    (chart.series[0].remove false) while chart.series.length
    return

  updateData: ->
    @chartData = @_getChartData()

    @_clearData()

    {chart} = this._getChart()

    chart.addSeries series, false for series in @chartData.series

    chart.redraw()

    @fireEvent 'chartRendered', @

  _renderChart: ->

    Highcharts.setOptions Ext.global["Highcharts#{@themename}Theme"]

    @down('#chart').add
      margin: 20
      xtype: 'highchart'
      chartConfig: @getChartConfig()
      series: @chartData.series

