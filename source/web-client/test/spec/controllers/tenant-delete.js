'use strict';

describe('Controller: TenantDeleteCtrl', function () {

  // load the controller's module
  beforeEach(module('clientApp'));

  var TenantDeleteCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    TenantDeleteCtrl = $controller('TenantDeleteCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(TenantDeleteCtrl.awesomeThings.length).toBe(3);
  });
});
