'use strict';

describe('Controller: ConfirmCtrl', function () {

  // load the controller's module
  beforeEach(module('clientApp'));

  var ConfirmCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ConfirmCtrl = $controller('ConfirmCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(ConfirmCtrl.awesomeThings.length).toBe(3);
  });
});
