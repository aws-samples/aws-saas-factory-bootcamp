'use strict';

describe('Controller: ProductAddCtrl', function () {

  // load the controller's module
  beforeEach(module('clientApp'));

  var ProductAddCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ProductAddCtrl = $controller('ProductAddCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(ProductAddCtrl.awesomeThings.length).toBe(3);
  });
});
