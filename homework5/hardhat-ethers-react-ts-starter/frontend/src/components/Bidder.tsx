import { useWeb3React } from '@web3-react/core';
import { BigNumber, Contract, ethers, Signer } from 'ethers';
import {
  ChangeEvent,
  MouseEvent,
  ReactElement,
  useEffect,
  useState
} from 'react';
import styled from 'styled-components';
import DutchAuctionArtifact from '../artifacts/contracts/DutchAuction.sol/DutchAuction.json';
import { Provider } from '../utils/provider';

const StyledConnectContractButton = styled.button`
  width: 1fr;
  height: 2rem;
  border-radius: 1rem;
  border-color: blue;
  cursor: pointer;
  place-self: center;
`;

const StyledAuctionDiv = styled.div`
  display: grid;
  grid-template-rows: 1fr 1fr 1fr;
  grid-template-columns: 1fr 2fr 1fr;
  grid-gap: 10px;
  place-self: center;
  align-items: center;
`;

const StyledLabel = styled.label`
  font-weight: bold;
`;

const StyledInput = styled.input`
  padding: 0.4rem 0.6rem;
  line-height: 2fr;
`;

const StyledButton = styled.button`
  width: 1fr;
  height: 2rem;
  border-radius: 1rem;
  border-color: blue;
  cursor: pointer;
`;

export function Bidder(): ReactElement {
  const context = useWeb3React<Provider>();
  const { library, active } = context;
  const DEFAULT_NUMBER_VAL = -1;

  const [bidSigner, setBidSigner] = useState<Signer>();
  const [bidDutchAuctionContract, setBidDutchAuctionContract] =
    useState<Contract>();
  const [bidDutchAuctionContractAddr, setBidDutchAuctionContractAddr] =
    useState<string>('');

  const [reservePrice, setReservePrice] = useState<number>(DEFAULT_NUMBER_VAL);

  const [numBlocksAuctionOpen, setNumBlocksAuctionOpen] =
    useState<number>(DEFAULT_NUMBER_VAL);

  const [curBlockNum, setCurBlockNum] = useState<number>(DEFAULT_NUMBER_VAL);
  const [bidPrice, setBidPrice] = useState<number>(DEFAULT_NUMBER_VAL);

  const [beginBlockNum, setBeginBlockNum] =
    useState<number>(DEFAULT_NUMBER_VAL);

  const [offerPriceDecrement, setOfferPriceDecrement] =
    useState<number>(DEFAULT_NUMBER_VAL);

  const [acceptedBid, setAcceptedBid] = useState<number>(DEFAULT_NUMBER_VAL);

  const [finalized, setFinalized] = useState<boolean>(false);
  const [gotAcceptableBid, setGotAcceptableBid] = useState<boolean>(false);

  const [bidAddressInput, setBidAddressInput] = useState<string>('');

  useEffect((): void => {
    if (!library) {
      setBidSigner(undefined);
      return;
    }

    setBidSigner(library.getSigner());
  }, [library]);

  async function updateContractInfo(contract: Contract) {
    console.log('updateContractInfo: ', contract);
    const data: [
      BigNumber,
      BigNumber,
      BigNumber,
      BigNumber,
      BigNumber,
      boolean,
      boolean
    ] = await contract.getAuctionState();
    console.log('data: ', data);
    if (!(data instanceof Error)) {
      const [
        _reservePrice,
        _numBlocksAuctionOpen,
        _offerPriceDecrement,
        _acceptedBid,
        _beginBlockNum,
        _finalized,
        _gotAcceptableBid
      ] = data;
      setReservePrice(_reservePrice.toNumber());
      setNumBlocksAuctionOpen(_numBlocksAuctionOpen.toNumber());
      setOfferPriceDecrement(_offerPriceDecrement.toNumber());
      setAcceptedBid(_acceptedBid.toNumber());
      setBeginBlockNum(_beginBlockNum.toNumber());
      setFinalized(_finalized);
      setGotAcceptableBid(_gotAcceptableBid);
    } else {
      console.error(data.message);
    }
  }

  function handleConnectContract(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    // only deploy the DutchAuction contract one time, when a signer is defined
    if (!bidSigner) {
      window.alert('Empty signer!');
      return;
    }

    async function deployDutchAuctionContract(signer: Signer): Promise<void> {
      // check input parameters for DutchAuction
      if (!ethers.utils.isAddress(bidAddressInput)) {
        window.alert('Invalid auction contract address');
        return;
      }
      const contractAddress = ethers.utils.getAddress(bidAddressInput);

      try {
        const DutchAuctionContract = new ethers.Contract(
          contractAddress,
          DutchAuctionArtifact.abi,
          signer
        );
        setBidDutchAuctionContract(DutchAuctionContract);
        setBidDutchAuctionContractAddr(DutchAuctionContract.address);
        window.alert(
          `Connected to DutchAuction Contract: ${DutchAuctionContract.address}`
        );
        await updateContractInfo(DutchAuctionContract);
        setInterval(async () => {
          if (library) {
            try {
              const newBlockNumber: number = await library.getBlockNumber();
              setCurBlockNum(newBlockNumber);
            } catch (error: any) {
              window.alert(
                'Error!' +
                  (error && error.message ? `\n\n${error.message}` : '')
              );
            }
          }
          await updateContractInfo(DutchAuctionContract);
        }, 1000);
      } catch (error: any) {
        window.alert(
          'Error!' + (error && error.message ? `\n\n${error.message}` : '')
        );
      }
    }

    deployDutchAuctionContract(bidSigner);
  }

  async function handleBid(
    event: MouseEvent<HTMLButtonElement>
  ): Promise<void> {
    event.preventDefault();
    if (bidPrice <= 0) {
      window.alert('Bid price should > 0');
      return;
    }
    const options = {
      value: ethers.utils.parseEther(ethers.utils.formatEther(bidPrice))
    };
    if (bidDutchAuctionContract) {
      const res = await bidDutchAuctionContract.bid(options);
      if (!(res instanceof Error)) {
        window.alert('Bid successfully with ' + bidPrice + ' wei');
      } else {
        window.alert('Failed to bid:\n' + res.message);
      }
    }
  }

  function handleBidPriceChange(event: ChangeEvent<HTMLInputElement>): void {
    event.preventDefault();
    setBidPrice(parseInt(event.target.value));
  }

  function handleContractAddressChange(
    event: ChangeEvent<HTMLInputElement>
  ): void {
    event.preventDefault();
    setBidAddressInput(event.target.value);
  }

  return (
    <>
      <StyledAuctionDiv>
        <StyledLabel htmlFor="contractAddressInput">
          Set Auction Contract address
        </StyledLabel>
        <StyledInput
          id="contractAddressInput"
          type="text"
          placeholder={
            bidDutchAuctionContract ? '' : '<Contract not yet connected>'
          }
          onChange={handleContractAddressChange}
          style={{ fontStyle: bidDutchAuctionContract ? 'normal' : 'italic' }}
        ></StyledInput>

        <StyledConnectContractButton
          disabled={!active}
          style={{
            cursor: !active ? 'not-allowed' : 'pointer',
            borderColor: !active ? 'unset' : 'blue'
          }}
          onClick={handleConnectContract}
        >
          Connect to DutchAuction Contract
        </StyledConnectContractButton>

        <StyledLabel htmlFor="bidPriceInput">Bid price (unit: wei)</StyledLabel>
        <StyledInput
          id="bidPriceInput"
          type="number"
          placeholder={
            bidDutchAuctionContract ? '' : '<Contract not yet connected>'
          }
          onChange={handleBidPriceChange}
          style={{ fontStyle: bidDutchAuctionContract ? 'normal' : 'italic' }}
        ></StyledInput>
        <StyledButton
          disabled={!active || (!bidDutchAuctionContract ? true : false)}
          style={{
            cursor:
              !active || !bidDutchAuctionContract ? 'not-allowed' : 'pointer',
            borderColor: !active || !bidDutchAuctionContract ? 'unset' : 'blue'
          }}
          onClick={handleBid}
        >
          Bid
        </StyledButton>

        <StyledLabel>Contract address</StyledLabel>
        <div>
          {bidDutchAuctionContractAddr ? (
            bidDutchAuctionContractAddr
          ) : (
            <em>{`<Contract not yet connected>`}</em>
          )}
        </div>
        {/* empty placeholder div */}
        <div></div>

        <StyledLabel>Reserve Price</StyledLabel>
        <div>
          {bidDutchAuctionContractAddr ? (
            reservePrice
          ) : (
            <em>{`<Contract not yet connected>`}</em>
          )}
        </div>
        {/* empty placeholder div */}
        <div></div>

        <StyledLabel>Offer Price Decrement</StyledLabel>
        <div>
          {bidDutchAuctionContractAddr ? (
            offerPriceDecrement
          ) : (
            <em>{`<Contract not yet connected>`}</em>
          )}
        </div>
        {/* empty placeholder div */}
        <div></div>

        <StyledLabel>Auction Start blocks number</StyledLabel>
        <div>
          {bidDutchAuctionContractAddr ? (
            beginBlockNum
          ) : (
            <em>{`<Contract not yet connected>`}</em>
          )}
        </div>
        {/* empty placeholder div */}
        <div></div>

        <StyledLabel>Auction End blocks number</StyledLabel>
        <div>
          {bidDutchAuctionContractAddr ? (
            beginBlockNum + numBlocksAuctionOpen - 1
          ) : (
            <em>{`<Contract not yet connected>`}</em>
          )}
        </div>
        {/* empty placeholder div */}
        <div></div>

        <StyledLabel>Current Bid</StyledLabel>
        <div>
          {bidDutchAuctionContractAddr ? (
            gotAcceptableBid ? (
              acceptedBid
            ) : (
              Math.max(
                reservePrice,
                reservePrice +
                  (beginBlockNum + numBlocksAuctionOpen - curBlockNum) *
                    offerPriceDecrement
              )
            )
          ) : (
            <em>{`<Contract not yet connected>`}</em>
          )}
        </div>
        {/* empty placeholder div */}
        <div></div>

        <StyledLabel>Finalized ?</StyledLabel>
        <div>
          {bidDutchAuctionContractAddr ? (
            finalized ? (
              'Yes'
            ) : (
              'No'
            )
          ) : (
            <em>{`<Contract not yet connected>`}</em>
          )}
        </div>
        {/* empty placeholder div */}
        <div></div>

        <StyledLabel>Accepted Bid</StyledLabel>
        <div>
          {bidDutchAuctionContractAddr ? (
            gotAcceptableBid ? (
              acceptedBid
            ) : (
              'Null'
            )
          ) : (
            <em>{`<Contract not yet connected>`}</em>
          )}
        </div>
        {/* empty placeholder div */}
        <div></div>
      </StyledAuctionDiv>
    </>
  );
}
