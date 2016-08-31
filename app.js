//
// Define the 'app' module.
//
(function(){
	
var workflow = angular.module('app', ['flowChart']).factory('prompt', function () {
	// Return the browsers prompt function.
	return prompt;
});
workflow.factory("NodeFactory",function(){
	
	_create1I1OConnector = function (nodeType , nodeName , dataSourceId , appName,processType){
		
		var newNodeDataModel = {
				appName : appName,
				name: nodeName,
				nodeType :nodeType,
				datasourceId: dataSourceId,
				id: new Date().getTime(),
				processType: processType,
				x: -1230,
				y: 200,
				inputConnectors: [ 
					{
	                    name: "X"
	                }
	                		
				],
				outputConnectors: [ 
					{
	                    name: "1"
	                }
	                			
				]
			};
		return newNodeDataModel;
	};
	
	
	function createConnectorFactory(nodeType, nodeName, dataSourceId , appName){
		
		var result ;
		switch(nodeType){
			case 'node_datasource' : result = _create1I1OConnector(nodeType , nodeName , dataSourceId ,appName, "data_source"); break;
			case 'node_Custom_Query' : result = _create1I1OConnector(nodeType , nodeName , dataSourceId , appName, "custom_query"); break;
			default : result = '';
		}
		return result;
	}
	
	
	return {
		getNode : createConnectorFactory
	};
	
});
workflow.controller('AppCtrl', ['$scope','prompt','NodeFactory', function($scope, prompt, NodeFactory) {
	//Static json for showing graph
	var chartDataModel = {"nodes":[{"appName":"checkhbaseload","name":"checkNode","nodeType":"node_Custom_Query","datasourceId"
		:null,"id":1469207874870,"processType":"custom_query","x":-480.800048828125,"y":283.5999755859375,"inputConnectors"
		:[{"name":"X"}],"outputConnectors":[{"name":"1"}]},{"appName":"checkhbaseload","name":"check","nodeType"
		:"node_datasource","datasourceId":1977,"id":1469276319919,"processType":"data_source","x":-1230,"y":200
		,"inputConnectors":[{"name":"X"}],"outputConnectors":[{"name":"1"}]}],"connections":[{"source":{"nodeID"
		:1469276319919,"connectorIndex":0},"dest":{"nodeID":1469207874870,"connectorIndex":0}}]};
	
	var deleteKeyCode = 46;
	var ctrlKeyCode = 17;
	var ctrlDown = false;
	var aKeyCode = 65;
	var escKeyCode = 27;
	var nextNodeID = 10;


	//
	// Event handler for key-down on the flowchart.
	//
	$scope.keyDown = function (evt) {

		if (evt.keyCode === ctrlKeyCode) {

			ctrlDown = true;
			evt.stopPropagation();
			evt.preventDefault();
		}
	};

	//
	// Event handler for key-up on the flowchart.
	//
	$scope.keyUp = function (evt) {

		if (evt.keyCode === deleteKeyCode) {
			//
			// Delete key.
			//
			$scope.chartViewModel.deleteSelected();
		}

		if (evt.keyCode == aKeyCode && ctrlDown) {
			// 
			// Ctrl + A
			//
			$scope.chartViewModel.selectAll();
		}

		if (evt.keyCode == escKeyCode) {
			// Escape.
			$scope.chartViewModel.deselectAll();
		}

		if (evt.keyCode === ctrlKeyCode) {
			ctrlDown = false;

			evt.stopPropagation();
			evt.preventDefault();
		}
	};

	//
	// Add a new node to the chart.
	//
	$scope.addNewNode = function () {

		var nodeName = prompt("Enter a node name:", "New node");
		if (!nodeName) {
			return;
		}

		//$scope.chartViewModel.addNode(newNodeDataModel);
	};

	//
	// Add an input connector to selected nodes.
	//
	$scope.addNewInputConnector = function () {
		var connectorName = prompt("Enter a connector name:", "New connector");
		if (!connectorName) {
			return;
		}

		var selectedNodes = $scope.chartViewModel.getSelectedNodes();
		for (var i = 0; i < selectedNodes.length; ++i) {
			var node = selectedNodes[i];
			node.addInputConnector({
				name: connectorName,
			});
		}
	};

	//
	// Add an output connector to selected nodes.
	//
	$scope.addNewOutputConnector = function () {
		var connectorName = prompt("Enter a connector name:", "New connector");
		if (!connectorName) {
			return;
		}

		var selectedNodes = $scope.chartViewModel.getSelectedNodes();
		for (var i = 0; i < selectedNodes.length; ++i) {
			var node = selectedNodes[i];
			node.addOutputConnector({
				name: connectorName,
			});
		}
	};

	//
	// Delete selected nodes and connections.
	//
	$scope.deleteSelected = function () {

		$scope.chartViewModel.deleteSelected();
	};

	//
	// Create the view-model for the chart and attach to the scope.
	//
	$scope.chartViewModel = new flowchart.ChartViewModel(chartDataModel);
}]);
}).call(this);
