'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:ConfirmCtrl
 * @description
 * # ConfirmCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('ConfirmCtrl', function ($scope, $rootScope, $location, $route, $http, Constants, jwtHelper) {
  $scope.formSubmit = function () {
    if ($scope.newPassword !== $scope.confirmPassword) {
      $scope.error = "Passwords do not match.";
    }
    else if ($scope.newPassword.length < 6) {
      $scope.error = "Password must be 6 or more characters long";
    }
    else if (!($scope.currentPassword || $scope.newPassword || $scope.confirmPassword)) {
      $scope.error = "Current, new, and confirm passwords are required. Please enter these values.";
    }
    else {
      var user = {
        userName: $rootScope.currentUser,
        password: $scope.currentPassword,
        newPassword: $scope.newPassword
      }
    }

    $http.post(Constants.AUTH_MANAGER_URL + '/auth', user)
      .then(function (response) {
        console.log('Login success');
        $rootScope.isUserLoggedIn = true;
        $rootScope.bearerToken = response.data.token;
        var decodedToken = jwtHelper.decodeToken($rootScope.bearerToken);
        $rootScope.userDisplayName = decodedToken['given_name'] + ' ' + decodedToken['family_name'];
        $rootScope.userRole = decodedToken['custom:role'];
        $scope.error = '';
        $scope.username = '';
        $scope.password = '';
        $location.path('/');
        $route.reload();
      })
      .catch(function (response) {
        $rootScope.isUserLoggedIn = false;
        $rootScope.identityToken = '';
        $rootScope.userDisplayName = '';
        $scope.error = "Invalid login. Please try again.";
        console.log('Login failed');
      });
  };
});
