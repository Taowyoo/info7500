var BigNumber = require('bignumber.js');
var run = require('./framework.js');

contract('Dutch Auction', function (accounts) {
  it('reject a finalize with no judge', function (done) {
    run(accounts, done, {
      type: 'dutch',
      reservePrice: 500,
      judgeAddress: '0x0000000000000000000000000000000000000000',
      biddingTimePeriod: 10,
      offerPriceDecrement: 25,
      actions: [
        {
          block: 1,
          action: 'finalize',
          succeed: false,
          on_error: 'Early finalize accepted'
        }
      ]
    });
  });
});
