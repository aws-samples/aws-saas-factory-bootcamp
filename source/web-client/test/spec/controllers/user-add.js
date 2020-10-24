'use strict';

describe('Controller: UserAddCtrl', function () {

  // load the controller's module
  beforeEach(module('clientApp'));

  var UserAddCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    UserAddCtrl = $controller('UserAddCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(UserAddCtrl.awesomeThings.length).toBe(3);
  });
});
