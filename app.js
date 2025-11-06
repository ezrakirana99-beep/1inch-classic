// app.js - simple frontend logic for 1inch-classic UI
const CONTRACT_ADDR = "0x111111125421cA6dc452d289314280a0f8842A65";
const NETWORKS = {
  polygon: { chainId: 137, rpc: "https://polygon-rpc.com" },
  bsc: { chainId: 56, rpc: "https://bsc-dataseed.binance.org" },
  arbitrum: { chainId: 42161, rpc: "https://arb1.arbitrum.io/rpc" },
  optimism: { chainId: 10, rpc: "https://mainnet.optimism.io" }
};

let provider, signer;
let currentNetwork = 'polygon';

const connectBtn = document.getElementById('connectBtn');
const networkSelect = document.getElementById('networkSelect');

networkSelect.addEventListener('change', (e) => {
  currentNetwork = e.target.value;
  alert("Network selected: " + currentNetwork);
});

// Tab switching
document.querySelectorAll('.tab').forEach(t=>{
  t.addEventListener('click', (ev)=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    ev.target.classList.add('active');
    const tab = ev.target.dataset.tab;
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.add('hidden'));
    document.getElementById(tab + 'Panel' === 'swapPanel' ? 'swapPanel' : tab + 'Panel');
    // small hack to map name
    if(tab === 'swap') { document.getElementById('swapPanel').classList.remove('hidden'); }
    if(tab === 'limit') { document.getElementById('limitPanel').classList.remove('hidden'); }
  });
});

// Connect wallet
connectBtn.onclick = async () => {
  if (!window.ethereum) return alert("Please install MetaMask.");
  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    const addr = await signer.getAddress();
    connectBtn.innerText = addr.slice(0,6) + "..." + addr.slice(-4);
    alert("Connected: " + addr);
  } catch (e) {
    console.error(e);
    alert("Failed to connect wallet: " + e.message);
  }
};

// Helper: load ABI
async function loadAbi() {
  try {
    const res = await fetch('./abi/aggregationRouterV2.json');
    const abi = await res.json();
    return abi;
  } catch (e) {
    console.warn("ABI not found or invalid. Provide abi/aggregationRouterV2.json for full functionality.");
    return null;
  }
}

// Simple swap (demo stub) — real implementation needs correct ABI method signature
document.getElementById('swapBtn').onclick = async () => {
  if (!signer) return alert("Connect wallet first.");
  const from = document.getElementById('swapFrom').value.trim();
  const to = document.getElementById('swapTo').value.trim();
  const amount = document.getElementById('swapFromAmount').value.trim();
  if (!from || !to || !amount) return alert("Fill token addresses and amount.");
  const abi = await loadAbi();
  if (!abi) return alert("ABI missing. Put ABI file in abi/aggregationRouterV2.json for swap functionality.");
  const contract = new ethers.Contract(CONTRACT_ADDR, abi, signer);
  try {
    // This is a simplified placeholder: actual router swap function signatures differ
    // Many 1inch router old versions had specific swap methods — use correct ABI method
    const tx = await contract.swapExactTokensForTokens ? await contract.swapExactTokensForTokens(ethers.parseUnits(amount, 18), 0, [from, to], await signer.getAddress(), Math.floor(Date.now()/1000)+60*10) : null;
    if(tx){
      alert("Swap tx sent: " + tx.hash);
      await tx.wait();
      alert("Swap confirmed.");
    } else {
      alert("Swap method not available in ABI placeholder. Use correct ABI or use the limit order flow.");
    }
  } catch (err) {
    console.error(err);
    alert("Swap failed: " + (err && err.message ? err.message : err));
  }
};

// Fill Order (taker)
document.getElementById('fillBtn').onclick = async () => {
  if (!signer) return alert("Connect wallet first.");
  const orderText = document.getElementById('orderJson').value.trim();
  const signature = document.getElementById('signature').value.trim();
  if(!orderText || !signature) return alert("Order JSON and signature required.");
  let order;
  try { order = JSON.parse(orderText); } catch(e) { return alert("Invalid JSON: " + e.message); }

  const abi = await loadAbi();
  if (!abi) return alert("ABI missing. Put ABI file in abi/aggregationRouterV2.json for fillOrder functionality.");
  const contract = new ethers.Contract(CONTRACT_ADDR, abi, signer);

  // Build tuple order as array in correct order — includes offsets and interactions fields
  // The ABI fillOrder expects a tuple — ensure the structure matches the ABI you use.
  const tupleOrder = [
    BigInt(order.salt || 0),
    order.makerAsset,
    order.takerAsset,
    order.maker,
    order.receiver,
    order.allowedSender || "0x0000000000000000000000000000000000000000",
    BigInt(order.makingAmount || 0),
    BigInt(order.takingAmount || 0),
    BigInt(order.offsets || 0),
    order.interactions || "0x"
  ];

  try {
    const tx = await contract.fillOrder(tupleOrder, signature, "0x", tupleOrder[6], tupleOrder[7], 0, { gasLimit: 1200000 });
    alert("fillOrder tx sent: " + tx.hash);
    await tx.wait();
    alert("Order filled.");
  } catch (err) {
    console.error(err);
    alert("fillOrder failed: " + (err && err.message ? err.message : err));
  }
};

// Approve (taker) basic helper: approves token to contract
document.getElementById('approveBtn').onclick = async () => {
  if (!signer) return alert("Connect wallet first.");
  const tokenAddr = prompt("Enter token contract address to approve (takerAsset):");
  if(!tokenAddr) return;
  const abiERC20 = ["function approve(address spender, uint256 amount) public returns (bool)"];
  const token = new ethers.Contract(tokenAddr, abiERC20, signer);
  try {
    const max = ethers.MaxUint256;
    const tx = await token.approve(CONTRACT_ADDR, max);
    alert("Approve tx sent: " + tx.hash);
    await tx.wait();
    alert("Approved contract to spend token.");
  } catch (err) {
    console.error(err);
    alert("Approve failed: " + (err && err.message ? err.message : err));
  }
};

// Read contract (basic)
document.getElementById('readBtn').onclick = async () => {
  const abi = await loadAbi();
  if (!abi) return alert("ABI missing.");
  alert("ABI loaded. You can edit app.js to call read methods directly.");
};

// Auto show swap panel
document.getElementById('swapPanel').classList.remove('hidden');
