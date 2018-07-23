'use strict';

describe('Controller: BidAddCtrl', function () {

  // load the controller's module
  beforeEach(module('clientApp'));

  var BidAddCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    BidAddCtrl = $controller('BidAddCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(BidAddCtrl.awesomeThings.length).toBe(3);
  });
});
