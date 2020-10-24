'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:ProductDeleteCtrl
 * @description
 * # ProductDeleteCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('ProductDeleteCtrl', function ($scope, $location, $http, $route, $routeParams, Constants) {
  // fetch the item to delete
  $http.get(Constants.PRODUCT_MANAGER_URL + '/product/' + $routeParams.id)
    .then(function(response) {
      $scope.product = response.data;
    })
    .catch(function(response) {
      $scope.error = "Error getting order: " + response.message;
      console.log('Error getting product: ' + response.message);
    })
    .finally(function() {
      console.log('Finished getting product');
    });

  // delete the product
  $scope.deleteProduct = function() {
    $http.delete(Constants.PRODUCT_MANAGER_URL + '/product/' + $scope.product.productId)
      .then(function (response) {
        console.log('Product delete');
        $location.path('/products');
      })
      .catch(function (response) {
        $scope.error = "Error deleting product: " + response.message;
        console.log("Error deleting product: " + response.message);
      })
  };

  $scope.back = function() {
    $location.path('/products');
  };
});
