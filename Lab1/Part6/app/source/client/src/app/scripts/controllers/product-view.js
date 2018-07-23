'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:ProductViewCtrl
 * @description
 * # ProductViewCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('ProductViewCtrl', function ($scope, $location, $http, $route, $routeParams, Constants) {

  $http.get(Constants.PRODUCT_MANAGER_URL + '/product/' + $routeParams.id)
    .then(function (response) {
      $scope.product = response.data;
    })
    .catch(function (response) {
      console.log('Error getting product: ' + response.message);
    })
    .finally(function () {
      console.log('Finished getting product');
    });
});
