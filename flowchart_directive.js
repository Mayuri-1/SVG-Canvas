(function(){
var module = angular.module('flowChart', ['dragging'] )

module.directive('flowChart', function() {
  return {
  	restrict: 'E',
  	templateUrl: "scripts/flowchart_template.html",
  	replace: true,
  	scope: {
  		chart: "=chart",
  	},
  	controller: 'FlowChartController',
  };
});

module.controller('FlowChartController', ["ShowDivNew","ShowDivOpen","ShowValue","$scope","dragging", "$element", "$log" ,"$filter", "$http","$injector", "$timeout","$rootScope",function (ShowDivNew,ShowDivOpen, ShowValue,$scope, dragging, $element , $log , $filter  ,$http, $injector, chartJsonEdit, $timeout,$rootScope) {
	var controller = this;
	this.document = document;
	this.jQuery = function (element) {
		return $(element);
	}
	$scope.draggingConnection = false;
	$scope.connectorSize = 10;
	$scope.dragSelecting = false;
	$scope.mouseOverConnector = null;
	$scope.mouseOverConnection = null;
	$scope.mouseOverNode = null;

	this.connectionClass = 'connection';
	this.connectorClass = 'connector';
	this.nodeClass = 'node';

	this.searchUp = function (element, parentClass) {

		if (element == null || element.length == 0) {
			return null;
		}
		if (hasClassSVG(element, parentClass)) {
			return element;
		}
		return this.searchUp(element.parent(), parentClass);
	};
	this.hitTest = function (clientX, clientY) {
		return this.document.elementFromPoint(clientX, clientY);
	};
	this.checkForHit = function (mouseOverElement, whichClass) {
		var hoverElement = this.searchUp(this.jQuery(mouseOverElement), whichClass);
		if (!hoverElement) {
			return null;
		}
		return hoverElement.scope();
	};
	this.translateCoordinates = function(x, y, evt) {
		var svg_elem =  $element.get(0);
		var matrix = svg_elem.getScreenCTM();
		var point = svg_elem.createSVGPoint();
		point.x = x - evt.view.pageXOffset;
		point.y = y - evt.view.pageYOffset;
		return point.matrixTransform(matrix.inverse());
	};
	$scope.mouseDown = function (evt) {
		if($scope.chart){
			$scope.chart.deselectAll();
		}

		dragging.startDrag(evt, {
			dragStarted: function (x, y) {
				$scope.dragSelecting = true;
				var startPoint = controller.translateCoordinates(x, y, evt);
				$scope.dragSelectionStartPoint = startPoint;
				$scope.dragSelectionRect = {
					x: startPoint.x,
					y: startPoint.y,
					width: 0,
					height: 0,
				};
			},
			dragging: function (x, y) {
				var startPoint = $scope.dragSelectionStartPoint;
				var curPoint = controller.translateCoordinates(x, y, evt);

				$scope.dragSelectionRect = {
					x: curPoint.x > startPoint.x ? startPoint.x : curPoint.x,
					y: curPoint.y > startPoint.y ? startPoint.y : curPoint.y,
					width: curPoint.x > startPoint.x ? curPoint.x - startPoint.x : startPoint.x - curPoint.x,
					height: curPoint.y > startPoint.y ? curPoint.y - startPoint.y : startPoint.y - curPoint.y,
				};
			},
			dragEnded: function () {
				$scope.dragSelecting = false;
				$scope.chart.applySelectionRect($scope.dragSelectionRect);
				delete $scope.dragSelectionStartPoint;
				delete $scope.dragSelectionRect;
			},
		});
	};
	$scope.mouseMove = function (evt) {
		$scope.mouseOverConnection = null;
		$scope.mouseOverConnector = null;
		$scope.mouseOverNode = null;

		var mouseOverElement = controller.hitTest(evt.clientX, evt.clientY);
		if (mouseOverElement == null) {
			return;
		}

		if (!$scope.draggingConnection) {
			var scope = controller.checkForHit(mouseOverElement, controller.connectionClass);
			$scope.mouseOverConnection = (scope && scope.connection) ? scope.connection : null;
			if ($scope.mouseOverConnection) {
				return;
			}
		}

		var scope = controller.checkForHit(mouseOverElement, controller.connectorClass);
		$scope.mouseOverConnector = (scope && scope.connector) ? scope.connector : null;
		if ($scope.mouseOverConnector) {
			return;
		}

		var scope = controller.checkForHit(mouseOverElement, controller.nodeClass);
		$scope.mouseOverNode = (scope && scope.node) ? scope.node : null;		
	};

	$scope.nodeMouseDown = function (evt, node) {
		var chart = $scope.chart;
		var lastMouseCoords;

		dragging.startDrag(evt, {
			dragStarted: function (x, y) {

				lastMouseCoords = controller.translateCoordinates(x, y, evt);
				if (!node.selected()) {
					chart.deselectAll();
					node.select();
				}
			},
			dragging: function (x, y) {

				var curCoords = controller.translateCoordinates(x, y, evt);
				var deltaX = curCoords.x - lastMouseCoords.x;
				var deltaY = curCoords.y - lastMouseCoords.y;

				chart.updateSelectedNodesLocation(deltaX, deltaY);

				lastMouseCoords = curCoords;
			},
			clicked: function () {
				chart.handleNodeClicked(node, evt.ctrlKey);
			},

		});
	};

	//
	// Handle mousedown on a connection.
	//
	$scope.connectionMouseDown = function (evt, connection) {
		var chart = $scope.chart;
		chart.handleConnectionMouseDown(connection, evt.ctrlKey);

		// Don't let the chart handle the mouse down.
		evt.stopPropagation();
		evt.preventDefault();
		
	};


	//
	// Handle mousedown on an input connector.
	//
	$scope.connectorMouseDown = function (evt, node, connector, connectorIndex, isInputConnector) {
		dragging.startDrag(evt, {

			dragStarted: function (x, y) {

				var curCoords = controller.translateCoordinates(x, y, evt);

				$scope.draggingConnection = true;
				$scope.dragPoint1 = flowchart.computeConnectorPos(node, connectorIndex, isInputConnector);
				$scope.dragPoint2 = {
					x: curCoords.x,
					y: curCoords.y
				};
				$scope.dragTangent1 = flowchart.computeConnectionSourceTangent($scope.dragPoint1, $scope.dragPoint2);
				$scope.dragTangent2 = flowchart.computeConnectionDestTangent($scope.dragPoint1, $scope.dragPoint2);
			},
			dragging: function (x, y, evt) {
				var startCoords = controller.translateCoordinates(x, y, evt);
				$scope.dragPoint1 = flowchart.computeConnectorPos(node, connectorIndex, isInputConnector);
				$scope.dragPoint2 = {
					x: startCoords.x,
					y: startCoords.y
				};
				$scope.dragTangent1 = flowchart.computeConnectionSourceTangent($scope.dragPoint1, $scope.dragPoint2);
				$scope.dragTangent2 = flowchart.computeConnectionDestTangent($scope.dragPoint1, $scope.dragPoint2);
			},
			dragEnded: function () {

				if ($scope.mouseOverConnector && 
					$scope.mouseOverConnector !== connector) {
					$scope.chart.createNewConnection(connector, $scope.mouseOverConnector);
				}

				$scope.draggingConnection = false;
				delete $scope.dragPoint1;
				delete $scope.dragTangent1;
				delete $scope.dragPoint2;
				delete $scope.dragTangent2;
			},

		});
	};
	$scope.connectorMouseDown = function (evt, node, connector, connectorIndex, isInputConnector) {
		//
		// Initiate dragging out of a connection.
		//
		dragging.startDrag(evt, {

			//
			// Called when the mouse has moved greater than the threshold distance
			// and dragging has commenced.
			//
			dragStarted: function (x, y) {
				

				var curCoords = controller.translateCoordinates(x, y);				

				$scope.draggingConnection = true;
				$scope.dragPoint1 = flowchart.computeConnectorPos(node, connectorIndex, isInputConnector);
				$scope.dragPoint2 = {
					x: curCoords.x,
					y: curCoords.y
				};
				$scope.dragTangent1 = flowchart.computeConnectionSourceTangent($scope.dragPoint1, $scope.dragPoint2);
				$scope.dragTangent2 = flowchart.computeConnectionDestTangent($scope.dragPoint1, $scope.dragPoint2);
				
			},

			//
			// Called on mousemove while dragging out a connection.
			//
			dragging: function (x, y, evt) {
				
				
				var startCoords = controller.translateCoordinates(x, y);				
				$scope.dragPoint1 = flowchart.computeConnectorPos(node, connectorIndex, isInputConnector);
				$scope.dragPoint2 = {
					x: startCoords.x,
					y: startCoords.y
				};
				$scope.dragTangent1 = flowchart.computeConnectionSourceTangent($scope.dragPoint1, $scope.dragPoint2);
				$scope.dragTangent2 = flowchart.computeConnectionDestTangent($scope.dragPoint1, $scope.dragPoint2);
			},

			//
			// Clean up when dragging has finished.
			//
			dragEnded: function () {
				if ($scope.mouseOverConnector && 
					$scope.mouseOverConnector !== connector) {
					// Dragging has ended...
					// The mouse is over a valid connector...
					// Create a new connection.
					//
					$scope.chart.createNewConnection(connector, $scope.mouseOverConnector);
					
				}
				
				$scope.draggingConnection = false;
				delete $scope.dragPoint1;
				delete $scope.dragTangent1;
				delete $scope.dragPoint2;
				delete $scope.dragTangent2;
				
			}

		});
	};
}]);
}).call(this);
