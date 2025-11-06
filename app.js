const CONTRACT_ADDR = "0x111111125421cA6dc452d289314280a0f8842A65";
let provider, signer, contract;

const networkRPC = {
  polygon: "https://polygon-rpc.com",
  bsc: "https://bsc-dataseed.binance.org",
  arbitrum: "https://arb1.arbitrum.io/rpc",
  optimism: "https://mainnet.optimism.io"
};

document.getElementById("connectBtn").onclick = async () => {
  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  const address = await signer.getAddress();
  alert("Connected: " + address);
};

document.getElementById("swapBtn").onclick = async () => {
  const from = document.getElementById("fromToken").value;
  const to = document.getElementById("toToken").value;
  const amount = document.getElementById("amount").value;
  const abi = await fetch("./abi/aggregationRouterV2.json").then(r => r.json());
  const contract = new ethers.Contract(CONTRACT_ADDR, abi, signer);
  alert("Executing simple swap...");
  const tx = await contract.swap(from, to, ethers.parseUnits(amount, 18));
  await tx.wait();
  alert("Swap complete!");
};

document.getElementById("fillBtn").onclick = async () => {
  const order = JSON.parse(document.getElementById("orderJson").value);
  const signature = document.getElementById("signature").value;
  const abi = await fetch("./abi/aggregationRouterV2.json").then(r => r.json());
  const contract = new ethers.Contract(CONTRACT_ADDR, abi, signer);
  const tx = await contract.fillOrder(order, signature, 1);
  await tx.wait();
  alert("Order filled!");
};
