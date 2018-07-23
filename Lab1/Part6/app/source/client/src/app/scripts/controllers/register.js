'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:RegisterCtrl
 * @description
 * # RegisterCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('RegisterCtrl', function ($scope, $http, $location, Constants) {
  $scope.formSubmit = function () {
    if (!($scope.tenant.email || $scope.tenant.companyName)) {
      $scope.error = "User name and company name are required. Please enter these values.";
    }
    else {
      var tenant = {
        id: '',
        companyName: $scope.tenant.companyName,
        accountName: $scope.tenant.companyName,
        ownerName: $scope.tenant.email,
        tier: $scope.tenant.plan,
        email: $scope.tenant.email,
        userName: $scope.tenant.email,
        firstName: $scope.tenant.firstName,
        lastName: $scope.tenant.lastName
      };

      $http.post(Constants.TENANT_REGISTRATION_URL + '/reg', tenant)
        .then(function(data) {
          console.log('Registration success');
          $scope.hideRegistrationForm = true;
          $scope.showSuccessMessage = true;
        })
        .catch(function(response) {
          $scope.error = "Unable to create new account";
          console.log('Registration failed: ', response)
        })
    }
  };
});
