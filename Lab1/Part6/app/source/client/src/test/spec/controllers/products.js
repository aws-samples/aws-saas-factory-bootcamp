'use strict';

describe('Controller: ProductsCtrl', function () {

  // load the controller's module
  beforeEach(module('clientApp'));

  var ProductsCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ProductsCtrl = $controller('ProductsCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(ProductsCtrl.awesomeThings.length).toBe(3);
  });
});
