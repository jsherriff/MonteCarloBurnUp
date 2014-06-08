$(function () {
	debugger;
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

	// var burnUp = [1, 5, 9, 15, 18];
	var burnUp = [1, 5];

	var velocities = calcVelocities(burnUp);
	console.log("velocities = ", velocities);

	var maxIterations = 20;
	var iterations = createXAxisLabels(maxIterations);

	var noRuns = 100;
	var targetScope = 15;

	projectionRoot = {
		x: burnUp.length - 1,
		y: burnUp[burnUp.length -1],
		remaining: noRuns,
		children: []
	};

	var endCounts = {};

	var series = [
		{
			data: burnUp,
			name: 'Actual'
		}
	];

	var nextSeries = 1;

	var processNode = function(parentSeries, node, createNewSeries){
		// console.log("processing node ("+ node.x +", "+ node.y+"), parentSeries.name = "+ parentSeries.name+
		// 	", createNewSeries =  "+ createNewSeries);
		var pathSeries;
		if(createNewSeries){
			// var show = nextSeries < 3;
			var show = true;
			pathSeries = {
				data: parentSeries.data.slice(0),
				name: 'Path '+ nextSeries++,
				dashStyle: 'Dash',
				color: '#FF8000',
				marker: {
					symbol: 'circle'
				},
				visible: show,
				showInLegend: show

			};
			series.push(pathSeries);
			// console.log("creating path "+ pathSeries.name);
		}
		else{
			pathSeries = parentSeries;
		}

		pathSeries.data.push({
			x: node.x,
			y: node.y
		});


		// figure out children
		if(node.y < targetScope){
			for(var i=0, l=velocities.length; i < l; i++){
				var newY = node.y + velocities[i];
				if(newY > targetScope){
					newY = targetScope;
				}
				var child = {
					x: node.x +1,
					y: newY,
					remaining: node.remaining / l,
					children: []
				};
				node.children.push(child)
			}
		}
		else{
			// console.log("finishing node ("+ node.x +", "+ node.y+"), parentSeries.name = "+ parentSeries.name+
			// 	", pathSeries.name = "+ pathSeries.name +", createNewSeries =  "+ createNewSeries);
		}

		// // create bucketed counts of new endings for this step in the path (newY -> newYObj)
		// for(var i=0; i < remaining; i++){
		// 	var randVelocity = _.sample(velocities);
		// 	var newY = current.y + randVelocity;

		// 	// clip to the target scope
		// 	if(newY > targetScope){
		// 		newY = targetScope;
		// 	}

		// 	// create the obj if necessary
		// 	var newYObj = newYs[newY] = newYs[newY] || {
		// 		y: newY,
		// 		count: 0,
		// 		parents: []
		// 	};
		// 	newYObj.count++;
		// 	newYObj.parents = _.union(newYObj.parents, [current]);
		// }


		_.eachRight(node.children, function(child, i){
			var newSeries = i != 0;
			processNode(pathSeries, child, newSeries);
		});
	};

	var dummyParentSeries = {
		data: [],
		name: 'dummy'
	};
	processNode(dummyParentSeries, projectionRoot, true);



	/*

	// iteration to process (outer array is iteration, inner is children to process in that iteration)
	var iterationNodes = [projectionRoot];
	var nextIterationNodes = [];
	var newYs = {};

	while(iterationNodes.length > 0){

		var current = iterationNodes.pop();
		var remaining = current.remaining;

		// check if this path is done
		if(current.y === targetScope){
			// add it to the right histogram bucket
			endCounts[current.x] = (endCounts[current.x] || 0) + current.remaining;
		}
		else{

			// create bucketed counts of new endings for this step in the path (newY -> newYObj)
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
					count: 0,
					parents: []
				};
				newYObj.count++;
				newYObj.parents = _.union(newYObj.parents, [current]);
			}

		}

		// check if it's time to move on to the next iteration
		if(iterationNodes.length === 0){

			// convert buckets into new points to process
			_.each(newYs, function(newYObj){
				var child = {
					x: current.x + 1,
					y: newYObj.y,
					remaining: newYObj.count,
					children: []
				}

				_.each(newYObj.parents, function(parent){
					parent.children.push(child);
				});
				nextIterationNodes.push(child);
			});

			iterationNodes = nextIterationNodes;
			nextIterationNodes = [];
			newYs = {};
		}

	}

	console.log('endCounts:', endCounts);




	var series = [
		{
			data: burnUp,
			name: 'Actual'
		}
	];

	var nextSeries = 1;

	var processChild = function(parentSeriesData, child, createNewSeries){
		var pathSeriesData;
		if(createNewSeries){
			var show = nextSeries < 3;
			pathSeriesData = parentSeriesData;
			var pathSeries = {
				data: pathSeriesData,
				name: 'Path '+ nextSeries++,
				dashStyle: 'Dash',
				color: '#FF8000',
				marker: {
					symbol: 'circle'
				},
				visible: show,
				showInLegend: show

			};
			series.push(pathSeries);
		}
		else{
			pathSeriesData = parentSeriesData;
		}

		pathSeriesData.push({
			x: child.x,
			y: child.y
		});

		var parentCopy = pathSeriesData.slice(0);

		_.each(child.children, function(child, i){
			var newSeries = i != 0;
			parentSeriesData = newSeries ? parentCopy : pathSeriesData;
			processChild(parentSeriesData, child, i != 0);
		});
	};

	processChild([], projectionRoot, true);
*/

	// walk tree to convert paths to series
	//TODO optimize to avoid overhead of repeated unshifts
	// _.each(pathEnds, function(end, i){
	// 	var data = [];
	// 	var current = end;
	// 	while(current != null){
	// 		data.unshift({
	// 			x: current.x,
	// 			y: current.y
	// 		});
	// 		current = current.parent;
	// 	}

	// 	// var show = i % 5 === 0;
	// 	var show = true;

	// 	series.push({
	// 		data: data,
	// 		name: 'Path '+i,
	// 		dashStyle: 'Dash',
	// 		color: '#FF8000',
	// 		marker: {
	// 			symbol: 'circle'
	// 		},
	// 		showInLegend: show,
	// 		visible: show
	// 	});
	// });

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