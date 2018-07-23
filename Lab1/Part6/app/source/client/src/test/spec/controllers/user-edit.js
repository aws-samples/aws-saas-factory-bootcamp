'use strict';

describe('Controller: UserEditCtrl', function () {

  // load the controller's module
  beforeEach(module('clientApp'));

  var UserEditCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    UserEditCtrl = $controller('UserEditCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(UserEditCtrl.awesomeThings.length).toBe(3);
  });
});
