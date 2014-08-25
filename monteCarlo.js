$(function () {
	var seriesColor = "#0000ff";
	var maximumNumberOfMonteCarloRuns = 1000;

	var probabilityVisualization = "filled" // "filled", "original", "dots" or "lines" or "none"


	var query = function() {
		return [];

	}

	var transform = function(data) {
		var burnUp = [1, 5, 9, 15, 18];

		/**
		 * calculate the velocities of the current iterations
		 * @return an array of the velocity values
		 */
		var calcVelocities = function(burnUp){
			var velocities;
			if(burnUp == null || burnUp.length === 0){
				velocities = [1];
			}
			else if(burnUp.length === 1){
				velocities = [ burnUp[0] ];
			}
			else{
				velocities = [];
				var prev = 0;
				for(var i=0, l=burnUp.length; i < l; i++){
					var burn = burnUp[i];
					velocities.push(burn - prev);
					prev = burn;
				}
			}
			return velocities;
		};

		return {
			targetScope : 40,
			iterationsComplete : burnUp.length,
			pointsComplete : burnUp,
			velocities: calcVelocities(burnUp)
		};
	}






	var shadeColor = function(color, percent) {
		var num = parseInt(color.slice(1),16), amt = Math.round(2.55 * percent), R = (num >> 16) + amt, G = (num >> 8 & 0x00FF) + amt, B = (num & 0x0000FF) + amt;
		return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
	};
	var calculateColorToUse = function(iterationIndex, mostLikelyIterationIndex) {
		var gradients = (iterationIndex < mostLikelyIterationIndex) ? (mostLikelyIterationIndex - firstIndex) + 1 : (lastIndex - mostLikelyIterationIndex) + 1;
		var gradient = (mostLikelyIterationIndex === iterationIndex)? 1.0 : 1.0 - ((1.0 / gradients) * Math.abs(mostLikelyIterationIndex - iterationIndex));
		var colorToUse = 'rgba(0,0,255,' + gradient + ')';
		// console.log("Shade percent", shadePercent);
		// console.log("Shade color", colorToUse);
		if (iterationIndex == mostLikelyIterationIndex) {
			colorToUse = "purple";
		}
		return colorToUse;
	}
	var calculateDashStyleToUse = function(iterationIndex, mostLikelyIterationIndex) {
		var dashStyle = "Dot";
		if (iterationIndex == mostLikelyIterationIndex) {
			dashStyle = "purple";
		}
		return dashStyle;
	}






	var dataToVisualize = transform(query());







	// run the simulation
	var possibilities = [];
	var maxX = 0;
	var firstSeriesIndex = 0, lastSeriesIndex = 0, mostLikelySeriesIndex = 0;

	var start = {
		iteration: dataToVisualize.iterationsComplete - 1,
		pointsComplete: dataToVisualize.pointsComplete[dataToVisualize.iterationsComplete - 1]
	};


	for(var i=0; i < maximumNumberOfMonteCarloRuns; i++){
		var current = start;
		var path = [current];

		// keep going until we get there or give up hope
		while(current.pointsComplete < dataToVisualize.targetScope) {//} && current.x < maxIterations){

			var randVelocity = _.sample(dataToVisualize.velocities);
			var newY = current.pointsComplete + randVelocity;

			// clip to the target scope
			if(newY > dataToVisualize.targetScope){
				newY = dataToVisualize.targetScope;
			}

			current = {
				iteration: current.iteration +1,
				pointsComplete: newY
			}
			path.push(current);

			if(current.pointsComplete === dataToVisualize.targetScope){
				possibilities.push(path);
				maxX = Math.max(maxX, current.iteration);
			}
		}
	}
	// end the simulation



	// build histogram data
	var countsByIteration = _.map(Array(maxX+1), function() { return 0; });
	_.each(possibilities, function(possibility, idx){
		// update the count by getting the last iteration in the
		// possibility and incrementing that slot
		countsByIteration[_.last(possibility).iteration]++
	});

	// determine with iteration (index) has the highest frequency
	var mostLikelyIteration = _.indexOf(countsByIteration, _.max(countsByIteration));
	var firstIndex = _.findIndex(countsByIteration, function(iter) {
  		return iter !== 0;
	});
	var lastIndex = maxX;  // unnecessary, but ...




	var todaysIterationIndex = dataToVisualize.iterationsComplete - 1;
	var burnupSeriesData = [
		{
			data: dataToVisualize.pointsComplete,
			name: 'Actual'
		}
	];



	var showPathsModulo = 50;


	// the number of series showing per iteration. this is used to
	// ensure we dont' show too many
	var seriesCountPerIteration = _.map(Array(maxX+1), function() { return 0; });

	_.each(possibilities, function(path, i) {

		var iteration = _.last(path).iteration;

		// let's ensure we show one line for each iteration
		if (seriesCountPerIteration[iteration] > 0 && i % showPathsModulo !== 0) return;
		seriesCountPerIteration[iteration]++;

		var endsOnMax = (_.last(path).iteration == mostLikelyIteration);

		var seriesData = _.map(path, function(pathPoint, idx){
			return {
				x: pathPoint.iteration,
				y: pathPoint.pointsComplete
			}
		});

		_.last(seriesData).marker = {
			enabled: true,
			symbol: endsOnMax ? 'circle' : 'triangle',
			radius: 4
		}

		var colorToUse = calculateColorToUse(iteration, mostLikelyIteration);
		var dashStyle = calculateDashStyleToUse(iteration, mostLikelyIteration);

		// "just connect first and last"
		if (seriesData.length > 2 && (probabilityVisualization === "lines" || probabilityVisualization === "filled" || probabilityVisualization === "dots" || probabilityVisualization ===  "none" ) ) {
			seriesData[1] = seriesData[seriesData.length-1];
			seriesData.length = 2;
			if (probabilityVisualization === "lines") {
				dashStyle = "purple";
			}
		}
		// and ensure only one instance of each
		if ((probabilityVisualization === "none" && iteration === mostLikelyIteration) || probabilityVisualization === "original" || (probabilityVisualization === "lines" || probabilityVisualization === "filled" || probabilityVisualization === "dots") && !_.find(burnupSeriesData, function(series) {
			return series.data[1].x === seriesData[1].x
		})) {

			burnupSeriesData.push({
				data: seriesData,
				dashStyle: dashStyle,
				color: colorToUse,
				marker: {
					symbol: 'circle',
					radius: 2
				},
				showInLegend: false,
				lineWidth: 2
			});
			if (iteration === firstIndex)
				firstSeriesIndex = burnupSeriesData.length -1;
			if (iteration === mostLikelyIteration)
				mostLikelySeriesIndex = burnupSeriesData.length -1;
			if (iteration === lastIndex)
				lastSeriesIndex = burnupSeriesData.length -1;
		}
	});

	// both charts
	var xAxisCategories = _.map(Array(maxX+1), function(v,i) { return i; });


	var histogramSeries = _.map(countsByIteration, function(frequency,iteration) {
		var shadePercent = Math.abs(mostLikelyIteration-iteration) * 20;
		var colorToUse = calculateColorToUse(iteration, mostLikelyIteration)

		return { x: iteration, y: frequency , color: colorToUse };
	});




	$('#burnup').highcharts({
		chart : {
			marginLeft:100,
			marginTop:5
		},
		title: {
			text: ''
		},
		xAxis: {
			// categories: iterations,
			min: 0,
			max: maxX,
			categories: xAxisCategories,
			plotLines: [
				{
					color: '#00AAFF',
					value: todaysIterationIndex,
					width: 2,
					label: {
						text: 'TODAY',
						verticalAlign: 'bottom',
						textAlign: 'right',
						y: -10,
						style: {
							color: '#00AAFF'
						}
					}
				}, {
					value: mostLikelyIteration,
					width: 2,
					color: calculateColorToUse(mostLikelyIteration,mostLikelyIteration),
					label: {
						text: 'PROBABLE FINISH',
						verticalAlign: 'bottom',
						textAlign: 'right',
						y: -10,
						style: {
							color: calculateColorToUse(mostLikelyIteration,mostLikelyIteration)
						}
					}
				}
			],
			title: {
				text: 'Iteration'
			}
		},
		yAxis: {
			// title: {
			// 	text: 'Count'
			// },
			max: dataToVisualize.targetScope,
			min: 0
		},
		series: burnupSeriesData,
		credits : {
			enabled:false
		}

		// add 'cone of uncertainty'
	}, function(chart) {
		if (probabilityVisualization !== "filled") {
			return;
		}
		var i;
		var bbox1 = chart.series[0].data[todaysIterationIndex].graphic.element.getBBox();
		if (chart.series[0].data.length < 2)
			return;
		var spacing = (chart.series[0].data[1].plotX - chart.series[0].data[0].plotX) / 2;

		for (i=1; i < chart.series.length; i++) {
			var bbox2 = chart.series[i].graph.element.getBBox();
			// "y"'s for all but the first are wacky 
			var plotY=chart.plotTop+4; // fudge factor?
			var path = ['M', chart.plotLeft+bbox1.x, plotY+bbox1.y+2, 'L', chart.plotLeft+bbox2.x+bbox2.width-spacing, /* bug? bbox2.y */ plotY+bbox1.y-bbox2.height, 'L', chart.plotLeft+bbox2.x+bbox2.width+spacing, plotY+bbox1.y-bbox2.height, 'Z' ];
			var attr = {
				//'stroke-width': 1,
				//stroke: 'red',
				fill: chart.series[i].color,
				zIndex: 10
			};
			chart.series[i].setVisible(false);
			chart.renderer.path(path).attr(attr).add();
		}
	});










	$('#histogram').highcharts({
		chart: {
			type: 'column',
			marginLeft:100,
			marginBottom:0
		},
		tooltip : {
			enabled:false
		},
		title: {
			text: ''
		},
		plotOptions: {
			column : {
				dataLabels: {
					formatter: function() { return this.y == 0 ? '' : this.y ;},
					enabled:true
				}
			}
		},
		legend: {
			enabled: false
		},
		xAxis: {
			// showFirstLabel: false,
			labels: {
				enabled:false
			},
			// lineColor:'transparent',
			categories: xAxisCategories,
			min: 0,
			max: maxX,
			tickLength: 0
		},
		yAxis: {
			style: {
				color: '#00AAFF'
			},
			showFirstLabel: false,
			labels: {
				style: {
					color: '#00AAFF'

				}
				// rotation:90
			},
			title: {
				text: 'Frequency'
			},
			min: 0
		},
		series: [{
			name: 'Counts',
			color: '#00AAFF',

			data: histogramSeries
		}],
		credits : {
			enabled:false
		}
	});

});
