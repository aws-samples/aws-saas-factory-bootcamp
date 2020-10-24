'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:ProductAddCtrl
 * @description
 * # ProductAddCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('ProductAddCtrl', function ($scope, $location, $http, $route, Constants) {
    $scope.addProduct = true;

    $scope.saveProduct = function() {
      var product = {
        sku: $scope.product.sku,
        title: $scope.product.title,
        description: $scope.product.description,
        condition: $scope.product.condition,
        conditionDescription: $scope.product.conditionDescription,
        numberInStock: $scope.product.numberInStock,
        unitCost: $scope.product.unitCost
      };

      $http.post(Constants.PRODUCT_MANAGER_URL + '/product', product)
        .then(function(response) {
          console.log('Product added');
          $scope.product.sku = '';
          $scope.product.title = '';
          $scope.product.description = '';
          $scope.product.condition = '1';
          $scope.product.conditionDescription = '';
          $scope.product.numberInStock = 0;
          $scope.product.unitCost = 0;
          $route.reload();
        })
        .catch(function(response) {
          $scope.error = "Error saving product: " + response.message;
          console.log("Error saving product: " + response.message);
        })
    };

    $scope.cancel = function() {
      $location.path('/products');
    };
  });
