(function() {
  Ext.define('CustomChartApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    config: {
      defaultSettings: {
        chartTitle: 'Story Size Versus Cycle Time',
        chartTheme: 'DarkBlue',
        tooltipTpl: '<a target="_blank" href="{point.detailUrl}">{point.id}</a><br>Estimate: {point.x}<br>Cycle Time: {point.y}<br>End Date: {point.lastDate}',
        showTrendLine: true,
        fetchFields: 'PlanEstimate,ScheduleState',
        xAxisLabel: 'Estimated Size',
        yAxisLabel: 'Cycle Time!',
        type: 'HierarchicalRequirement',
        xAxisDataTransformer: function(snapshotsByOid) {
          var data;
          data = {};
          _.each(snapshotsByOid, function(snapshots, oid) {
            return data[oid] = snapshots[snapshots.length - 1].PlanEstimate || 0;
          });
          return data;
        },
        yAxisDataTransformer: function(snapshotsByOid) {
          var MS_TO_DAYS, data;
          MS_TO_DAYS = 1000 * 60 * 60 * 24;
          data = {};
          _.each(snapshotsByOid, function(snapshots, oid) {
            var cycletime, dateLastStateValidFrom, dateLastStateValidTo, lastState;
            dateLastStateValidFrom = snapshots[0]._ValidFrom;
            dateLastStateValidTo = snapshots[0]._ValidTo;
            lastState = snapshots[0].ScheduleState;
            cycletime = 0;
            _.each(snapshots, function(snapshot) {
              if (snapshot.ScheduleState !== lastState) {
                cycletime += new Date(dateLastStateValidTo) - new Date(dateLastStateValidFrom);
                lastState = snapshot.ScheduleState;
                return dateLastStateValidFrom = snapshot._ValidFrom;
              } else {
                return dateLastStateValidTo = snapshot._ValidTo;
              }
            });
            return data[oid] = cycletime / MS_TO_DAYS;
          });
          return data;
        },
        filters: [
          function(item) {
            var startEstimate, stopEstimate, _ref, _ref1;
            _ref = this.controls.down('#storySizeField').getValues(), startEstimate = _ref[0], stopEstimate = _ref[1];
            return (startEstimate < (_ref1 = item.PlanEstimate) && _ref1 < stopEstimate);
          }, function(item) {
            var endingStateValue, itemStateValue, startingStateValue;
            startingStateValue = parseInt(this.scheduleStates[this.controls.down('#startingStateField').value], 10);
            endingStateValue = parseInt(this.scheduleStates[this.controls.down('#endingStateField').value], 10);
            itemStateValue = parseInt(this.scheduleStates[item.ScheduleState], 10);
            return (startingStateValue <= itemStateValue && itemStateValue <= endingStateValue);
          }
        ],
        helpers: {
          isSingleStorySize: function() {
            var storySizeFieldValues;
            storySizeFieldValues = this.down('#storySizeField').getValues();
            return storySizeFieldValues[0] === storySizeFieldValues[1];
          }
        },
        additionalCode: [
          function() {
            var me;
            me = this;
            return Rally.data.ModelFactory.getModel({
              type: this.artifactType === 'HierarchicalRequirement' ? 'UserStory' : this.artifactType,
              success: function(model) {
                var field;
                field = model.getField('ScheduleState');
                return field.getAllowedValueStore().load({
                  callback: function(allowedValues) {
                    return me.scheduleStates = _(allowedValues).pluck('data').pluck('StringValue').invert().value();
                  }
                });
              }
            });
          }
        ],
        controls: [
          {
            fieldLabel: 'Starting State',
            itemId: 'startingStateField',
            padding: '5px 0 5px 20px',
            xtype: 'rallyfieldvaluecombobox',
            model: 'UserStory',
            field: 'ScheduleState'
          }, {
            fieldLabel: 'Ending State',
            itemId: 'endingStateField',
            padding: '5px 0 5px 20px',
            xtype: 'rallyfieldvaluecombobox',
            model: 'UserStory',
            field: 'ScheduleState',
            defaultSelectionToFirst: false
          }, {
            fieldLabel: 'Story Size',
            itemId: 'storySizeField',
            padding: '5px 0 5px 20px',
            xtype: 'multislider',
            width: 255,
            values: [0, 100],
            minValue: 0,
            maxValue: 100
          }
        ]
      }
    },
    items: [
      {
        xtype: 'container',
        itemId: 'chartcontainer',
        height: '440px'
      }, {
        xtype: 'container',
        layout: 'hbox',
        items: [
          {
            margin: 20,
            xtype: 'container',
            itemId: 'controls',
            items: []
          }, {
            xtype: 'component',
            itemId: 'stats',
            style: 'margin: 30px 20px',
            tpl: "<table>\n  <tr><td>Total Data Points: </td><td>&nbsp;&nbsp;{totalDataPoints}</tr>\n</table>"
          }
        ]
      }
    ],
    initComponent: function() {
      var _ref;
      this.callParent(arguments);
      this._hydrateControls();
      this._hydrateHelpers();
      if ((_ref = this.down('#updateButton')) != null) {
        _ref.on('click', this.updateChart, this);
      }
      return this._drawChart();
    },
    updateChart: function() {
      return this._customChart.updateData();
    },
    _getStoreConfig: function() {
      var fetchFields;
      fetchFields = ['_UnformattedID'].concat(this.getSetting('fetchFields').split(','));
      return {
        find: {
          '_TypeHierarchy': this.getSetting('type'),
          '_ProjectHierarchy': this.getContext().get('project').ObjectID,
          'Children': null
        },
        fetch: fetchFields,
        fields: fetchFields,
        hydrate: fetchFields,
        listeners: {
          load: function() {
            this.down('#chartcontainer').add(this._customChart);
            return this.down('#chartcontainer').setLoading(false);
          },
          scope: this
        }
      };
    },
    _getCalculatorConfig: function() {
      return {
        artifactType: this.getSetting('type'),
        additionalCode: this.getSetting('additionalCode'),
        controls: this.down('#controls'),
        filters: this.getSetting('filters'),
        projectOid: this.getContext().get('project').ObjectID,
        transformXdata: this.getSetting('xAxisDataTransformer'),
        transformYdata: this.getSetting('yAxisDataTransformer'),
        showTrendLine: this.getSetting('showTrendLine')
      };
    },
    _transformObject: function(obj) {
      var newObj;
      if (obj == null) {
        obj = {};
      }
      newObj = {};
      _.forOwn(obj, function(value, key) {
        return newObj[key] = _.isFunction(value) ? value.call(this) : _.isObject(value) ? this._transformObject(value) : value;
      }, this);
      return newObj;
    },
    _getChartConfig: function() {
      return {
        chart: {
          type: 'scatter',
          zoomType: 'xy'
        },
        title: {
          text: this.getSetting('chartTitle')
        },
        xAxis: {
          title: {
            text: this.getSetting('xAxisLabel')
          }
        },
        yAxis: {
          title: {
            text: this.getSetting('yAxisLabel')
          }
        },
        plotOptions: {
          line: {
            enableMouseTracking: false,
            marker: {
              enabled: false
            }
          },
          scatter: {
            marker: {
              radius: 5,
              states: {
                hover: {
                  enabled: true,
                  lineColor: 'rgb(100,100,100)'
                }
              },
              symbol: 'circle'
            },
            states: {
              hover: {
                marker: {
                  enabled: false
                }
              }
            },
            tooltip: {
              headerFormat: '<b>{series.name}</b><br>',
              pointFormat: this.getSetting('tooltipTpl')
            }
          },
          series: {
            allowPointSelect: true,
            turboThreshold: 10000
          }
        }
      };
    },
    _drawChart: function() {
      this.down('#chartcontainer').setLoading();
      return this._customChart = Ext.create('CustomChart', {
        themename: this.getSetting('chartTheme'),
        itemId: 'customChart',
        storeConfig: this._getStoreConfig(),
        calculatorType: 'CustomChartCalculator',
        calculatorConfig: this._getCalculatorConfig(),
        chartConfig: this._getChartConfig(),
        listeners: {
          chartRendered: function() {
            return this.drawStats();
          },
          scope: this
        }
      });
    },
    drawStats: function() {
      return this.down('#stats').update({
        totalDataPoints: this._customChart.getTotalPoints()
      });
    },
    getSettingsFields: function() {
      return CustomChartSettings.getFields(this.getContext());
    },
    _hydrateHelpers: function() {
      return _.assign(this, this.getSetting('helpers'));
    },
    _hydrateControls: function() {
      var control, controls, controlsContainer, _i, _len;
      controls = this.getSetting('controls');
      controlsContainer = this.down('#controls');
      for (_i = 0, _len = controls.length; _i < _len; _i++) {
        control = controls[_i];
        controlsContainer.add(control);
      }
      if (controls.length > 0) {
        return controlsContainer.add({
          text: 'Update',
          itemId: 'updateButton',
          margin: '5px 0 5px 20px',
          xtype: 'button'
        });
      }
    }
  });

}).call(this);
