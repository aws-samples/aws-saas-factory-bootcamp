'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:OrderAddCtrl
 * @description
 * # OrderAddCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('OrderAddCtrl', function ($scope, $location, $http, $route, $rootScope, Constants) {
  $scope.order = {};
  $scope.addOrder = true;

  $http.get(Constants.PRODUCT_MANAGER_URL + '/products')
    .then(function (response) {
      $scope.products = response.data;
      $scope.order.dateOrdered = new Date();
      $scope.order.quantity = 1;
      $scope.order.unitCost = 0;
      $scope.productMap = {};
      $scope.products.forEach(function (it) { $scope.productMap[it.productId] = it; });

      if ($scope.products) {
        $scope.order.productId = $scope.products[0].productId;
        $scope.order.unitCost = $scope.products[0].unitCost;
      }
    })
    .catch(function (response) {
      console.log('Error getting products: ' + response.message);
    })
    .finally(function () {
      console.log('Finished getting products');
    });

  $scope.saveOrder = function() {
    var order = {
      productId: $scope.order.productId,
      productSKU: $scope.productMap[$scope.order.productId].sku,
      productDescription: $scope.productMap[$scope.order.productId].title,
      dateOrdered: new Date($scope.order.dateOrdered),
      orderedBy: $rootScope.currentUser,
      quantity: $scope.order.quantity,
      unitCost: $scope.order.unitCost
    };

    $http.post(Constants.ORDER_MANAGER_URL + '/order', order)
      .then(function(response) {
        console.log('Order added');
      })
      .catch(function(response) {
        $scope.error = "Error saving order: " + response.message;
        console.log("Error saving order: " + response.message);
      });

    var product = $scope.productMap[$scope.order.productId];
    product.numberInStock -= $scope.order.quantity;
    $http.put(Constants.PRODUCT_MANAGER_URL + '/product', product)
      .then(function (response) {
        console.log('Product inventory updated');
      })
      .catch(function (response) {
        $scope.error = "Error updating product inventory: " + response.message;
        console.log("Error updating product inventory: " + response.message);
      });

    $scope.order = {};
    $scope.order.quantity = 1;
    $route.reload();
  };

  $scope.productChanged = function(productId) {
    $scope.order.unitCost = $scope.productMap[$scope.order.productId].unitCost;
  };

  $scope.cancel = function() {
    $location.path('/orders');
  };
});
