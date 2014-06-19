$(function () {
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

	var createXAxisLabels = function(maxIterations){
		var iterations = [];
		for(var i=1; i < maxIterations; i++){
			iterations.push('' + i);
		}
		return iterations;
	};

	var burnUp = [1, 5, 9, 15, 18];

	var velocities = calcVelocities(burnUp);
	console.log("velocities = ", velocities);

	var maxIterations = 20;
	var iterations = createXAxisLabels(maxIterations);

	var noRuns = 1000;
	var targetScope = 40;

	var pathMap = {};
	var endCounts = {};

	var start = {
		x: burnUp.length - 1,
		y: burnUp[burnUp.length -1]
	};

	for(var i=0; i < noRuns; i++){
		var current = start;
		var path = [current];

		// keep going until we get there or give up hope
		while(current.y < targetScope && current.x < maxIterations){

			var randVelocity = _.sample(velocities);
			var newY = current.y + randVelocity;

			// clip to the target scope
			if(newY > targetScope){
				newY = targetScope;
			}

			current = {
				x: current.x +1,
				y: newY
			}
			path.push(current);

			if(current.y === targetScope){
				var pathStr = _.pluck(path, 'y').join('/');

				pathMap[pathStr] = pathMap[pathStr] || path;
				endCount = endCounts[current.x] = endCounts[current.x] || {
					x: current.x,
					y: 0
				};
				endCount.y++;
			}

		}
	}

	console.log('endCounts:', endCounts);

	var series = [
		{
			data: burnUp,
			name: 'Actual',
			color: '#FF0000'
		}
	];

	var nextSeries = 1;

	var lastIterIndex = _.max(endCounts, 'x').x;
	console.log('lastIterIndex: ', lastIterIndex);

	var maxIter = _.max(endCounts, 'y');
	console.log('maxIter: ', maxIter);

	var showPathsModulo = 50;

	_.each(pathMap, function(path, i){
		var lastPoint = _.last(path);
		var endsOnMax = (lastPoint.x == maxIter.x);

		_.last(path).marker = {
			enabled: true,
			symbol: endsOnMax ? 'circle' : 'triangle',
			radius: 4
		}

		series.push({
			data: path,
			name: 'Path '+ nextSeries++,
			dashStyle: 'Dash',
			color: endsOnMax ? '#0000FF' : '#FF8000',
			marker: {
				symbol: 'circle',
				radius: 2
			},
			showInLegend: false,
			visible: (nextSeries % showPathsModulo === 0)
		});
	});


	$('#burnup').highcharts({
		chart: {
			zoomType: 'xy'
		},
		title: {
			text: 'Monte Carlo Burn Up'
		},
		xAxis: {
			categories: iterations,
			min: 0,
			max: lastIterIndex,
			plotLines: [
				{
					color: '#00AAFF',
					value: start.x,
					width: 2,
					label: {
						text: 'TODAY',
						style: {
							color: '#00AAFF'
						}
					}
				}
			],
			title: {
				text: 'Iteration'
			}
		},
		yAxis: {
			title: {
				text: 'Count'
			}
		},
		series: series,
		credits: {
			enabled: false
		}
	});

	var end = _.map(endCounts, function(count, iterIndex){
		return {
			x: parseInt(iterIndex, 10),
			y: count
		};
	});

	var histogramPoints = _.values(endCounts);
	console.table(histogramPoints);

	var histogramSeries = [
		{
			name: 'Counts',
			data: histogramPoints
		}
	];

	var histogramEnds = iterations.slice(0);
	console.log(histogramEnds);

	$('#histogram').highcharts({

		chart: {
			type: 'column',
			zoomType: 'xy'
		},
		title: {
			text: 'Histogram'
		},
		plotOptions: {
			column: {
				borderWidth: 1,
				pointPadding: 0,
				groupPadding: 0
			}
		},
		legend: {
			enabled: false
		},
		xAxis: {
			categories: histogramEnds,
			min: 0,
			max: lastIterIndex
		},
		yAxis: {
			min: 0,
			title: {
				text: 'Count'
			}
		},
		series: histogramSeries,
		credits: {
			enabled: false
		}
	});

});