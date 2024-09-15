import './App.css'; // Import CSS
import { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Countdown from 'react-countdown';
import { ethers } from 'ethers';

// IMG
import preview from '../preview.png';

// Components
import Navigation from './Navigation';
import Data from './Data';
import Mint from './Mint';
import Loading from './Loading';
import AddToWhitelist from './AddToWhitelist'; // Import nowego komponentu

// ABIs: Import your contract ABIs here
import NFT_ABI from '../abis/NFT.json';

// Config: Import your network config here
import config from '../config.json';

function App() {
  const [provider, setProvider] = useState(null);
  const [nft, setNFT] = useState(null);
  const [isOwner, setIsOwner] = useState(false); // Zmienna dla właściciela kontraktu
  const [account, setAccount] = useState(null);

  const [revealTime, setRevealTime] = useState(0);
  const [maxSupply, setMaxSupply] = useState(0);
  const [totalSupply, setTotalSupply] = useState(0);
  const [cost, setCost] = useState(0);
  const [balance, setBalance] = useState(0);

  const [mintAmount, setMintAmount] = useState(1); // Zmienna do przechowywania liczby NFT do mintowania
  const [latestTokenId, setLatestTokenId] = useState(null); // Zmienna do przechowywania ID najnowszego NFT
  const [ownedTokens, setOwnedTokens] = useState([]); // Nowa zmienna do przechowywania posiadanych NFT
  const [isLoading, setIsLoading] = useState(true);

  const loadBlockchainData = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);

    const nft = new ethers.Contract(config[31337].nft.address, NFT_ABI, provider);
    setNFT(nft);

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = ethers.utils.getAddress(accounts[0]);
    setAccount(account);

    // Sprawdź, czy zalogowany użytkownik jest właścicielem kontraktu
    const owner = await nft.owner();
    if (account.toLowerCase() === owner.toLowerCase()) {
      setIsOwner(true);
    }

    const allowMintingOn = await nft.allowMintingOn();
    setRevealTime(allowMintingOn.toString() + '000');

    setMaxSupply(await nft.maxSupply());
    setTotalSupply(await nft.totalSupply());
    setCost(await nft.cost());

    const userBalance = await nft.balanceOf(account);
    setBalance(userBalance);

    // Pobierz wszystkie NFT użytkownika
    if (userBalance > 0) {
      const walletOfOwner = await nft.walletOfOwner(account);
      setOwnedTokens(walletOfOwner);  // Zapisz wszystkie NFT użytkownika
      const latestToken = walletOfOwner[walletOfOwner.length - 1].toString();
      setLatestTokenId(latestToken);
    }

    setIsLoading(false);
  };

  const handleMint = async () => {
    if (nft && provider) {
      const signer = provider.getSigner();
      const transaction = await nft.connect(signer).mint(mintAmount, { value: cost.mul(mintAmount) });
      await transaction.wait();
      setIsLoading(true); // Odśwież dane po mintowaniu
    }
  };

  useEffect(() => {
    if (isLoading) {
      loadBlockchainData();
    }
  }, [isLoading]);

  return (
    <Container>
      <Navigation account={account} />

      <h1 className='my-4 text-center'>Dapp Punks</h1>

      {isOwner && <AddToWhitelist nftContract={nft} />} {/* Pokaż AddToWhitelist tylko właścicielowi */}

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <Row>
            <Col>
              {balance > 0 ? (
                <div className='text-center'>
                  <h2>Your NFTs:</h2>
                  <div className="nft-grid">
                    {ownedTokens.map(tokenId => (
                      <div key={tokenId.toString()} className="nft-item">
                        <img
                          src={`https://gateway.pinata.cloud/ipfs/QmQPEMsfd1tJnqYPbnTQCjoa8vczfsV1FmqZWgRdNQ7z3g/${tokenId}.png`}
                          alt={`NFT ${tokenId}`}
                          width="200px"
                          height="200px"
                        />
                        <p>NFT ID: {tokenId.toString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <img src={preview} alt="Preview" width="400px" height="400px" />
              )}
            </Col>

            <Col>
              <div className='my-4 text-center'>
                <Countdown date={parseInt(revealTime)} className='h2' />
              </div>

              <div className="mint-section">
                <input
                  type="number"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(Number(e.target.value))}
                  min="1"
                  max="5"  // Załóżmy, że maksymalna liczba do mintowania to 5
                  className="mint-input"
                  placeholder="Number of NFTs"
                />
                <button onClick={handleMint} className="btn btn-primary">
                  Mint {mintAmount} NFT(s)
                </button>
              </div>

              <Data
                maxSupply={maxSupply}
                totalSupply={totalSupply}
                cost={cost}
                balance={balance}
              />
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
}

export default App;
