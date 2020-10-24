'use strict';

describe('Controller: UserDeleteCtrl', function () {

  // load the controller's module
  beforeEach(module('clientApp'));

  var UserDeleteCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    UserDeleteCtrl = $controller('UserDeleteCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(UserDeleteCtrl.awesomeThings.length).toBe(3);
  });
});
