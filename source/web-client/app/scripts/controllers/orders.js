'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:OrdersCtrl
 * @description
 * # OrdersCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('OrdersCtrl', function ($scope, $http, $filter, Constants) {
  $http.get(Constants.ORDER_MANAGER_URL + '/orders')
    .then(function(response) {
      $scope.orders = response.data;
      $scope.filteredOrders = $scope.orders.slice();

      var productFilterDict = {'No Filter': ''};
      var key = '';
      for (key in $scope.orders) {
        var productDescription = $scope.orders[key].productDescription;
        if (!(productDescription in productFilterDict))
          productFilterDict[productDescription] = "";
      }
      $scope.productFilterValues = Object.keys(productFilterDict);
    })
    .catch(function(response) {
      console.error('Error getting orders', response.status, response.data);
    })
    .finally(function() {
      console.log('Finished getting orders');
    });

  $scope.orderFilterChanged = function(orderFilter) {
    if (orderFilter === 'No Filter')
      $scope.filteredOrders = $scope.orders;
    else
      $scope.filteredOrders = $filter('filter')($scope.orders, { productDescription: orderFilter });
  }
});
