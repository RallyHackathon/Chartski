Ext.define 'CustomChartApp',
  extend: 'Rally.app.App'
  componentCls: 'app'

  config:
    defaultSettings:
      chartTitle: 'Story Size Versus Cycle Time'
      chartTheme: 'DarkBlue'
      tooltipTpl: '<a target="_blank" href="{point.detailUrl}">{point.id}</a><br>Estimate: {point.x}<br>Cycle Time: {point.y}<br>End Date: {point.lastDate}'
      showTrendLine: true

      fetchFields: 'PlanEstimate,ScheduleState'

      xAxisLabel: 'Estimated Size'
      yAxisLabel: 'Cycle Time!'

      type: 'HierarchicalRequirement'

#     Priority vs PlanEstimate
#      type: 'Defect'

#      xAxisDataTransformer: (snapshotsByOid) ->
#        data = {}
#
#        _.each snapshotsByOid, (snapshots, oid) ->
#          debugger
#          data[oid] = snapshots[snapshots.length-1].PlanEstimate || Math.floor(Math.pow((Math.random() * 10) + 1, 2))
#
#        data

#      yAxisDataTransformer: (snapshotsByOid) ->
#        data = {}
#
#        _.each snapshotsByOid, (snapshots, oid) ->
#          debugger
#          data[oid] = snapshots[snapshots.length-1].Priority || Math.floor Math.pow((Math.random() * 5) + 1, 3)
#
#        data

#      filters: [
#        (item) ->
#          debugger
#          startingPriorityValue = parseInt(@priorities[@controls.down('#startingPriorityField').value], 10)
#          endingPriorityValue = parseInt(@priorities[@controls.down('#endingPriorityField').value], 10)
#          itemPriorityValue = if item.Priority then parseInt(@priorities[item.Priority], 10) else Math.floor(Math.random() * 5)
#          startingPriorityValue <= itemPriorityValue <= endingPriorityValue
#      ]

#      additionalCode: [
#        ->
#          me = @
#          Rally.data.ModelFactory.getModel
#              type: if @artifactType is 'HierarchicalRequirement' then 'UserStory' else @artifactType
#              success: (model) ->
#                field = model.getField 'Priority'
#                field.getAllowedValueStore().load
#                  callback: (allowedValues) ->
#                    allowedValues = [allowedValues[0]].concat allowedValues[1...allowedValues.length].reverse()
#                    me.priorities = _(allowedValues).pluck('data').pluck('StringValue').invert().value()
#                    me.priorities['None'] = 0
#      ]

#      controls: [
#        {
#          fieldLabel: 'Starting Priority'
#          itemId: 'startingPriorityField'
#          padding: '5px 0 5px 20px'
#          xtype: 'rallyfieldvaluecombobox'
#          model: -> if @getSetting('type') is 'HierarchicalRequirement' then 'UserStory' else @getSetting 'type'
#          field: 'Priority'
#        }
#        {
#          fieldLabel: 'Ending Priority'
#          itemId: 'endingPriorityField'
#          padding: '5px 0 5px 20px'
#          xtype: 'rallyfieldvaluecombobox'
#          model: -> if @getSetting('type') is 'HierarchicalRequirement' then 'UserStory' else @getSetting 'type'
#          field: 'Priority'
#          defaultSelectionToFirst: false
#        }
#      ]

#      Cycletime Chart

      xAxisDataTransformer: (snapshotsByOid) ->
        data = {}

        _.each snapshotsByOid, (snapshots, oid) ->
          data[oid] = snapshots[snapshots.length-1].PlanEstimate || 0

        data

      yAxisDataTransformer: (snapshotsByOid) ->
        MS_TO_DAYS = 1000 * 60 * 60 * 24

        data = {}

        _.each snapshotsByOid, (snapshots, oid) ->

          dateLastStateValidFrom = snapshots[0]._ValidFrom
          dateLastStateValidTo = snapshots[0]._ValidTo
          lastState = snapshots[0].ScheduleState
          cycletime = 0

          _.each snapshots, (snapshot) ->
            if snapshot.ScheduleState isnt lastState
              cycletime += (new Date(dateLastStateValidTo) - new Date(dateLastStateValidFrom))
              lastState = snapshot.ScheduleState
              dateLastStateValidFrom = snapshot._ValidFrom
            else
              dateLastStateValidTo = snapshot._ValidTo

          data[oid] = cycletime / MS_TO_DAYS

        data

      filters: [
        (item) ->
          [startEstimate, stopEstimate] = @controls.down('#storySizeField').getValues()
          startEstimate < item.PlanEstimate < stopEstimate
        (item) ->
          startingStateValue = parseInt(@scheduleStates[@controls.down('#startingStateField').value], 10)
          endingStateValue = parseInt(@scheduleStates[@controls.down('#endingStateField').value], 10)
          itemStateValue = parseInt(@scheduleStates[item.ScheduleState], 10)
          startingStateValue <= itemStateValue <= endingStateValue
      ]

      helpers:
        isSingleStorySize: ->
          storySizeFieldValues = @down('#storySizeField').getValues()
          storySizeFieldValues[0] is storySizeFieldValues[1]

      additionalCode: [
        ->
          me = @
          Rally.data.ModelFactory.getModel
              type: if @artifactType is 'HierarchicalRequirement' then 'UserStory' else @artifactType
              success: (model) ->
                field = model.getField 'ScheduleState'
                field.getAllowedValueStore().load
                  callback: (allowedValues) ->
                    me.scheduleStates = _(allowedValues).pluck('data').pluck('StringValue').invert().value()
      ]

      controls: [
        {
          fieldLabel: 'Starting State'
          itemId: 'startingStateField'
          padding: '5px 0 5px 20px'
          xtype: 'rallyfieldvaluecombobox'
          model: 'UserStory'
          field: 'ScheduleState'
        }
        {
          fieldLabel: 'Ending State'
          itemId: 'endingStateField'
          padding: '5px 0 5px 20px'
          xtype: 'rallyfieldvaluecombobox'
          model: 'UserStory'
          field: 'ScheduleState'
          defaultSelectionToFirst: false
        }
        {
          fieldLabel: 'Story Size'
          itemId: 'storySizeField'
          padding: '5px 0 5px 20px'
          xtype: 'multislider'
          width: 255
          values: [0, 100]
          minValue: 0
          maxValue: 100
        }
      ]


  items: [
    {
      xtype: 'container'
      itemId: 'chartcontainer'
      height: '440px'
    }
    {
      xtype: 'container'
      layout: 'hbox'
      items: [
        {
          margin: 20
          xtype: 'container'
          itemId: 'controls'
          items: []
        }
        {
          xtype: 'component'
          itemId: 'stats'
          style: 'margin: 30px 20px'
          tpl: """
            <table>
              <tr><td>Total Data Points: </td><td>&nbsp;&nbsp;{totalDataPoints}</tr>
            </table>
            """
        }
      ]
    }
  ]

  initComponent: ->
    @callParent arguments

    @_hydrateControls()
    @_hydrateHelpers()
    @down('#updateButton')?.on 'click', @updateChart, this
    @_drawChart()

  updateChart: -> @_customChart.updateData()

  _getStoreConfig: ->
    fetchFields = ['_UnformattedID'].concat @getSetting('fetchFields').split ','

    find:
      '_TypeHierarchy': @getSetting 'type'
      '_ProjectHierarchy': @getContext().get('project').ObjectID
      'Children': null

    fetch: fetchFields
    fields: fetchFields
    hydrate: fetchFields

    listeners:
      load: ->
        @down('#chartcontainer').add @_customChart
        @down('#chartcontainer').setLoading false
      scope: this

  _getCalculatorConfig: ->
    artifactType: @getSetting 'type'
    additionalCode: @getSetting 'additionalCode'
    controls: @down '#controls'
    filters: @getSetting 'filters'
    projectOid: @getContext().get('project').ObjectID
    transformXdata: @getSetting 'xAxisDataTransformer'
    transformYdata: @getSetting 'yAxisDataTransformer'
    showTrendLine: @getSetting 'showTrendLine'

  # Black magick
  _transformObject: (obj = {}) ->
    newObj = {}

    _.forOwn obj, (value, key) ->
      newObj[key] = if _.isFunction(value)
          value.call @
        else if _.isObject(value)
          @_transformObject value
        else
          value
    , @

    newObj

  _getChartConfig: ->

    chart:
      type: 'scatter'
      zoomType: 'xy'

    title:
      text: @getSetting 'chartTitle'

    xAxis:
      title:
        text: @getSetting 'xAxisLabel'
    yAxis:
      title:
        text: @getSetting 'yAxisLabel'

    plotOptions:
      line:
        enableMouseTracking: false
        marker:
          enabled: false

      scatter:
        marker:
          radius: 5
          states:
            hover:
              enabled: true
              lineColor: 'rgb(100,100,100)'
          symbol: 'circle'

        states:
          hover:
            marker:
              enabled: false

        tooltip:
          headerFormat: '<b>{series.name}</b><br>'
          pointFormat: @getSetting 'tooltipTpl'

      series:
        allowPointSelect: true
        turboThreshold: 10000

  _drawChart: ->
    @down('#chartcontainer').setLoading()

    @_customChart = Ext.create 'CustomChart',

      themename: @getSetting 'chartTheme'

      itemId: 'customChart'

      storeConfig: @_getStoreConfig()

      calculatorType: 'CustomChartCalculator'
      calculatorConfig: @_getCalculatorConfig()

      chartConfig: @_getChartConfig()

      listeners:
        chartRendered: -> @drawStats()
        scope: this

  drawStats: ->
    @down('#stats').update
      totalDataPoints: @_customChart.getTotalPoints()

  getSettingsFields: ->
    CustomChartSettings.getFields @getContext()

  _hydrateHelpers: -> _.assign @, @getSetting 'helpers'

  _hydrateControls: ->
    controls = @getSetting 'controls'
    controlsContainer = @down '#controls'
    controlsContainer.add control for control in controls
    if controls.length > 0
      controlsContainer.add
        text: 'Update'
        itemId: 'updateButton'
        margin: '5px 0 5px 20px'
        xtype: 'button'
