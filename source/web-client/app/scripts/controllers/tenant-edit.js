'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:TenantEditCtrl
 * @description
 * # TenantEditCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('TenantEditCtrl', function ($scope, $location, $http, $route, $routeParams, Constants) {
  // fetch the item to edit
  $scope.tenant = {};

  $http.get(Constants.TENANT_MANAGER_URL + '/tenant/' + $routeParams.id).
    then(function(response) {
      $scope.tenant = response.data;
    })
    .catch(function(response) {
      $scope.error = "Error getting tenant: " + response.message;
      console.log('Error getting tenant: ' + response.message);
    })
    .finally(function() {
      console.log('Finished getting tenant');
    });

  $scope.saveTenant = function() {
    var tenant = {
      'id': $scope.tenant.id,
      'companyName': $scope.tenant.companyName,
      'accountName': $scope.tenant.accountName,
      'ownerName': $scope.tenant.ownerName,
      'tier': $scope.tenant.tier,
      'status': $scope.tenant.status
    };

    $http.put(Constants.TENANT_MANAGER_URL + '/tenant', tenant)
      .then(function(response) {
        console.log('Tenant updated');
        $location.path('/tenants');
      })
      .catch(function(response) {
        $scope.error = "Error updating tenant: " + response.message;
        console.log("Error updating tenant: " + response.message);
      })
  };

  $scope.cancel = function() {
    $location.path('/tenants');
  };
});
