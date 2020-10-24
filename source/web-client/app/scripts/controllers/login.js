'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('LoginCtrl', function ($scope, $rootScope, $location, $route, $http, Constants, jwtHelper) {

  $scope.formSubmit = function () {
    var user = {
      userName: $scope.username,
      password: $scope.password
    };

    $http.post(Constants.AUTH_MANAGER_URL + '/auth', user)
      .then(function(response) {
        console.log('Login success');

        if (response.data.newPasswordRequired) {
          $rootScope.currentUser = $scope.username;
          $location.path('/confirm');
        }
        else {
          $rootScope.isUserLoggedIn = true;
          $rootScope.currentUser = $scope.username;
          $rootScope.bearerToken = response.data.token;
          var decodedToken = jwtHelper.decodeToken($rootScope.bearerToken);
          $rootScope.userDisplayName = decodedToken['given_name'] + ' ' + decodedToken['family_name'];
          $rootScope.userRole = decodedToken['custom:role'];
          $scope.error = '';
          $scope.username = '';
          $scope.password = '';
          $location.path('/');
          $route.reload();
        }
      })
      .catch(function() {
        $rootScope.isUserLoggedIn = false;
        $rootScope.identityToken = '';
        $rootScope.userDisplayName = '';
        $rootScope.userRole = '';
        $scope.error = "Invalid login. Please try again.";
        console.log('Login failed');
      })
  };
});
