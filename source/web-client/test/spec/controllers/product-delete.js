'use strict';

describe('Controller: ProductDeleteCtrl', function () {

  // load the controller's module
  beforeEach(module('clientApp'));

  var ProductDeleteCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ProductDeleteCtrl = $controller('ProductDeleteCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(ProductDeleteCtrl.awesomeThings.length).toBe(3);
  });
});
