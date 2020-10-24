'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:ProductsCtrl
 * @description
 * # ProductsCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('ProductsCtrl', function ($scope, $http, Constants) {
  $http.get(Constants.PRODUCT_MANAGER_URL + '/products')
    .then(function(response) {
      $scope.products = response.data;
    })
    .catch(function(response) {
      console.error('Error getting products', response.status, response.data);
    })
    .finally(function() {
      console.log('Finished getting products');
    });
});
