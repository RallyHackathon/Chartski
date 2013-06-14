Ext = window.Ext4 || window.Ext

Ext.define 'CustomChartSettings',
  singleton: true

  getFields: (context) ->
    [
      {
        name: 'chartTitle'
        fieldLabel: 'Chart Title'
        xtype: 'rallytextfield'
        width: 300
      }
      {
        name: 'xAxisLabel'
        fieldLabel: 'X-Axis Label'
        xtype: 'rallytextfield'
        width: 300
      }
      {
        name: 'yAxisLabel'
        fieldLabel: 'Y-Axis Label'
        xtype: 'rallytextfield'
        width: 300
      }
      {
        name: 'chartTheme'
        fieldLabel: 'Theme Name'
        xtype: 'combobox'
        queryMode: 'local'
        displayField: 'displayName'
        valueField: 'themeName'
        store:
          fields: ['displayName', 'themeName']
          data: [
            { displayName: 'Dark Blue', themeName: 'DarkBlue' }
            { displayName: 'Dark Green', themeName: 'DarkGreen' }
            { displayName: 'Grid', themeName: 'Grid' }
            { displayName: 'Skies', themeName: 'Skies' }
            { displayName: 'Gray', themeName: 'Gray' }
          ]
      }
      {
        name: 'type'
        xtype: 'rallycombobox'
        shouldRespondToScopeChange: true
        context: context
        storeConfig:
          model: 'TypeDefinition'
          sorters: [
              property: 'Name'
          ]
          fetch: ['DisplayName', 'ElementName', 'TypePath']
          filters: [
            property: 'Creatable'
            value: true
          ]
          autoLoad: false,
          remoteSort: false
        displayField: 'DisplayName'
        valueField: 'TypePath'
        listeners:
          select: (combo, records) -> combo.fireEvent 'typeselected', records[0].get('TypePath'), combo.context
          ready: (combo) ->
            combo.store.sort 'DisplayName'
            Rally.data.ModelFactory.getModels
              context: combo.context.getDataContext()
              types: _.map combo.store.getRange(), (record) -> record.get 'TypePath'
              success: (models) ->
                combo.store.filterBy (record) -> models[record.get 'TypePath'].hasField 'FormattedID'
                combo.fireEvent 'typeselected', combo.getRecord().get('TypePath'), combo.context

        bubbleEvents: ['typeselected']
        readyEvent: 'ready'
        handlesEvents:
          projectscopechanged: (context) -> @refreshWithNewContext context
      }
      {
        name: 'fetchFields'
        fieldLabel: 'Fetch Fields'
        xtype: 'rallyfieldpicker'
        readyEvent: 'ready'
        handlesEvents:
          typeselected: (type, context) ->
            @refreshWithNewModelTypes [type], context
        width: 300
        margin: '0 0 255 0'
        storeConfig:
          autoLoad: false
      }
#      {
#        name: 'xAxisTransformer'
#        cls: 'codearea'
#        fieldLabel: 'X-Axis Transformer'
#        xtype: 'textarea'
#        width: 400
#      }
#      {
#        name: 'yAxisTransformer'
#        fieldLabel: 'Y-Axis Transformer'
#        xtype: 'textarea'
#        width: 400
#      }
    ]
