'use strict';

describe('Controller: BidDeleteCtrl', function () {

  // load the controller's module
  beforeEach(module('clientApp'));

  var BidDeleteCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    BidDeleteCtrl = $controller('BidDeleteCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(BidDeleteCtrl.awesomeThings.length).toBe(3);
  });
});
