'use strict';

describe('Controller: TenantEditCtrl', function () {

  // load the controller's module
  beforeEach(module('clientApp'));

  var TenantEditCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    TenantEditCtrl = $controller('TenantEditCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(TenantEditCtrl.awesomeThings.length).toBe(3);
  });
});
