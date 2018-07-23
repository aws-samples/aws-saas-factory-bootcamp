'use strict';

describe('Controller: TenantsCtrl', function () {

  // load the controller's module
  beforeEach(module('clientApp'));

  var TenantsCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    TenantsCtrl = $controller('TenantsCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(TenantsCtrl.awesomeThings.length).toBe(3);
  });
});
