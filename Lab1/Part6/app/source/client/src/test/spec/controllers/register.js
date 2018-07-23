'use strict';

describe('Controller: RegisterCtrl', function () {

  // load the controller's module
  beforeEach(module('clientApp'));

  var RegisterCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    RegisterCtrl = $controller('RegisterCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(RegisterCtrl.awesomeThings.length).toBe(3);
  });
});
