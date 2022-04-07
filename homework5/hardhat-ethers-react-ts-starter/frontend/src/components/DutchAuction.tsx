import { useWeb3React } from '@web3-react/core';
import { Contract, ethers, Signer } from 'ethers';
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
import { SectionDivider } from './SectionDivider';

const StyledDeployContractButton = styled.button`
  width: 220px;
  height: 2rem;
  border-radius: 1rem;
  border-color: blue;
  cursor: pointer;
  place-self: center;
`;

const StyledAuctionDiv = styled.div`
  display: grid;
  grid-template-rows: 1fr 1fr 1fr;
  grid-template-columns: 235px 2.7fr 1fr;
  grid-gap: 10px;
  place-self: center;
  align-items: center;
`;

const StyledOneLineDiv = styled.div`
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: 235px 2.7fr 1fr;
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
  width: 150px;
  height: 2rem;
  border-radius: 1rem;
  border-color: blue;
  cursor: pointer;
`;

export function DutchAuction(): ReactElement {
  const context = useWeb3React<Provider>();
  const { library, active } = context;

  const DEFAULT_NUMBER_VAL = -1;

  const [signer, setSigner] = useState<Signer>();
  const [DutchAuctionContract, setDutchAuctionContract] = useState<Contract>();
  const [DutchAuctionContractAddr, setDutchAuctionContractAddr] =
    useState<string>('');
  const [reservePriceInput, setReservePriceInput] =
    useState<number>(DEFAULT_NUMBER_VAL);
  const [offerPriceDecrementInput, setOfferPriceDecrementInput] =
    useState<number>(DEFAULT_NUMBER_VAL);
  const [numBlocksAuctionOpenInput, setNumBlocksAuctionOpenInput] =
    useState<number>(DEFAULT_NUMBER_VAL);
  const [judgeAddressInput, setJudgeAddressInput] = useState<string>('');

  useEffect((): void => {
    if (!library) {
      setSigner(undefined);
      return;
    }

    setSigner(library.getSigner());
  }, [library]);

  // useEffect((): void => {
  //   if (!DutchAuctionContract) {
  //     return;
  //   }

  //   async function getGreeting(DutchAuctionContract: Contract): Promise<void> {
  //     const _greeting = await DutchAuctionContract.greet();

  //     if (_greeting !== greeting) {
  //       setGreeting(_greeting);
  //     }
  //   }

  //   getGreeting(DutchAuctionContract);
  // }, [DutchAuctionContract, greeting]);

  function handleDeployContract(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    // only deploy the DutchAuction contract one time, when a signer is defined
    if (!signer) {
      return;
    }

    async function deployDutchAuctionContract(signer: Signer): Promise<void> {
      // check input parameters for DutchAuction
      if (reservePriceInput <= 0) {
        window.alert('Reserve price should > 0');
        return;
      }
      if (offerPriceDecrementInput <= 0) {
        window.alert('Offer price decrement should > 0');
        return;
      }
      if (numBlocksAuctionOpenInput <= 0) {
        window.alert('Auction open blocks number should > 0');
        return;
      }
      if (!ethers.utils.isAddress(judgeAddressInput)) {
        window.alert("Invalid judger's address");
        return;
      }
      const judgeAddress = ethers.utils.getAddress(judgeAddressInput);

      const DutchAuction = new ethers.ContractFactory(
        DutchAuctionArtifact.abi,
        DutchAuctionArtifact.bytecode,
        signer
      );

      try {
        const DutchAuctionContract = await DutchAuction.deploy(
          reservePriceInput,
          judgeAddress,
          numBlocksAuctionOpenInput,
          offerPriceDecrementInput
        );

        await DutchAuctionContract.deployed();
        console.log(
          'Deployed DutchAuctionContract: ' +
            [
              reservePriceInput,
              judgeAddress,
              numBlocksAuctionOpenInput,
              offerPriceDecrementInput
            ]
        );
        setDutchAuctionContract(DutchAuctionContract);

        window.alert(
          `DutchAuction deployed to: ${DutchAuctionContract.address}`
        );

        setDutchAuctionContractAddr(DutchAuctionContract.address);
      } catch (error: any) {
        window.alert(
          'Error!' + (error && error.message ? `\n\n${error.message}` : '')
        );
      }
    }

    deployDutchAuctionContract(signer);
  }

  function handleReservePriceChange(
    event: ChangeEvent<HTMLInputElement>
  ): void {
    event.preventDefault();
    setReservePriceInput(parseInt(event.target.value));
  }

  function handleOfferPriceDecrementChange(
    event: ChangeEvent<HTMLInputElement>
  ): void {
    event.preventDefault();
    setOfferPriceDecrementInput(parseInt(event.target.value));
  }

  function handleNumBlocksAuctionOpenChange(
    event: ChangeEvent<HTMLInputElement>
  ): void {
    event.preventDefault();
    setNumBlocksAuctionOpenInput(parseInt(event.target.value));
  }

  function handleJudgeAddressChange(
    event: ChangeEvent<HTMLInputElement>
  ): void {
    event.preventDefault();
    setJudgeAddressInput(event.target.value);
  }

  return (
    <>
      <StyledAuctionDiv>
        <StyledLabel htmlFor="reservePriceInput">Set reserve price</StyledLabel>
        <StyledInput
          id="reservePriceInput"
          type="number"
          placeholder={
            DutchAuctionContract ? '' : '<Contract not yet deployed>'
          }
          onChange={handleReservePriceChange}
          style={{ fontStyle: DutchAuctionContract ? 'normal' : 'italic' }}
        ></StyledInput>
        <div></div>

        <StyledLabel htmlFor="offerPriceDecrementInput">
          Set offer price decrement
        </StyledLabel>
        <StyledInput
          id="offerPriceDecrementInput"
          type="number"
          placeholder={
            DutchAuctionContract ? '' : '<Contract not yet deployed>'
          }
          onChange={handleOfferPriceDecrementChange}
          style={{ fontStyle: DutchAuctionContract ? 'normal' : 'italic' }}
        ></StyledInput>
        <div></div>

        <StyledLabel htmlFor="numBlocksAuctionOpenInput">
          Set auction open blocks number
        </StyledLabel>
        <StyledInput
          id="numBlocksAuctionOpenInput"
          type="number"
          placeholder={
            DutchAuctionContract ? '' : '<Contract not yet deployed>'
          }
          onChange={handleNumBlocksAuctionOpenChange}
          style={{ fontStyle: DutchAuctionContract ? 'normal' : 'italic' }}
        ></StyledInput>
        <div></div>

        <StyledLabel htmlFor="judgeAddressInput">
          Set judger's address
        </StyledLabel>
        <StyledInput
          id="judgeAddressInput"
          type="text"
          placeholder={
            DutchAuctionContract ? '' : '<Contract not yet deployed>'
          }
          onChange={handleJudgeAddressChange}
          style={{ fontStyle: DutchAuctionContract ? 'normal' : 'italic' }}
        ></StyledInput>
        <div></div>
      </StyledAuctionDiv>
      <StyledDeployContractButton
        disabled={!active ? true : false}
        style={{
          cursor: !active ? 'not-allowed' : 'pointer',
          borderColor: !active ? 'unset' : 'blue'
        }}
        onClick={handleDeployContract}
      >
        Deploy DutchAuction Contract
      </StyledDeployContractButton>
      <StyledOneLineDiv>
        <StyledLabel>Contract addr</StyledLabel>
        <div>
          {DutchAuctionContractAddr ? (
            DutchAuctionContractAddr
          ) : (
            <em>{`<Contract not yet deployed>`}</em>
          )}
        </div>
        {/* empty placeholder div below to provide empty first row, 3rd col div for a 2x3 grid */}
        <div></div>
      </StyledOneLineDiv>
      <SectionDivider />
    </>
  );
}
