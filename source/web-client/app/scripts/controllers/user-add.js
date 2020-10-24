'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:UserAddCtrl
 * @description
 * # UserAddCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('UserAddCtrl', function ($scope, $location, $http, $route, $rootScope, Constants) {
  $scope.addUser = true;
  $scope.user = {};
  $scope.user.role = $rootScope.userRole;

  $scope.saveUser = function() {
    var user = {
      firstName: $scope.user.firstName,
      lastName: $scope.user.lastName,
      userName: $scope.user.userName,
      role: $scope.user.role
    };

    $http.post(Constants.USER_MANAGER_URL + '/user', user)
      .then(function(response) {
        console.log('User added');
        $scope.user.firstName = '';
        $scope.user.lastName = '';
        $scope.user.userName = '';
        $scope.user.role = $rootScope.userRole;
        $route.reload();
      })
      .catch(function(response) {
        $scope.error = "Error saving user: " + response.message;
        console.log("Error saving user: " + response.message);
      })
  };

  $scope.cancel = function() {
    $location.path('/users');
  };
});
