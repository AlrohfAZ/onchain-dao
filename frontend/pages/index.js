import {
  CryptoDevsDAOABI,
  CryptoDevsDAOAddress,
  CryptoDevsNFTABI,
  CryptoDevsNFTAddress,
} from "@/constants";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Head from "next/head";
import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { useAccount, useBalance, useContractRead } from "wagmi";
import { readContract, waitForTransaction, writeContract } from "wagmi/actions";
import styles from "../styles/Home.module.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export default function Home() {
  //Check if the users wallet is connected, and its address using Wagmi hooks.
  const { address, isConnected } = useAccount();

  //State variable to know if the component has been mounted yet or not
  const [isMounted, setIsMounted] = useState(false);

  //State Variable to show loading state when waiting for a transaction  to go through
  const [loading, setLoading] = useState(false);

  //Fake NFT Token Id to purchase, used when creating a proposal
  const [fakeNFTTokenId, setFakeNFTTokenId] = useState("");

  //State variable to store all proposals in DAO
  const [proposals, setProposals] = useState([]);

  //State variable to switch between the 'Create Proposal' and 'View Proposal' tabs
  const [selectedTab, setSelectedTab] = useState("");

  //Fetch the owner od the DAO
  const daoOwner = useContractRead({
    abi: CryptoDevsDAOABI,
    address: CryptoDevsDAOAddress,
    functionName: "owner",
  });

  //Fetch the balance of the DAO
  const daoBalance = useBalance({
    address: CryptoDevsDAOAddress,
  });

  //Fetch the number of proposals in the DAO
  const numOfProposalsInDAO = useContractRead({
    abi: CryptoDevsDAOABI,
    address: CryptoDevsDAOAddress,
    functionName: "numProposals",
  });

  //Fetch the CryptoDevs NFT of the user
  const nftBalanceOfUser = useContractRead({
    abi: CryptoDevsDAOABI,
    address: CryptoDevsDAOAddress,
    functionName: "balanceOf",
    args: [address],
  })

  //Function to make a createProposal transaction in the DAO
  async function createProposal() {
    setLoading(true);

    try {
      const tx = await writeContract({
        address: CryptoDevsDAOAddress,
        abi: CryptoDevsDAOABI,
        functionName: "createProposal",
        args: [fakeNFTTokenId],
      });

      await waitForTransaction(tx);
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
    setLoading(false);
  }

  //Function to fetch a propoasal by its ID
  async function fetchProposalById(id) {
    try {
      const proposal = await readContract({
        address: CryptoDevsDAOAddress,
        abi: CryptoDevsDAOABI,
        functionName: "proposals",
        arg: [id],
      });

      const [nftTokenId, deadline, yayVotes, nayVotes, executed] = proposal;
      const parsedProposal = {
        proposalId: id,
        nftTokenId: nftTokenId.toString(),
        deadline: new Date(parseInt(deadline.toString()) * 1000),
        yayVotes: yayVotes.toString(),
        nayVotes: nayVotes.toString(),
        executed: Boolean(executed),
      };

      return parsedProposal;
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
  }

  //Function to fetch all proposals in the DAO
  async function fetchAllProposals() {
    try {
      const proposals = [];

      for (let i = 0; i < numOfProposalsInDao.data; i++) {
        const proposal = await fetchProposalById(i);
        proposals.push(proposal);
      }

      setProposals(proposals);
      return proposals;
    } catch (error) {
      console.error(error);
      windown.alert(error);
    }
  }

  //Function to vote YAY or NAY on a proposal
  async function voteForProposal(proposalId, vote) {
    setLoading(true);
    try {
      const tx = await writeContract({
        address: CryptoDevsDAOAddress,
        abi: CryptoDevsDAOABI,
        functionName: "voteOnProposal",
        args: [proposalId, vote === "YAY" ? 0 : 1],
      });

      await waitForTransaction(tx);
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
    setLoading(false);
  }

  //Function to execute a proposal after deadline has been exceeded
  async function executeProposal(proposalId) {
    setLoading(true);
    try {
      const tx = await writeContract({
        address: CryptoDevsDAOAddress,
        abi: CryptoDevsDAOABI,
        functionName: "executeProposal",
        args: [proposalId],
      });

      await waitForTransaction(Tx);
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
    setLoading(false);
  }

  //Function to withdraw Ether from the DAO contract
  async function withdrawDAOEther() {
    setLoading(true);
    try {
      const tx = await writeContract({
        address: CryptoDevsDAOAddress,
        abi: CryptoDevsDAOABI,
        functionName: "withdrawEther",
        args: [],
      });

      await waitForTransaction(tx);
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
    setLoading(false);
  }

  //Render contents of the appropriate tab based on selected tab
  function renderTabs() {
    if (selectedTab === "Create Proposal") {
      return renderCreateProposalTab();
    } else if (selectedTab === "View Proposals") {
      return renderViewProposalsTab();
    }
    return null;
  }

  //Renders the Create Proposal tab content
  function renderCreateProposalTab() {
    if (loading) {
      return (
        <div className={styles.description}>Loading...Waiting For Transaction...</div>
      );
    } else if (nftBalanceOfUser.data === 0) {
      return (
        <div className={styles.description}>You do not any CryptoDevs NFTs. <br />
          <b>You can not create or vote on proposals</b></div>
      );
    } else {
      return (
        <div className={styles.container}><label>Fake NFT ID to purchase</label>
          <input
            placeholder="0"
            type="number"
            onChange={(e) => setFakeNFTTokenId(e.target.value)} />
          <button className={styles.button2} onClick={createProposal}>Create</button>
        </div>
      );
    }
  }

  //Renders the vie proposals tab content
  function renderViewProposalsTab() {
    if (loading) {
      return (
        <div className={styles.description}>
          Loading... Waiting for transaction...
        </div>
      );
    } else if (proposals.length === 0) {
      return (
        <div className={styles.description}>No proposals have been created</div>
      );
    } else {
      return (
        <div>
          {proposals.map((p, index) => (
            <div key={index} className={styles.card}>
              <p>Proposal ID: {p.proposalId}</p>
              <p>Fake NFT to Purchase: {p.nftTokenId}</p>
              <p>Deadline: {p.deadline.toLocaleString()}</p>
              <p>Yay Votes: {p.yayVotes}</p>
              <p>Nay Votes: {p.nayVotes}</p>
              <p>Executed?: {p.executed.toString()}</p>
              {p.deadline.getTime() > Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  <button
                    className={styles.button2}
                    onClick={() => voteForProposal(p.proposalId, "YAY")}
                  >
                    Vote YAY
                  </button>
                  <button
                    className={styles.button2}
                    onClick={() => voteForProposal(p.proposalId, "NAY")}
                  >
                    Vote NAY
                  </button>
                </div>
              ) : p.deadline.getTime() < Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  <button
                    className={styles.button2}
                    onClick={() => executeProposal(p.proposalId)}
                  >
                    Execute Proposal{" "}
                    {p.yayVotes > p.nayVotes ? "(YAY)" : "(NAY)"}
                  </button>
                </div>
              ) : (
                <div className={styles.description}>Proposal Executed</div>
              )}
            </div>
          ))}
        </div>
      );
    }
  }

  //Piece of code that runs everytime the value of selectedTab changes
  //Used to re-fetch all proposals in the DAO when user switches to the view proposals tab
  useEffect(() => {
    if (selectedTab === "View Proposals") {
      fetchAllProposals();
    }
  }, [selectedTab]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  if (!isConnected) return (
    <div><ConnectButton /></div>
  );
  return (
    <div className={inter.className}>
      <Head>
        <title>CryptoDevs DAO</title>
        <meta name="description" content="CryptoDevs DAO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome To Crypto Devs!</h1>
          <div className={styles.description}>Welcome To The DAO!</div>
          <div className={styles.description}>
            Your CryptoDevs NFT Balance: {nftBalanceOfUser.data?.toString()}
          </div> <br />
          {daoBalance.data && (
            <>
              Treasury Balance:{" "}
              {formatEther(daoBalance.data.value).toString()} ETH
            </>
          )}
          <br />
          Total Number of Proposals: {numOfProposalsInDAO.data.toString()}
        </div>
        <div className={styles.flex}>
          <button className={styles.button} onClick={() => setSelectedTab("Create Proposal")}>Create Proposal</button>
          <button className={styles.button} onClick={() => setSelectedTab("View Proposal")}>View Proposal</button>
        </div>
        {renderTabs()}
        {/*Display additional withdraw button if connected wallet is owner */}
        {address && address.toLowerCase() === daoOwner.data.toLowerCase() ? (
          <div>
            {loading ? (
              <button className={styles.button}>Loading...</button>
            ) : (
              <button className={styles.button} onClick={withdrawDAOEther}>
                Withdraw DAO ETH
              </button>
            )}
          </div>
        ) : ("")}
      </div>
      <div>
        <img className={styles.image} src="https://i.imgur.com/buNhbF7.png" />
      </div>
    </div>
  );
}
