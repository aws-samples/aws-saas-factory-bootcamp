'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:ProductEditCtrl
 * @description
 * # ProductEditCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('ProductEditCtrl', function ($scope, $location, $http, $route, $routeParams, Constants) {
  // fetch the item to edit
  $scope.product = {};
  $scope.editProduct = true;

  $http.get(Constants.PRODUCT_MANAGER_URL + '/product/' + $routeParams.id)
    .then(function(response) {
      $scope.product = response.data;
    })
    .catch(function(response) {
      $scope.error = "Error getting product: " + response.message;
      console.log('Error getting product: ' + response.message);
    })
    .finally(function() {
      console.log('Finished getting product');
    });


  $scope.saveProduct = function() {
    var product = {
      productId: $scope.product.productId,
      sku: $scope.product.sku,
      title: $scope.product.title,
      description: $scope.product.description,
      condition: $scope.product.condition,
      conditionDescription: $scope.product.conditionDescription,
      numberInStock: $scope.product.numberInStock,
      unitCost: $scope.product.unitCost
    };

    $http.put(Constants.PRODUCT_MANAGER_URL + '/product', product)
      .then(function(response) {
        console.log('Product updated');
        $location.path('/products');
      })
      .catch(function(response) {
        $scope.error = "Error updating product: " + response.message;
        console.log("Error updating product: " + response.message);
      })
  };

  $scope.cancel = function() {
    $location.path('/products');
  };
});
