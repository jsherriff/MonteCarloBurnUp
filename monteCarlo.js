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

	var maxIterations = 20;
	var iterations = createXAxisLabels(maxIterations);

	var noRuns = 500;
	var targetScope = 40

	var projectionRoot = {
		x: burnUp.length - 1,
		y: burnUp[burnUp.length -1],
		remaining: noRuns,
		parent: null,
		children: []
	};

	var endCounts = {};
	var pathEnds = [];
	var toProcess = [ projectionRoot ];

	while(toProcess.length > 0){
		var current = toProcess.pop();
		var remaining = current.remaining;

		// check if this path is done
		if(current.y === targetScope){
			// add it to the right histogram bucket
			endCounts[current.x] = (endCounts[current.x] || 0) + 1;

			// add it to the set of endings
			pathEnds.push(current);

			continue;
		}

		// create bucketed counts of new endings for this step in the path (newY -> newYObj)
		var newYs = {};
		for(var i=0; i < remaining; i++){
			var randVelocity = _.sample(velocities);
			var newY = current.y + randVelocity;

			// clip to the target scope
			if(newY > targetScope){
				newY = targetScope;
			}

			// create the obj if necessary
			var newYObj = newYs[newY] = newYs[newY] || {
				y: newY,
				count: 0
			};
			newYObj.count++;
		}

		// convert buckets into new points to process
		_.each(newYs, function(newYObj){
			var child = {
				x: current.x + 1,
				y: newYObj.y,
				remaining: newYObj.count,
				parent: current,
				children: []
			}
			current.children.push(child);
			toProcess.push(child);
		});
	}

	console.log('endCounts:', endCounts);


	/*
		Goal:

		paths = [
			{
				x: 5,
				y: 18,
				runs: 10,000
				paths: [
					{
						x: 6,
						y:
					}
				]
			}
		]

		// for histogram and finding path with max
		endCounts = {
			15 <iteration> : 100 <number of runs that ended in on this iteration
		}

		chart series
		-------------

		projectionStart = {
			x: burnUp.length - 1,
			y: burnUp[burnUp.length -1],
		}

		series[i] = {
			data: [null x burnUp.length -1, projectionStart, projectionY1, projectionY2],
			showInLegend: false, // unless Px
			name: 'Px',
			style: boldness based on number of peole on path at each step
		}
	*/


	var series = [
		{
			data: burnUp,
			name: 'Actual'
		}
	];

	// walk tree to convert paths to series
	//TODO optimize to avoid overhead of repeated unshifts
	_.each(pathEnds, function(end, i){
		var data = [];
		var current = end;
		while(current != null){
			data.unshift({
				x: current.x,
				y: current.y
			});
			current = current.parent;
		}

		var show = i % 5 === 0;
		series.push({
			data: data,
			name: 'Path '+i,
			dashStyle: 'Dash',
			color: '#FF8000',
			marker: {
				symbol: 'circle'
			},
			showInLegend: show,
			visible: show
		});
	});

	$('#container').highcharts({
		chart: {
			zoomType: 'xy'
		},
		title: {
			text: 'Monte Carlo Burn Up'
		},
		xAxis: {
			categories: iterations,
			title: {
				text: 'Iteration'
			}
		},
		yAxis: {
			title: {
				text: 'Count'
			}
		},
		series: series
	});

});