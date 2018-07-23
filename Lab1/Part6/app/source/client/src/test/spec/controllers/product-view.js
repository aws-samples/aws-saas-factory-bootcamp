'use strict';

describe('Controller: ProductViewCtrl', function () {

  // load the controller's module
  beforeEach(module('clientApp'));

  var ProductViewCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ProductViewCtrl = $controller('ProductViewCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(ProductViewCtrl.awesomeThings.length).toBe(3);
  });
});
