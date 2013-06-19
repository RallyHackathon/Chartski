Ext = window.Ext4 || window.Ext

Ext.define 'CustomChartCalculator',
  extend: 'Rally.data.lookback.calculator.BaseCalculator'
  mixins: { observable : "Ext.util.Observable" }

  filters: []
  additionalCode: []

  constructor: ->
    @mixins.observable.constructor.call @
    @callParent arguments
    @_runAdditionalCode()
    return

  prepareChartData: (store) ->
    snapshots = _.pluck store.data.items, 'raw'
    snapshots = @_applyFilters snapshots, @filters
    @runCalculation snapshots

  _applyFilters: (data, filters) ->
    _.reduce filters, (memo, filter) ->
      _.filter memo, filter, this
    , data, this

  _runAdditionalCode: ->
    code.call @ for code in @additionalCode if @additionalCode
    return

  transformXdata: (snapshotsByOid) -> throw new Error('This method must be overridden');
  transformYdata: (snapshotsByOid) -> throw new Error('This method must be overridden');

  runCalculation: (snapshots) ->

    groupedSnapshots = _.groupBy snapshots, (snapshot) -> snapshot.ObjectID

    xdata = @transformXdata groupedSnapshots
    ydata = @transformYdata groupedSnapshots

    prefixTable =
      HierarchicalRequirement: 'US'
      Defect: 'DE'
      Task: 'T'

    seriesData = _.map groupedSnapshots, (snapshots, oid) ->

      lastDate = if snapshots[snapshots.length-1]._ValidTo is "9999-01-01T00:00:00.000Z" then new Date() else new Date(snapshots[snapshots.length-1]._ValidTo)

      x: xdata[oid]
      y: ydata[oid]
      detailUrl: @_createDetailUrl oid
      id: prefixTable[@artifactType] + snapshots[0]._UnformattedID
      lastDate: lastDate
    , @

    chartData = series: [
      {
        name: 'Stories'
        data: seriesData
      }
    ]

    if @showTrendLine
      chartData.series.push
          name: 'Trend Line'
          data: @_fitTrendData seriesData
          type: 'line'

    chartData

  _artifactDetailTable:
    HierarchicalRequirement: 'userstory'
    Defect: 'defect'
    Task: 'task'

  _createDetailUrl: (oid) ->
    "https://rally1.rallydev.com/#/#{@projectOid}d/detail/#{@_artifactDetailTable[@artifactType]}/#{oid}"

  _fitTrendData: (sourceData) ->
    fitData([data.x, data.y] for data in sourceData).data

