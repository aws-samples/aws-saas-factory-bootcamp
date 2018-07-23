'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:OrderDeleteCtrl
 * @description
 * # OrderDeleteCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('OrderDeleteCtrl', function ($scope, $location, $http, $route, $routeParams, Constants) {

  // fetch the item to delete
  $http.get(Constants.ORDER_MANAGER_URL + '/order/' + $routeParams.id)
    .then(function(response) {
      $scope.order = response.data;
    })
    .catch(function(response) {
      $scope.error = "Error getting order: " + response.message;
      console.log('Error getting order: ' + response.message);
    })
    .finally(function() {
      console.log('Finished getting order');
    });


  $scope.deleteOrder = function() {
    $http.delete(Constants.ORDER_MANAGER_URL + '/order/' + $scope.order.orderId)
      .then(function (response) {
        console.log('Order delete');
        $location.path('/orders');
      })
      .catch(function (response) {
        $scope.error = "Error deleting order: " + response.message;
        console.log("Error deleting order: " + response.message);
      })
  };

  $scope.back = function() {
    $location.path('/orders');
  };
});
