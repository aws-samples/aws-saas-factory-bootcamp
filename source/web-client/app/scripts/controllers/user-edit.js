'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:UserEditCtrl
 * @description
 * # UserEditCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('UserEditCtrl', function ($scope, $location, $http, $route, $routeParams, Constants) {
  // fetch the item to edit
  $scope.user = {};
  $scope.editUser = true;

  $http.get(Constants.USER_MANAGER_URL + '/user/' + $routeParams.id)
    .then(function(response) {
      $scope.user = response.data;
    })
    .catch(function(response) {
      $scope.error = "Error getting user";
      console.log('Error getting user: ' + response.message);
    })
    .finally(function() {
      console.log('Finished getting user');
    });

  $scope.saveUser = function() {
    var user = {
      'userName': $scope.user.userName,
      'firstName': $scope.user.firstName,
      'lastName': $scope.user.lastName,
      'role': $scope.user.role
    };

    $http.put(Constants.USER_MANAGER_URL + '/user', user)
      .then(function(response) {
        console.log('User updated');
        $location.path('/users');
      })
      .catch(function(response) {
        $scope.error = "Error updating user: " + response.message;
        console.log("Error updating user: " + response.message);
      })
  };

  $scope.cancel = function() {
    $location.path('/users');
  };
});
