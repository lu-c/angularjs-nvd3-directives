
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
        , labelLine = null
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
            $(this).prepend($('<defs>' +
            '<linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">' +
            '<stop offset="0%" style="stop-color:rgb(211,211,211);stop-opacity:1"/>' +
            '<stop offset="100%" style="stop-color:rgb(255,255,255);stop-opacity:1"/>' +
            '</linearGradient></defs>'))

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
            var gEnter = wrap.enter().append('g').attr({'class': 'nvd3 nv-wrap nv-multiBarWithLegend'}).append('g');
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
            _.each($(this).children('.redrawElement'), function(line) {
                $(line).remove();
            })
            container.append('line').attr({
                x1: margin.left,
                y1: watermark,
                x2: availableWidth+margin.left,
                y2: watermark,
                fill: "rgb(150,150,150)",
                class: 'redrawElement'
            }).style("stroke", '#000')

            var labelx = (labelLine == "left") ? margin.left/2 : (availableWidth + margin.left + margin.right/2);
            container.append('text').attr({
                x: labelx,
                y: watermark,
                fill: "rgb(150,150,150)",
                "text-anchor": "middle",
                "dominant-baseline": "central",
                class: 'redrawElement'
            }).text(data.line).style("font-size", "15px")

            container.append('text').attr({
                x: labelx,
                y: watermark+20,
                fill: "rgb(150,150,150)",
                "text-anchor": "middle",
                "dominant-baseline": "central",
                class: 'redrawElement'
            }).text("AVG").style("font-size", "15px")

            var containerBounds = that.getBoundingClientRect()
            var bars = []

            _.each($(this).find('.nv-group'), function(group, i) {
                _.each($(group).find('rect'), function(rect, j) {
                    var barValue = Number(data.data[i].values[j][1].toFixed(1)),
                        rectBounds = rect.getBoundingClientRect(),
                        barWidth = Number($(rect).attr("width")),
                        barLeft = rectBounds.x - containerBounds.x

                    bars.push({left: Number((barLeft).toFixed(1)), right: Number((barLeft + barWidth).toFixed(1))})

                    container.append('text').attr({
                        x: barLeft + barWidth/2,
                        y: availableHeight - margin.top/2,
                        fill: "white",
                        "text-anchor": "middle",
                        "dominant-baseline": "ideographic",
                        class: 'redrawElement'
                    }).text(barValue).style("font-size", "15px")
                })
            })

            bars = _.sortBy(bars, function(n) { return n.left; });
            var series = [], currentSeries = {left: bars[0].left, right: bars[0].right}, lastBar = null;

            for(var _i = 1; _i < bars.length; _i++) {
                var bar = bars[_i]
                if (currentSeries.right == bar.left) {
                    currentSeries.right = bar.right;
                }
                else {
                    series.push(currentSeries);
                    currentSeries = {};
                    currentSeries.left = bar.left;
                    currentSeries.right = bar.right;
                }
            }
            series.push(currentSeries);

            _.each(series, function(s) {
                container.insert('rect',":first-child").attr({
                    x: s.left,
                    y: margin.top,
                    width: s.right - s.left,
                    height: 100,
                    fill: "url(#grad2)",
                    "text-anchor": "middle",
                    "dominant-baseline": "ideographic",
                    class: 'redrawElement'
                }).style("font-size", "15px")
            })

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


    chart.labelLine = function(_) {
        if (!arguments.length) return labelLine;
        labelLine = _;
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
