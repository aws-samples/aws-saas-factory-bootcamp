'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('MainCtrl', function ($scope, $timeout, $http, $location, Constants) {
  $scope.authenticationManagerHealthy = true;
  $scope.tenantManagerHealthy = true;
  $scope.tenantRegistrationHealthy = true;
  $scope.orderManagerHealthy = true;
  $scope.productManagerHealthy = true;
  $scope.userManagerHealthy = true;

  var pollForServiceHealth = function() {
    $timeout(function() {
      // only poll if we're on the home page
      if ($location.path() === '/') {
        getServiceHealth(Constants.AUTH_MANAGER_URL + '/auth', function (healthStatus) {
          $scope.authenticationManagerHealthy = healthStatus;
        });

        getServiceHealth(Constants.TENANT_MANAGER_URL + '/tenant', function (healthStatus) {
          $scope.tenantManagerHealthy = healthStatus;
        });

        getServiceHealth(Constants.TENANT_REGISTRATION_URL + '/reg', function (healthStatus) {
          $scope.tenantRegistrationHealthy = healthStatus;
        });

        getServiceHealth(Constants.ORDER_MANAGER_URL + '/order', function (healthStatus) {
          $scope.orderManagerHealthy = healthStatus;
        });

        getServiceHealth(Constants.PRODUCT_MANAGER_URL + '/product', function (healthStatus) {
          $scope.productManagerHealthy = healthStatus;
        });

        getServiceHealth(Constants.USER_MANAGER_URL + '/user', function (healthStatus) {
          $scope.userManagerHealthy = healthStatus;
        });
      }
      pollForServiceHealth();
    }, 5000);
  };
  pollForServiceHealth();

  function getServiceHealth(serviceURL, callback) {
    $http.get(serviceURL + '/health')
      .then(function(response) {
        if (response.status == 200)
          callback(true);
        else
          callback(false);
      })
      .catch(function(error) {
        callback(false);
      })
  }

});
