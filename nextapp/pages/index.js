import Head from "next/head";
import styles from "../styles/Home.module.css";
import Web3Modal from "web3modal";
import { useState, useEffect, useRef } from "react";
import { utils, Contract, providers } from "ethers";
import { Icon, Label, Menu, Table } from "semantic-ui-react";
import {
  NFT_CONTRACT_ADDRESS,
  NFT_CONTRACT_ABI,
  DAO_CONTRACT_ADDRESS,
  DAO_CONTRACT_ABI,
} from "../constants";

export default function Home() {
  const [nftBalance, setNFTBalance] = useState(0);
  const [treasuryBalance, setTreasuryBalance] = useState(0);
  const [numOfProposals, setNumOfProposals] = useState(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const [selectedTab, setSelectedTab] = useState("");
  const [fakeNFTIdToBuy, setFakeNFTIdToBuy] = useState(0);
  const [loading, setLoading] = useState(false);
  const [proposals, setProposals] = useState([]);

  const web3ModalRef = useRef();

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet().then(() => {
        getUserNFTBalance();
        getTreasuryBalance();
        getNumOfProposals();
      });
    }
  }, [walletConnected]);

  useEffect(() => {
    loadAllProposals();
  }, [numOfProposals]);

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.error(error);
    }
  };
  const getProviderOrSigner = async (needSigner = false) => {
    const currentProvider = await web3ModalRef.current.connect();
    const web3provider = new providers.Web3Provider(currentProvider);

    const { chainId } = await web3provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Please connect to goerli network");
      throw new Error("Please connect to goerli network");
    }

    return needSigner ? web3provider.getSigner() : web3provider;
  };
  const getNFTContractInstance = (providerOrSigner) => {
    return new Contract(
      NFT_CONTRACT_ADDRESS,
      NFT_CONTRACT_ABI,
      providerOrSigner
    );
  };
  const getDAOContractInstance = (providerOrSigner) => {
    return new Contract(
      DAO_CONTRACT_ADDRESS,
      DAO_CONTRACT_ABI,
      providerOrSigner
    );
  };
  const getUserNFTBalance = async () => {
    try {
      const provider = await getProviderOrSigner();
      const contract = getNFTContractInstance(provider);
      const signer = await getProviderOrSigner(true);
      const _nftBalance = await contract.balanceOf(signer.getAddress());
      setNFTBalance(parseInt(_nftBalance.toString()));
    } catch (error) {
      console.error(error);
    }
  };
  const getTreasuryBalance = async () => {
    try {
      const provider = await getProviderOrSigner();
      const daoBalance = await provider.getBalance(DAO_CONTRACT_ADDRESS);
      setTreasuryBalance(daoBalance.toString());
    } catch (error) {
      console.error(error);
    }
  };
  const getNumOfProposals = async () => {
    try {
      const provider = await getProviderOrSigner(true);
      const contract = getDAOContractInstance(provider);
      const _numOfProposals = await contract.numProposals();
      setNumOfProposals(_numOfProposals.toString());
    } catch (error) {
      console.error(error);
    }
  };

  const createProposal = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const contract = getDAOContractInstance(signer);
      const tx = await contract.createProposal(fakeNFTIdToBuy);
      setLoading(true);
      await tx.wait();
      await getNumOfProposals();
      setLoading(false);
      window.alert("Proposal is created sucessfully");
      setSelectedTab("view");
    } catch (error) {
      console.error(error);
      setLoading(false);
      window.alert(error.reason);
    }
  };

  const loadAllProposals = async () => {
    try {
      const provider = await getProviderOrSigner();
      const contract = getDAOContractInstance(provider);
      const _proposals = [];
      for (let i = 0; i < numOfProposals; i++) {
        const proposal = await contract.proposals(i);
        _proposals.push(proposal);
      }
      setProposals(_proposals);
    } catch (error) {
      console.error(error);
    }
  };

  const voteOnProposal = async (proposalId, vote) => {
    try {
      const signer = await getProviderOrSigner(true);
      const contract = getDAOContractInstance(signer);
      const tx = await contract.voteOnProposal(proposalId, vote);
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("Your vote is casted successfully");
      loadAllProposals();
    } catch (error) {
      console.error(error);
      setLoading(false);
      window.alert(error.reason);
    }
  };

  const executeProposal = async (proposalId) => {
    try {
      const signer = await getProviderOrSigner(true);
      const contract = getDAOContractInstance(signer);
      const tx = await contract.exceuteProposal(proposalId);
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("Proposal is executed successfully");
      loadAllProposals();
      getTreasuryBalance();
    } catch (error) {
      console.error(error);
      setLoading(false);
      window.alert(error.reason);
    }
  };

  const renderTabs = () => {
    if (selectedTab === "create") return createProposalTab();
    else if (selectedTab === "view") return viewProposalsTab();
    else return null;
  };

  const createProposalTab = () => {
    if (loading) {
      return (
        <div
          className={styles.description}
          style={{
            textAlign: "left",
            marginLeft: "380px",
            marginTop: "20px",
          }}
        >
          Creating proposal ... please wait!
        </div>
      );
    } else if (nftBalance <= 0) {
      return (
        <div
          className={styles.description}
          style={{
            textAlign: "left",
            marginLeft: "380px",
            marginTop: "20px",
          }}
        >
          You are not DAO member. Only NFT holders can create proposal.
        </div>
      );
    } else {
      return (
        <div
          style={{
            textAlign: "left",
            marginLeft: "380px",
            marginTop: "20px",
          }}
        >
          <h1>Create Proposal</h1>
          <input
            type="number"
            className={styles.input}
            onChange={(e) => setFakeNFTIdToBuy(e.target.value)}
          />
          <br />
          <button className={styles.button} onClick={createProposal}>
            Create Proposal
          </button>
        </div>
      );
    }
  };
  const viewProposalsTab = () => {
    if (loading) {
      return (
        <div
          className={styles.description}
          style={{
            textAlign: "left",
            marginLeft: "380px",
            marginTop: "20px",
          }}
        >
          Processing ... please wait!
        </div>
      );
    } else
      return (
        <div
          style={{
            marginLeft: "10px",
            marginRight: "10px",
            marginTop: "20px",
          }}
        >
          <Table celled>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Proposal ID</Table.HeaderCell>
                <Table.HeaderCell>NFT ID to Buy</Table.HeaderCell>
                <Table.HeaderCell>Deadline</Table.HeaderCell>
                <Table.HeaderCell>YAY Votes</Table.HeaderCell>
                <Table.HeaderCell>NAY Votes</Table.HeaderCell>
                <Table.HeaderCell>Executed</Table.HeaderCell>
                <Table.HeaderCell>Approve</Table.HeaderCell>
                <Table.HeaderCell>Reject</Table.HeaderCell>
                <Table.HeaderCell>Action</Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {proposals.map((val, index) => {
                let currentDateTime = new Date();
                let proposalDeadline = new Date(
                  parseInt(val.deadline.toString()) * 1000
                );

                return (
                  <Table.Row>
                    <Table.Cell>{index}</Table.Cell>
                    <Table.Cell>{val.nftTokenId.toString()}</Table.Cell>
                    <Table.Cell>{proposalDeadline.toString()}</Table.Cell>
                    <Table.Cell>{val.yayvotes.toString()}</Table.Cell>
                    <Table.Cell>{val.nayvotes.toString()}</Table.Cell>
                    <Table.Cell>{val.executed ? "Yes" : "No"}</Table.Cell>
                    <Table.Cell>
                      <button
                        hidden={
                          val.executed || proposalDeadline < currentDateTime
                        }
                        onClick={() => {
                          voteOnProposal(index, 0);
                        }}
                      >
                        Vote
                      </button>
                      <label>
                        {proposalDeadline < currentDateTime
                          ? "Deadline Passed"
                          : ""}
                      </label>
                    </Table.Cell>
                    <Table.Cell>
                      <button
                        hidden={
                          val.executed || proposalDeadline < currentDateTime
                        }
                        onClick={() => {
                          voteOnProposal(index, 1);
                        }}
                      >
                        Vote
                      </button>
                      <label>
                        {proposalDeadline < currentDateTime
                          ? "Deadline Passed"
                          : ""}
                      </label>
                    </Table.Cell>
                    <Table.Cell>
                      <button
                        hidden={
                          val.executed || proposalDeadline > currentDateTime
                        }
                        onClick={() => {
                          executeProposal(index);
                        }}
                      >
                        Execute
                      </button>
                      <label>{val.executed ? "Already executed" : ""}</label>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        </div>
      );
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>DAO for Voters holding Crypto Devs NFT Collection</title>
        <meta name="description" content="NFT Voters DAO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>Welcome to the DAO!</div>
          <div className={styles.description}>
            Your CryptoDevs NFT Balance: {nftBalance}
            <br />
            Treasury Balance: {utils.formatEther(treasuryBalance)} ETH
            <br />
            Total Number of Proposals: {numOfProposals}
          </div>

          <div className={styles.flex}>
            {walletConnected ? (
              <div>
                <button
                  className={styles.button}
                  onClick={() => setSelectedTab("create")}
                  disabled={loading}
                >
                  Create Proposal
                </button>
                <button
                  className={styles.button}
                  onClick={() => setSelectedTab("view")}
                  disabled={loading}
                >
                  View Proposals
                </button>
              </div>
            ) : (
              <button className={styles.button} onClick={connectWallet}>
                Connect Wallet
              </button>
            )}
          </div>
          {}
        </div>

        <div>
          <img className={styles.image} src="/0.svg" />
        </div>
      </div>

      <div style={{ minHeight: "250px" }}>{renderTabs()}</div>

      <footer className={styles.footer}>
        Made with &#10084; by Kazim&#169;
      </footer>
    </div>
  );
}
