'use strict';

describe('Controller: OrderDeleteCtrl', function () {

  // load the controller's module
  beforeEach(module('clientApp'));

  var OrderDeleteCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    OrderDeleteCtrl = $controller('OrderDeleteCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(OrderDeleteCtrl.awesomeThings.length).toBe(3);
  });
});
