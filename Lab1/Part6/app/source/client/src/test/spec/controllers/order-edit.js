'use strict';

describe('Controller: OrderEditCtrl', function () {

  // load the controller's module
  beforeEach(module('clientApp'));

  var OrderEditCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    OrderEditCtrl = $controller('OrderEditCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(OrderEditCtrl.awesomeThings.length).toBe(3);
  });
});
