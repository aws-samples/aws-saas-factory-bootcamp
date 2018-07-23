'use strict';

describe('Controller: OrderAddCtrl', function () {

  // load the controller's module
  beforeEach(module('clientApp'));

  var OrderAddCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    OrderAddCtrl = $controller('OrderAddCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(OrderAddCtrl.awesomeThings.length).toBe(3);
  });
});
