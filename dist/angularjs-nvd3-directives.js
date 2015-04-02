/*! angularjs-nvd3-directives - v0.0.8 - 2015-04-02
* http://angularjs-nvd3-directives.github.io/angularjs-nvd3-directives
* Copyright (c) 2015 Christian Maurer; Licensed Apache License, v2.0 */
(function() {
	'use strict';



nv.models.multiBarLineChart = function() {
    "use strict";
    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var multibar = nv.models.multiBar()
        , line = nv.models.line()
        , xAxis = nv.models.axis()
        , yAxis = nv.models.axis()
        , legend = nv.models.legend()
        , controls = nv.models.legend()
        ;

    var margin = {top: 30, right: 20, bottom: 50, left: 60}
        , width = null
        , height = null
        , color = nv.utils.defaultColor()
        , showControls = true
        , showLegend = true
        , showXAxis = true
        , showYAxis = true
        , rightAlignYAxis = false
        , reduceXTicks = true // if false a tick will show for every data point
        , staggerLabels = false
        , rotateLabels = 0
        , tooltips = true
        , tooltip = function(key, x, y, e, graph) {
            return '<h3>' + key + '</h3>' +
                '<p>' +  y + ' on ' + x + '</p>'
        }
        , x //can be accessed via chart.xScale()
        , y //can be accessed via chart.yScale()
        , state = { stacked: false }
        , defaultState = null
        , noData = "No Data Available."
        , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'stateChange', 'changeState')
        , controlWidth = function() { return showControls ? 180 : 0 }
        , transitionDuration = 250
        ;

    multibar
        .stacked(false)
    ;
    line
        .clipEdge(false)
        .padData(true)
    ;
    xAxis
        .orient('bottom')
        .tickPadding(7)
        .highlightZero(true)
        .showMaxMin(false)
        .tickFormat(function(d) { return d })
    ;
    yAxis
        .orient((rightAlignYAxis) ? 'right' : 'left')
        .tickFormat(d3.format(',.1f'))
    ;

    controls.updateState(false);
    //============================================================


    //============================================================
    // Private Variables
    //------------------------------------------------------------

    var showTooltip = function(e, offsetElement) {
        var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
            top = e.pos[1] + ( offsetElement.offsetTop || 0),
            x = xAxis.tickFormat()(multibar.x()(e.point, e.pointIndex)),
            y = yAxis.tickFormat()(multibar.y()(e.point, e.pointIndex)),
            content = tooltip(e.series.key, x, y, e, chart);

        nv.tooltip.show([left, top], content, e.value < 0 ? 'n' : 's', null, offsetElement);
    };

    //============================================================


    function chart(selection) {
        selection.each(function(data) {
            var container = d3.select(this),
                that = this;

            var availableWidth = (width  || parseInt(container.style('width')) || 960)
                    - margin.left - margin.right,
                availableHeight = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom;

            chart.update = function() { container.transition().duration(transitionDuration).call(chart) };
            chart.container = this;

            //set state.disabled
            //state.disabled = data.map(function(d) { return !!d.disabled });

            if (!defaultState) {
                var key;
                defaultState = {};
                for (key in state) {
                    if (state[key] instanceof Array)
                        defaultState[key] = state[key].slice(0);
                    else
                        defaultState[key] = state[key];
                }
            }
            //------------------------------------------------------------
            // Display noData message if there's nothing to show.

            if (!data || !data.data || !data.data.length || !data.data.filter(function(d) { return d.values.length }).length) {
                var noDataText = container.selectAll('.nv-noData').data([noData]);

                noDataText.enter().append('text')
                    .attr('class', 'nvd3 nv-noData')
                    .attr('dy', '-.7em')
                    .style('text-anchor', 'middle');

                noDataText
                    .attr('x', margin.left + availableWidth / 2)
                    .attr('y', margin.top + availableHeight / 2)
                    .text(function(d) { return d });

                return chart;
            } else {
                container.selectAll('.nv-noData').remove();
            }

            //------------------------------------------------------------


            //------------------------------------------------------------
            // Setup Scales

            x = multibar.xScale();
            y = multibar.yScale();

            //------------------------------------------------------------


            //------------------------------------------------------------
            // Setup containers and skeleton of chart

            var wrap = container.selectAll('g.nv-wrap.nv-multiBarWithLegend').data([data]);
            var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-multiBarWithLegend').append('g');
            var g = wrap.select('g');

            gEnter.append('g').attr('class', 'nv-x nv-axis');
            gEnter.append('g').attr('class', 'nv-y nv-axis');
            gEnter.append('g').attr('class', 'nv-barsWrap');
            gEnter.append('g').attr('class', 'nv-linesWrap');
            gEnter.append('g').attr('class', 'nv-legendWrap');
            gEnter.append('g').attr('class', 'nv-controlsWrap');



            //------------------------------------------------------------


            //------------------------------------------------------------
            // Legend

            if (showLegend) {
                legend.width(availableWidth - controlWidth());

                if (multibar.barColor()) {
                    data.data.forEach(function (series, i) {
                        series.color = d3.rgb('#ccc').darker(i * 1.5).toString();
                    })
                }

                g.select('.nv-legendWrap')
                    .datum(data)
                    .call(legend);

                if ( margin.top != legend.height()) {
                    margin.top = legend.height();
                    availableHeight = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom;
                }

                g.select('.nv-legendWrap')
                    .attr('transform', 'translate(' + controlWidth() + ',' + (-margin.top) +')');
            }

            //------------------------------------------------------------


            //------------------------------------------------------------
            // Controls

            if (showControls) {
                var controlsData = [
                    { key: 'Grouped', disabled: multibar.stacked() },
                    { key: 'Stacked', disabled: !multibar.stacked() }
                ];

                controls.width(controlWidth()).color(['#444', '#444', '#444']);
                g.select('.nv-controlsWrap')
                    .datum(controlsData)
                    .attr('transform', 'translate(0,' + (-margin.top) +')')
                    .call(controls);
            }

            //------------------------------------------------------------


            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            if (rightAlignYAxis) {
                g.select(".nv-y.nv-axis")
                    .attr("transform", "translate(" + availableWidth + ",0)");
            }

            //------------------------------------------------------------
            // Main Chart Component(s)

            multibar
                .disabled(data.data.map(function(series) { return series.disabled }))
                .width(availableWidth)
                .height(availableHeight)
                .color(data.data.map(function(d,i) {
                    return d.color || color(d, i);
                }).filter(function(d,i) { return !data.data[i].disabled }))


            var barsWrap = g.select('.nv-barsWrap')
                .datum(data.data.filter(function(d) { return !d.disabled }))

            barsWrap.transition().call(multibar);

            var watermark = availableHeight * (1-(data.line * 0.01)) + margin.top
            _.each($(this).children('line'), function(line) {
                $(line).remove();
            })
            d3.select(this).append('line').attr({
                x1: margin.left,
                y1: watermark,
                x2: availableWidth+margin.left,
                y2: watermark
            }).style("stroke", '#000')

            //------------------------------------------------------------


            //------------------------------------------------------------
            // Setup Axes

            if (showXAxis) {
                xAxis
                    .scale(x)
                    .ticks( availableWidth / 100 )
                    .tickSize(-availableHeight, 0);

                g.select('.nv-x.nv-axis')
                    .attr('transform', 'translate(0,' + y.range()[0] + ')');
                g.select('.nv-x.nv-axis').transition()
                    .call(xAxis);

                var xTicks = g.select('.nv-x.nv-axis > g').selectAll('g');

                xTicks
                    .selectAll('line, text')
                    .style('opacity', 1)

                if (staggerLabels) {
                    var getTranslate = function(x,y) {
                        return "translate(" + x + "," + y + ")";
                    };

                    var staggerUp = 5, staggerDown = 17;  //pixels to stagger by
                    // Issue #140
                    xTicks
                        .selectAll("text")
                        .attr('transform', function(d,i,j) {
                            return  getTranslate(0, (j % 2 == 0 ? staggerUp : staggerDown));
                        });

                    var totalInBetweenTicks = d3.selectAll(".nv-x.nv-axis .nv-wrap g g text")[0].length;
                    g.selectAll(".nv-x.nv-axis .nv-axisMaxMin text")
                        .attr("transform", function(d,i) {
                            return getTranslate(0, (i === 0 || totalInBetweenTicks % 2 !== 0) ? staggerDown : staggerUp);
                        });
                }

                if (reduceXTicks)
                    xTicks
                        .filter(function(d,i) {
                            return i % Math.ceil(data[0].values.length / (availableWidth / 100)) !== 0;
                        })
                        .selectAll('text, line')
                        .style('opacity', 0);

                if(rotateLabels)
                    xTicks
                        .selectAll('.tick text')
                        .attr('transform', 'rotate(' + rotateLabels + ' 0,0)')
                        .style('text-anchor', rotateLabels > 0 ? 'start' : 'end');

                g.select('.nv-x.nv-axis').selectAll('g.nv-axisMaxMin text')
                    .style('opacity', 1);
            }


            if (showYAxis) {
                yAxis
                    .scale(y)
                    .ticks( availableHeight / 36 )
                    .tickSize( -availableWidth, 0);

                g.select('.nv-y.nv-axis').transition()
                    .call(yAxis);
            }


            //------------------------------------------------------------



            //============================================================
            // Event Handling/Dispatching (in chart's scope)
            //------------------------------------------------------------

            legend.dispatch.on('stateChange', function(newState) {
                state = newState;
                dispatch.stateChange(state);
                chart.update();
            });

            controls.dispatch.on('legendClick', function(d,i) {
                if (!d.disabled) return;
                controlsData = controlsData.map(function(s) {
                    s.disabled = true;
                    return s;
                });
                d.disabled = false;

                switch (d.key) {
                    case 'Grouped':
                        multibar.stacked(false);
                        break;
                    case 'Stacked':
                        multibar.stacked(true);
                        break;
                }

                state.stacked = multibar.stacked();
                dispatch.stateChange(state);

                chart.update();
            });

            dispatch.on('tooltipShow', function(e) {
                if (tooltips) showTooltip(e, that.parentNode)
            });

            // Update chart from a state object passed to event handler
            dispatch.on('changeState', function(e) {

                if (typeof e.disabled !== 'undefined') {
                    data.forEach(function(series,i) {
                        series.disabled = e.disabled[i];
                    });

                    state.disabled = e.disabled;
                }

                if (typeof e.stacked !== 'undefined') {
                    multibar.stacked(e.stacked);
                    state.stacked = e.stacked;
                }

                chart.update();
            });

            //============================================================


        });

        return chart;
    }


    //============================================================
    // Event Handling/Dispatching (out of chart's scope)
    //------------------------------------------------------------

    multibar.dispatch.on('elementMouseover.tooltip', function(e) {
        e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
    });

    multibar.dispatch.on('elementMouseout.tooltip', function(e) {
        dispatch.tooltipHide(e);
    });
    dispatch.on('tooltipHide', function() {
        if (tooltips) nv.tooltip.cleanup();
    });

    //============================================================


    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    // expose chart's sub-components
    chart.dispatch = dispatch;
    chart.multibar = multibar;
    chart.line = line;
    chart.legend = legend;
    chart.xAxis = xAxis;
    chart.yAxis = yAxis;

    d3.rebind(chart, multibar, line, 'x', 'y', 'xDomain', 'yDomain', 'xRange', 'yRange', 'forceX', 'forceY', 'clipEdge',
        'id', 'stacked', 'stackOffset', 'delay', 'barColor','groupSpacing');

    chart.options = nv.utils.optionsFunc.bind(chart);

    chart.margin = function(_) {
        if (!arguments.length) return margin;
        margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
        margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
        margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
        margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
        return chart;
    };

    chart.width = function(_) {
        if (!arguments.length) return width;
        width = _;
        return chart;
    };

    chart.height = function(_) {
        if (!arguments.length) return height;
        height = _;
        return chart;
    };

    chart.color = function(_) {
        if (!arguments.length) return color;
        color = nv.utils.getColor(_);
        legend.color(color);
        return chart;
    };

    chart.showControls = function(_) {
        if (!arguments.length) return showControls;
        showControls = _;
        return chart;
    };

    chart.showLegend = function(_) {
        if (!arguments.length) return showLegend;
        showLegend = _;
        return chart;
    };

    chart.showXAxis = function(_) {
        if (!arguments.length) return showXAxis;
        showXAxis = _;
        return chart;
    };

    chart.showYAxis = function(_) {
        if (!arguments.length) return showYAxis;
        showYAxis = _;
        return chart;
    };

    chart.rightAlignYAxis = function(_) {
        if(!arguments.length) return rightAlignYAxis;
        rightAlignYAxis = _;
        yAxis.orient( (_) ? 'right' : 'left');
        return chart;
    };

    chart.reduceXTicks= function(_) {
        if (!arguments.length) return reduceXTicks;
        reduceXTicks = _;
        return chart;
    };

    chart.rotateLabels = function(_) {
        if (!arguments.length) return rotateLabels;
        rotateLabels = _;
        return chart;
    }

    chart.staggerLabels = function(_) {
        if (!arguments.length) return staggerLabels;
        staggerLabels = _;
        return chart;
    };

    chart.tooltip = function(_) {
        if (!arguments.length) return tooltip;
        tooltip = _;
        return chart;
    };

    chart.tooltips = function(_) {
        if (!arguments.length) return tooltips;
        tooltips = _;
        return chart;
    };

    chart.tooltipContent = function(_) {
        if (!arguments.length) return tooltip;
        tooltip = _;
        return chart;
    };

    chart.state = function(_) {
        if (!arguments.length) return state;
        state = _;
        return chart;
    };

    chart.defaultState = function(_) {
        if (!arguments.length) return defaultState;
        defaultState = _;
        return chart;
    };

    chart.noData = function(_) {
        if (!arguments.length) return noData;
        noData = _;
        return chart;
    };

    chart.transitionDuration = function(_) {
        if (!arguments.length) return transitionDuration;
        transitionDuration = _;
        return chart;
    };

    //============================================================


    return chart;
}

function initializeLegendMargin(scope, attrs) {
	var margin = (scope.$eval(attrs.legendmargin) || {left: 0, top: 5, bottom: 5, right: 0});
	if (typeof(margin) !== 'object') {
		// we were passed a vanilla int, convert to full margin object
		margin = {left: margin, top: margin, bottom: margin, right: margin};
	}
	scope.legendmargin = margin;
}

function configureLegend(chart, scope, attrs) {
	if (chart.legend && attrs.showlegend && (attrs.showlegend === 'true')) {
		initializeLegendMargin(scope, attrs);
		chart.legend.margin(scope.legendmargin);
		chart.legend.width(attrs.legendwidth === undefined ? 400 : (+attrs.legendwidth));
		chart.legend.height(attrs.legendheight === undefined ? 20 : (+attrs.legendheight));
		chart.legend.key(attrs.legendkey === undefined ? function (d) {
			return d.key;
		} : scope.legendkey());
		chart.legend.color(attrs.legendcolor === undefined ? nv.utils.defaultColor() : scope.legendcolor());
		chart.legend.align(attrs.legendalign === undefined ? true : (attrs.legendalign === 'true'));
		chart.legend.rightAlign(attrs.legendrightalign === undefined ? true : (attrs.legendrightalign === 'true'));
		chart.legend.updateState(attrs.legendupdatestate === undefined ? true : (attrs.legendupdatestate === 'true'));
		chart.legend.radioButtonMode(attrs.legendradiobuttonmode === undefined ? false : (attrs.legendradiobuttonmode === 'true'));
	}
}

function processEvents(chart, scope) {
	if (chart.dispatch) {
		if (chart.dispatch.tooltipShow) {
			chart.dispatch.on('tooltipShow.directive', function (event) {
				scope.$emit('tooltipShow.directive', event);
			});
		}

		if (chart.dispatch.tooltipHide) {
			chart.dispatch.on('tooltipHide.directive', function (event) {
				scope.$emit('tooltipHide.directive', event);
			});
		}

		if (chart.dispatch.beforeUpdate) {
			chart.dispatch.on('beforeUpdate.directive', function (event) {
				scope.$emit('beforeUpdate.directive', event);
			});
		}

		if (chart.dispatch.stateChange) {
			chart.dispatch.on('stateChange.directive', function (event) {
				scope.$emit('stateChange.directive', event);
			});
		}

		if (chart.dispatch.changeState) {
			chart.dispatch.on('changeState.directive', function (event) {
				scope.$emit('changeState.directive', event);
			});
		}
	}

	if (chart.lines) {
		chart.lines.dispatch.on('elementMouseover.tooltip.directive', function (event) {
			scope.$emit('elementMouseover.tooltip.directive', event);
		});

		chart.lines.dispatch.on('elementMouseout.tooltip.directive', function (event) {
			scope.$emit('elementMouseout.tooltip.directive', event);
		});

		chart.lines.dispatch.on('elementClick.directive', function (event) {
			scope.$emit('elementClick.directive', event);
		});
	}

	if (chart.stacked && chart.stacked.dispatch) {
		chart.stacked.dispatch.on('areaClick.toggle.directive', function (event) {
			scope.$emit('areaClick.toggle.directive', event);
		});

		chart.stacked.dispatch.on('tooltipShow.directive', function (event) {
			scope.$emit('tooltipShow.directive', event);
		});

		chart.stacked.dispatch.on('tooltipHide.directive', function (event) {
			scope.$emit('tooltipHide.directive', event);
		});

	}

	if (chart.interactiveLayer) {
		if (chart.interactiveLayer.elementMouseout) {
			chart.interactiveLayer.dispatch.on('elementMouseout.directive', function (event) {
				scope.$emit('elementMouseout.directive', event);
			});
		}

		if (chart.interactiveLayer.elementMousemove) {
			chart.interactiveLayer.dispatch.on('elementMousemove.directive', function (event) {
				scope.$emit('elementMousemove.directive', event);
			});
		}
	}

	if (chart.discretebar) {
		chart.discretebar.dispatch.on('elementMouseover.tooltip.directive', function (event) {
			scope.$emit('elementMouseover.tooltip.directive', event);
		});

		chart.discretebar.dispatch.on('elementMouseout.tooltip.directive', function (event) {
			scope.$emit('elementMouseout.tooltip.directive', event);
		});

                chart.discretebar.dispatch.on('elementClick.directive', function (event) {
                        scope.$emit('elementClick.directive', event);
                });
	}

	if (chart.multibar) {
		chart.multibar.dispatch.on('elementMouseover.tooltip.directive', function (event) {
			scope.$emit('elementMouseover.tooltip.directive', event);
		});

		chart.multibar.dispatch.on('elementMouseout.tooltip.directive', function (event) {
			scope.$emit('elementMouseout.tooltip.directive', event);
		});

		chart.multibar.dispatch.on('elementClick.directive', function (event) {
			scope.$emit('elementClick.directive', event);
		});

	}

	if (chart.pie) {
		chart.pie.dispatch.on('elementMouseover.tooltip.directive', function (event) {
			scope.$emit('elementMouseover.tooltip.directive', event);
		});

		chart.pie.dispatch.on('elementMouseout.tooltip.directive', function (event) {
			scope.$emit('elementMouseout.tooltip.directive', event);
		});
		
		chart.pie.dispatch.on('elementClick.directive', function(event) {
                	scope.$emit('elementClick.directive', event);
            	});
	}

	if (chart.scatter) {
		chart.scatter.dispatch.on('elementMouseover.tooltip.directive', function (event) {
			scope.$emit('elementMouseover.tooltip.directive', event);
		});

		chart.scatter.dispatch.on('elementMouseout.tooltip.directive', function (event) {
			scope.$emit('elementMouseout.tooltip.directive', event);
		});
	}

	if (chart.bullet) {
		chart.bullet.dispatch.on('elementMouseover.tooltip.directive', function (event) {
			scope.$emit('elementMouseover.tooltip.directive', event);
		});

		chart.bullet.dispatch.on('elementMouseout.tooltip.directive', function (event) {
			scope.$emit('elementMouseout.tooltip.directive', event);
		});
	}

	if (chart.legend) {
		//'legendClick', 'legendDblclick', 'legendMouseover'
		//stateChange
		chart.legend.dispatch.on('stateChange.legend.directive', function (event) {
			scope.$emit('stateChange.legend.directive', event);
		});
		chart.legend.dispatch.on('legendClick.directive', function (d, i) {
			scope.$emit('legendClick.directive', d, i);
		});
		chart.legend.dispatch.on('legendDblclick.directive', function (d, i) {
			scope.$emit('legendDblclick.directive', d, i);
		});
		chart.legend.dispatch.on('legendMouseover.directive', function (d, i) {
			scope.$emit('legendMouseover.directive', d, i);
		});
	}

	if (chart.controls) {
		if (chart.controls.legendClick) {
			chart.controls.dispatch.on('legendClick.directive', function (d, i) {
				scope.$emit('legendClick.directive', d, i);
			});
		}
	}

}

function configureXaxis(chart, scope, attrs) {
	if (attrs.xaxisorient) {
		chart.xAxis.orient(attrs.xaxisorient);
	}
	if (attrs.xaxisticks) {
		chart.xAxis.scale().ticks(attrs.xaxisticks);
	}
	if (attrs.xaxistickvalues) {
		if (Array.isArray(scope.$eval(attrs.xaxistickvalues))) {
			chart.xAxis.tickValues(scope.$eval(attrs.xaxistickvalues));
		} else if (typeof scope.xaxistickvalues() === 'function') {
			chart.xAxis.tickValues(scope.xaxistickvalues());
		}
	}
	if (attrs.xaxisticksubdivide) {
		chart.xAxis.tickSubdivide(scope.xaxisticksubdivide());
	}
	if (attrs.xaxisticksize) {
		chart.xAxis.tickSize(scope.xaxisticksize());
	}
	if (attrs.xaxistickpadding) {
		chart.xAxis.tickPadding(scope.xaxistickpadding());
	}
	if (attrs.xaxistickformat) {
		chart.xAxis.tickFormat(scope.xaxistickformat());
	}
	if (attrs.xaxislabel) {
		chart.xAxis.axisLabel(attrs.xaxislabel);
	}
	if (attrs.xaxisscale) {
		chart.xAxis.scale(scope.xaxisscale());
	}
	if (attrs.xaxisdomain) {
		if (Array.isArray(scope.$eval(attrs.xaxisdomain))) {
			chart.xDomain(scope.$eval(attrs.xaxisdomain));
		} else if (typeof scope.xaxisdomain() === 'function') {
			chart.xDomain(scope.xaxisdomain());
		}
	}
	if (attrs.xaxisrange) {
		if (Array.isArray(scope.$eval(attrs.xaxisrange))) {
			chart.xRange(scope.$eval(attrs.xaxisrange));
		} else if (typeof scope.xaxisrange() === 'function') {
			chart.xRange(scope.xaxisrange());
		}
	}
	if (attrs.xaxisrangeband) {
		chart.xAxis.rangeBand(scope.xaxisrangeband());
	}
	if (attrs.xaxisrangebands) {
		chart.xAxis.rangeBands(scope.xaxisrangebands());
	}
	if (attrs.xaxisshowmaxmin) {
		chart.xAxis.showMaxMin((attrs.xaxisshowmaxmin === 'true'));
	}
	if (attrs.xaxishighlightzero) {
		chart.xAxis.highlightZero((attrs.xaxishighlightzero === 'true'));
	}
	if (attrs.xaxisrotatelabels) {
		chart.xAxis.rotateLabels((+attrs.xaxisrotatelabels));
	}
	//    if(attrs.xaxisrotateylabel){
	//        chart.xAxis.rotateYLabel((attrs.xaxisrotateylabel === "true"));
	//    }
	if (attrs.xaxisstaggerlabels) {
		chart.xAxis.staggerLabels((attrs.xaxisstaggerlabels === 'true'));
	}
	if (attrs.xaxislabeldistance) {
		chart.xAxis.axisLabelDistance((+attrs.xaxislabeldistance));
	}
}

function configureX2axis (chart, scope, attrs) {
	if (attrs.x2axisorient) {
		chart.x2Axis.orient(attrs.x2axisorient);
	}
	if (attrs.x2axisticks) {
		chart.x2Axis.scale().ticks(attrs.x2axisticks);
	}
	if (attrs.x2axistickvalues) {
		if (Array.isArray(scope.$eval(attrs.x2axistickvalues))) {
			chart.x2Axis.tickValues(scope.$eval(attrs.x2axistickvalues));
		} else if (typeof scope.xaxistickvalues() === 'function') {
			chart.x2Axis.tickValues(scope.x2axistickvalues());
		}
	}
	if (attrs.x2axisticksubdivide) {
		chart.x2Axis.tickSubdivide(scope.x2axisticksubdivide());
	}
	if (attrs.x2axisticksize) {
		chart.x2Axis.tickSize(scope.x2axisticksize());
	}
	if (attrs.x2axistickpadding) {
		chart.x2Axis.tickPadding(scope.x2axistickpadding());
	}
	if (attrs.x2axistickformat) {
		chart.x2Axis.tickFormat(scope.x2axistickformat());
	}
	if (attrs.x2axislabel) {
		chart.x2Axis.axisLabel(attrs.x2axislabel);
	}
	if (attrs.x2axisscale) {
		chart.x2Axis.scale(scope.x2axisscale());
	}
	if (attrs.x2axisdomain) {
		if (Array.isArray(scope.$eval(attrs.x2axisdomain))) {
			chart.x2Axis.domain(scope.$eval(attrs.x2axisdomain));
		} else if (typeof scope.x2axisdomain() === 'function') {
			chart.x2Axis.domain(scope.x2axisdomain());
		}
	}
	if (attrs.x2axisrange) {
		if (Array.isArray(scope.$eval(attrs.x2axisrange))) {
			chart.x2Axis.range(scope.$eval(attrs.x2axisrange));
		} else if (typeof scope.x2axisrange() === 'function') {
			chart.x2Axis.range(scope.x2axisrange());
		}
	}
	if (attrs.x2axisrangeband) {
		chart.x2Axis.rangeBand(scope.x2axisrangeband());
	}
	if (attrs.x2axisrangebands) {
		chart.x2Axis.rangeBands(scope.x2axisrangebands());
	}
	if (attrs.x2axisshowmaxmin) {
		chart.x2Axis.showMaxMin((attrs.x2axisshowmaxmin === 'true'));
	}
	if (attrs.x2axishighlightzero) {
		chart.x2Axis.highlightZero((attrs.x2axishighlightzero === 'true'));
	}
	if (attrs.x2axisrotatelables) {
		chart.x2Axis.rotateLabels((+attrs.x2axisrotatelables));
	}
	//    if(attrs.xaxisrotateylabel){
	//        chart.xAxis.rotateYLabel((attrs.xaxisrotateylabel === "true"));
	//    }
	if (attrs.x2axisstaggerlabels) {
		chart.x2Axis.staggerLabels((attrs.x2axisstaggerlabels === 'true'));
	}
	if (attrs.x2axislabeldistance) {
		chart.x2Axis.axisLabelDistance((+attrs.x2axislabeldistance));
	}
}

function configureYaxis (chart, scope, attrs) {
	if (attrs.yaxisorient) {
		chart.yAxis.orient(attrs.yaxisorient);
	}
	if (attrs.yaxisticks) {
		chart.yAxis.scale().ticks(attrs.yaxisticks);
	}
	if (attrs.yaxistickvalues) {
		if (Array.isArray(scope.$eval(attrs.yaxistickvalues))) {
			chart.yAxis.tickValues(scope.$eval(attrs.yaxistickvalues));
		} else if (typeof scope.yaxistickvalues() === 'function') {
			chart.yAxis.tickValues(scope.yaxistickvalues());
		}
	}
	if (attrs.yaxisticksubdivide) {
		chart.yAxis.tickSubdivide(scope.yaxisticksubdivide());
	}
	if (attrs.yaxisticksize) {
		chart.yAxis.tickSize(scope.yaxisticksize());
	}
	if (attrs.yaxistickpadding) {
		chart.yAxis.tickPadding(scope.yaxistickpadding());
	}
	if (attrs.yaxistickformat) {
		chart.yAxis.tickFormat(scope.yaxistickformat());
	}
	if (attrs.yaxislabel) {
		chart.yAxis.axisLabel(attrs.yaxislabel);
	}
	if (attrs.yaxisscale) {
		chart.yAxis.scale(scope.yaxisscale());
	}
	if (attrs.yaxisdomain) {
		if (Array.isArray(scope.$eval(attrs.yaxisdomain))) {
			chart.yDomain(scope.$eval(attrs.yaxisdomain));
		} else if (typeof scope.yaxisdomain() === 'function') {
			chart.yDomain(scope.yaxisdomain());
		}
	}
	if (attrs.yaxisrange) {
		if (Array.isArray(scope.$eval(attrs.yaxisrange))) {
			chart.yRange(scope.$eval(attrs.yaxisrange));
		} else if (typeof scope.yaxisrange() === 'function') {
			chart.yRange(scope.yaxisrange());
		}
	}
	if (attrs.yaxisrangeband) {
		chart.yAxis.rangeBand(scope.yaxisrangeband());
	}
	if (attrs.yaxisrangebands) {
		chart.yAxis.rangeBands(scope.yaxisrangebands());
	}
	if (attrs.yaxisshowmaxmin) {
		chart.yAxis.showMaxMin((attrs.yaxisshowmaxmin === 'true'));
	}
	if (attrs.yaxishighlightzero) {
		chart.yAxis.highlightZero((attrs.yaxishighlightzero === 'true'));
	}
	if (attrs.yaxisrotatelabels) {
		chart.yAxis.rotateLabels((+attrs.yaxisrotatelabels));
	}
	if (attrs.yaxisrotateylabel) {
		chart.yAxis.rotateYLabel((attrs.yaxisrotateylabel === 'true'));
	}
	if (attrs.yaxisstaggerlabels) {
		chart.yAxis.staggerLabels((attrs.yaxisstaggerlabels === 'true'));
	}
	if (attrs.yaxislabeldistance) {
		chart.yAxis.axisLabelDistance((+attrs.yaxislabeldistance));
	}
}

function configureY1axis (chart, scope, attrs) {
	if (attrs.y1axisticks) {
		chart.y1Axis.scale().ticks(attrs.y1axisticks);
	}
	if (attrs.y1axistickvalues) {
		if (Array.isArray(scope.$eval(attrs.y1axistickvalues))) {
			chart.y1Axis.tickValues(scope.$eval(attrs.y1axistickvalues));
		} else if (typeof scope.y1axistickvalues() === 'function') {
			chart.y1Axis.tickValues(scope.y1axistickvalues());
		}
	}
	if (attrs.y1axisticksubdivide) {
		chart.y1Axis.tickSubdivide(scope.y1axisticksubdivide());
	}
	if (attrs.y1axisticksize) {
		chart.y1Axis.tickSize(scope.y1axisticksize());
	}
	if (attrs.y1axistickpadding) {
		chart.y1Axis.tickPadding(scope.y1axistickpadding());
	}
	if (attrs.y1axistickformat) {
		chart.y1Axis.tickFormat(scope.y1axistickformat());
	}
	if (attrs.y1axislabel) {
		chart.y1Axis.axisLabel(attrs.y1axislabel);
	}
	if (attrs.y1axisscale) {
		chart.y1Axis.yScale(scope.y1axisscale());
	}
	if (attrs.y1axisdomain) {
		if (Array.isArray(scope.$eval(attrs.y1axisdomain))) {
			chart.y1Axis.domain(scope.$eval(attrs.y1axisdomain));
		} else if (typeof scope.y1axisdomain() === 'function') {
			chart.y1Axis.domain(scope.y1axisdomain());
		}
	}
	if (attrs.y1axisrange) {
		if (Array.isArray(scope.$eval(attrs.y1axisrange))) {
			chart.y1Axis.range(scope.$eval(attrs.y1axisrange));
		} else if (typeof scope.y1axisrange() === 'function') {
			chart.y1Axis.range(scope.y1axisrange());
		}
	}
	if (attrs.y1axisrangeband) {
		chart.y1Axis.rangeBand(scope.y1axisrangeband());
	}
	if (attrs.y1axisrangebands) {
		chart.y1Axis.rangeBands(scope.y1axisrangebands());
	}
	if (attrs.y1axisshowmaxmin) {
		chart.y1Axis.showMaxMin((attrs.y1axisshowmaxmin === 'true'));
	}
	if (attrs.y1axishighlightzero) {
		chart.y1Axis.highlightZero((attrs.y1axishighlightzero === 'true'));
	}
	if (attrs.y1axisrotatelabels) {
		chart.y1Axis.rotateLabels((+scope.y1axisrotatelabels));
	}
	if (attrs.y1axisrotateylabel) {
		chart.y1Axis.rotateYLabel((attrs.y1axisrotateylabel === 'true'));
	}
	if (attrs.y1axisstaggerlabels) {
		chart.y1Axis.staggerlabels((attrs.y1axisstaggerlabels === 'true'));
	}
	if (attrs.y1axislabeldistance) {
		chart.y1Axis.axisLabelDistance((+attrs.y1axislabeldistance));
	}
}

function configureY2axis (chart, scope, attrs) {
	if (attrs.y2axisticks) {
		chart.y2Axis.scale().ticks(attrs.y2axisticks);
	}
	if (attrs.y2axistickvalues) {
		chart.y2Axis.tickValues(scope.$eval(attrs.y2axistickvalues));
	}
	if (attrs.y2axisticksubdivide) {
		chart.y2Axis.tickSubdivide(scope.y2axisticksubdivide());
	}
	if (attrs.y2axisticksize) {
		chart.y2Axis.tickSize(scope.y2axisticksize());
	}
	if (attrs.y2axistickpadding) {
		chart.y2Axis.tickPadding(scope.y2axistickpadding());
	}
	if (attrs.y2axistickformat) {
		chart.y2Axis.tickFormat(scope.y2axistickformat());
	}
	if (attrs.y2axislabel) {
		chart.y2Axis.axisLabel(attrs.y2axislabel);
	}
	if (attrs.y2axisscale) {
		chart.y2Axis.yScale(scope.y2axisscale());
	}
	if (attrs.y2axisdomain) {
		if (Array.isArray(scope.$eval(attrs.y2axisdomain))) {
			chart.y2Axis.domain(scope.$eval(attrs.y2axisdomain));
		} else if (typeof scope.y2axisdomain() === 'function') {
			chart.y2Axis.domain(scope.y2axisdomain());
		}
	}
	if (attrs.y2axisrange) {
		if (Array.isArray(scope.$eval(attrs.y2axisrange))) {
			chart.y2Axis.range(scope.$eval(attrs.y2axisrange));
		} else if (typeof scope.y2axisrange() === 'function') {
			chart.y2Axis.range(scope.y2axisrange());
		}
	}
	if (attrs.y2axisrangeband) {
		chart.y2Axis.rangeBand(scope.y2axisrangeband());
	}
	if (attrs.y2axisrangebands) {
		chart.y2Axis.rangeBands(scope.y2axisrangebands());
	}
	if (attrs.y2axisshowmaxmin) {
		chart.y2Axis.showMaxMin((attrs.y2axisshowmaxmin === 'true'));
	}
	if (attrs.y2axishighlightzero) {
		chart.y2Axis.highlightZero((attrs.y2axishighlightzero === 'true'));
	}
	if (attrs.y2axisrotatelabels) {
		chart.y2Axis.rotateLabels((+scope.y2axisrotatelabels));
	}
	if (attrs.y2axisrotateylabel) {
		chart.y2Axis.rotateYLabel((attrs.y2axisrotateylabel === 'true'));
	}
	if (attrs.y2axisstaggerlabels) {
		chart.y2Axis.staggerlabels((attrs.y2axisstaggerlabels === 'true'));
	}
	if (attrs.y2axislabeldistance) {
		chart.y2Axis.axisLabelDistance((+attrs.y2axislabeldistance));
	}
}
}());