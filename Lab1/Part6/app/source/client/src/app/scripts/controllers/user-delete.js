'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:UserDeleteCtrl
 * @description
 * # UserDeleteCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('UserDeleteCtrl', function ($scope, $location, $http, $route, $routeParams, Constants) {
  // fetch the item to delete
  $http.get(Constants.USER_MANAGER_URL + '/user/' + $routeParams.id)
    .then(function(response) {
      $scope.user = response.data;
    })
    .catch(function(response) {
      $scope.error = "Error getting user: " + response.message;
      console.log('Error getting user: ' + response.message);
    })
    .finally(function() {
      console.log('Finished getting user');
    });

  $scope.deleteUser = function() {
    $http.delete(Constants.USER_MANAGER_URL + '/user/' + $scope.user.userName)
      .then(function (response) {
        console.log('User delete');
        $location.path('/users');
      })
      .catch(function (response) {
        $scope.error = "Error deleting user: " + response.message;
        console.log("Error deleting user: " + response.message);
      })
  };

  $scope.back = function() {
    $location.path('/users');
  };
});
