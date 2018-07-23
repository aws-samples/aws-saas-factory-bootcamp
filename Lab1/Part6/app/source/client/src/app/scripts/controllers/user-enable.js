'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:UserEnableCtrl
 * @description
 * # UserEnableCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('UserEnableCtrl', function ($scope, $location, $http, $route, $routeParams, Constants) {
  // fetch the item to edit
  $scope.user = {};

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

  $scope.yesPressed = function() {
    if ($scope.user.enabled)
      $scope.disableUser();
    else
      $scope.enableUser();
  };

  $scope.enableUser = function() {
    $http.put(Constants.USER_MANAGER_URL + '/user/enable', $scope.user)
      .then(function (response) {
        $location.path('/users');
      })
      .catch(function (response) {
        $scope.error = "Error enabling user";
        console.log("Error enabling user");
      })
  };

  $scope.disableUser = function() {
    $http.put(Constants.USER_MANAGER_URL + '/user/disable/', $scope.user)
      .then(function (response) {
        $location.path('/users');
      })
      .catch(function (response) {
        $scope.error = "Error disabling user";
        console.log("Error disabling user");
      })
  };

  $scope.back = function() {
    $location.path('/users');
  };
});
