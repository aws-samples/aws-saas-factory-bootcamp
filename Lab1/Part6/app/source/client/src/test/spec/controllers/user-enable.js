'use strict';

describe('Controller: UserEnableCtrl', function () {

  // load the controller's module
  beforeEach(module('clientApp'));

  var UserEnableCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    UserEnableCtrl = $controller('UserEnableCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(UserEnableCtrl.awesomeThings.length).toBe(3);
  });
});
