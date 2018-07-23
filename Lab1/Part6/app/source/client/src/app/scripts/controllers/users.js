'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:UsersCtrl
 * @description
 * # UsersCtrl
 * Controller of the clientApp
 */
angular.module('clientApp').controller('UsersCtrl', function ($scope, $http, Constants) {
  $http.get(Constants.USER_MANAGER_URL + '/users')
    .then(function (response) {
      $scope.users = response.data;
    })
    .catch(function (response) {
      console.error('Error getting users', response.status, response.data);
    })
    .finally(function () {
      console.log('Finished getting users');
    });
});
