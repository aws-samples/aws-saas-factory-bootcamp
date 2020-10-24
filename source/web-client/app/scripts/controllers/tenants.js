'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:TenantsCtrl
 * @description
 * # TenantsCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('TenantsCtrl', function ($scope, $http, Constants) {
  $http.get(Constants.TENANT_MANAGER_URL + '/tenants')
    .then(function(response) {
      $scope.tenants = response.data;
    })
    .catch(function(response) {
      console.error('Error getting tenants', response.status, response.data);
    })
    .finally(function() {
      console.log('Finished getting tenants');
    });
});
