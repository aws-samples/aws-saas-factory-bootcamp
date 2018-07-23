'use strict';

describe('Controller: BidsCtrl', function () {

  // load the controller's module
  beforeEach(module('clientApp'));

  var BidsCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    BidsCtrl = $controller('BidsCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(BidsCtrl.awesomeThings.length).toBe(3);
  });
});
