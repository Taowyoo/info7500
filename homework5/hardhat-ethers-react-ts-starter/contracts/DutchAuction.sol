// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DutchAuction {
  address private _seller;
  uint256 private _reservePrice;
  address private _judgeAddress;
  uint256 private _numBlocksAuctionOpen;
  uint256 private _offerPriceDecrement;
  uint256 private _beginBlockNum;
  address private _acceptedBidderAddress;
  uint256 private _acceptedBid;
  bool private _finalized = false;
  bool private _gotAcceptableBid = false;

  constructor(
    uint256 reservePrice,
    address judgeAddress,
    uint256 numBlocksAuctionOpen,
    uint256 offerPriceDecrement
  ) {
    _seller = msg.sender;
    _reservePrice = reservePrice;
    _judgeAddress = judgeAddress;
    _numBlocksAuctionOpen = numBlocksAuctionOpen;
    _offerPriceDecrement = offerPriceDecrement;
    _beginBlockNum = block.number;
  }

  function bid() public payable {
    // could not bid after last round
    require(block.number < _beginBlockNum + _numBlocksAuctionOpen);
    // could not bid after auction finalized
    require(!_finalized);
    // could not bid after accepting a bid
    require(!_gotAcceptableBid);
    // bid valve should equal to each round price
    uint256 curPrice = _reservePrice +
      (_beginBlockNum + _numBlocksAuctionOpen - block.number) *
      _offerPriceDecrement;
    require(msg.value >= curPrice);

    _acceptedBidderAddress = msg.sender;
    _acceptedBid = msg.value;
    _gotAcceptableBid = true;
  }

  function finalize() public {
    // only judger could finalize
    require(
      msg.sender == _judgeAddress || msg.sender == _acceptedBidderAddress
    );
    require(!_finalized);
    // only could finalize after got a valid bid
    require(_gotAcceptableBid);
    (bool success, ) = _seller.call{value: _acceptedBid}('');
    require(success, 'Transfer bid value failed.');
    _finalized = true;
  }

  function refund() public {
    require(msg.sender == _judgeAddress);
    require(!_finalized && _gotAcceptableBid);
    (bool success, ) = _acceptedBidderAddress.call{value: _acceptedBid}('');
    require(success, 'Transfer bid value failed.');
    _finalized = true;
  }

  //for testing framework
  function nop() public returns (bool) {
    return true;
  }
}
