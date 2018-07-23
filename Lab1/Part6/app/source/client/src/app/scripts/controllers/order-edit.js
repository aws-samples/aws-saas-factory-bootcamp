'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:OrderEditCtrl
 * @description
 * # OrderEditCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('OrderEditCtrl', function ($scope, $location, $http, $route, $routeParams, $rootScope, Constants) {
  // fetch the item to edit
  $scope.editOrder = true;

  $http.get(Constants.ORDER_MANAGER_URL + '/order/' + $routeParams.id)
    .then(function(response) {
      $scope.order = response.data;
      $scope.order.dateOrdered = new Date($scope.order.dateOrdered);
      $scope.order.originalQantity = $scope.order.quantity;
    })
    .catch(function(response) {
      console.log('Error getting order: ' + response.message);
    })
    .finally(function() {
      console.log('Finished getting order');
  });

  $http.get(Constants.PRODUCT_MANAGER_URL + '/products')
    .then(function (response) {
      $scope.products = response.data;
      $scope.productMap = {};
      $scope.products.forEach(function (it) { $scope.productMap[it.productId] = it; });
    })
    .catch(function (response) {
      console.log('Error getting products: ' + response.message);
    })
    .finally(function () {
      console.log('Finished getting products');
    });

  $scope.saveOrder = function() {
    var order = {
      orderId: $scope.order.orderId,
      productId: $scope.order.productId,
      productSKU: $scope.productMap[$scope.order.productId].sku,
      productDescription: $scope.productMap[$scope.order.productId].title,
      orderedBy: $rootScope.currentUser,
      dateOrdered: $scope.order.dateOrdered,
      quantity: $scope.order.quantity,
      unitCost: $scope.order.unitCost
    };

    $http.put(Constants.ORDER_MANAGER_URL + '/order', order)
      .then(function(response) {
        console.log('Order updated');
        $location.path('/orders');
      })
      .catch(function(response) {
        $scope.error = "Error updating order: " + response.message;
        console.log("Error updating order: " + response.message);
      });

    if ($scope.order.quantity != $scope.order.originalQantity) {
      var product = $scope.productMap[$scope.order.productId];
      if ($scope.order.quantity > $scope.order.originalQantity) {
        product.numberInStock -= ($scope.order.quantity - $scope.order.originalQantity);
      }
      else {
        product.numberInStock += ($scope.order.originalQantity - $scope.order.quantity);
      }

      $http.put(Constants.PRODUCT_MANAGER_URL + '/product', product)
        .then(function (response) {
          console.log('Product inventory updated');
        })
        .catch(function (response) {
          $scope.error = "Error updating product inventory: " + response.message;
          console.log("Error updating product inventory: " + response.message);
        })
    }

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
