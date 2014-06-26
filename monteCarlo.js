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


	var burnUp = [1, 5, 9, 15, 18];
	var targetScope = 40;





	var velocities = calcVelocities(burnUp);
	console.log("Velocities", velocities)

	var maxIterations = 20;

	var noRuns = 500;

	var possibilities = [];
	var endCounts = {};

	var start = {
		x: burnUp.length - 1,
		y: burnUp[burnUp.length -1]
	};


	var maxX = 0;

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
				//var pathStr = _.pluck(path, 'y').join('/');
				possibilities.push(path);
				maxX = Math.max(maxX, current.x);
				// pathMap[pathStr] = pathMap[pathStr] || path;
				endCount = endCounts[current.x] = endCounts[current.x] || {
					x: current.x,
					y: 0
				};
				endCount.y++;
			}
		}
	}
	// console.log("pathMap", pathMap);

	console.log('endCounts:', endCounts);


	// build histogram data
	var countsByIteration = _.map(Array(maxIterations), function() { return 0; });
	_.each(possibilities, function(possibility, idx){
		// update the count by getting the last iteration in the
		// possibility and incrementing that slot
		countsByIteration[_.last(possibility).x]++
	});
	var mostLikelyIteration = _.indexOf(countsByIteration, _.max(countsByIteration));

	console.log("countsByIteration",countsByIteration);
	console.log("maxX", maxX);
	console.log("mostLikelyIteration",mostLikelyIteration);




	var series = [
		{
			data: burnUp,
			name: 'Actual',
			color: '#FF0000'
		}
	];



	var lastIterIndex = _.max(endCounts, 'x').x;
	console.log('lastIterIndex: ', lastIterIndex);

	var maxIter = _.max(endCounts, 'y');
	console.log('maxIter: ', maxIter);

	var showPathsModulo = 50;
	var nextSeries = 1;

	_.each(possibilities, function(path, i){
		if ((i % showPathsModulo) !== 0) { return; }

		var endsOnMax = (_.last(path).x == mostLikelyIteration);

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
			showInLegend: false
		});
	});















	var createXAxisLabels = function(maxIterations){
		var iterations = [];
		for(var i=1; i < maxIterations; i++){
			iterations.push('' + i);
		}
		return iterations;
	};
	var iterations = createXAxisLabels(maxIterations);



	$('#burnup').highcharts({
		chart: {
			zoomType: 'xy'
		},
		title: {
			text: ''
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
			},
			max:targetScope,
			min: 0
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
	console.log("Histogram Ends", histogramEnds);

	$('#histogram').highcharts({

		chart: {
			type: 'column',
			zoomType: 'xy'
		},
		title: {
			text: ''
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
			labels: {
				enabled:false
			},
			lineWidth: 0,
			minorGridLineWidth:0,
			lineColor:'transparent',
			minorTickLength:0,
			tickLength:0,
			categories: histogramEnds,
			min: 0,
			max: lastIterIndex
		},
		yAxis: {
			min: 0,
			title: {
				text: ''
			},
			labels: { enabled:false },
			minorGridLineWidth:0,
			gridLineWidth:0
		},
		series: histogramSeries,
		credits: {
			enabled: false
		}
	});

});
