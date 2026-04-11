// aetheron-wallet.js
// Aetheron Native Wallet - Full Implementation

// Configuration
const AETH_ADDRESS = "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";
const STAKING_ADDRESS = "0x896D9d37A67B0bBf81dde0005975DA7850FFa638";
const POLYGON_CHAIN_ID = 137;
const POLYGON_RPC = "https://polygon-rpc.com";

// AETH Token ABI
const AETH_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

// State
let wallet = null;
let provider = null;
let signer = null;
let aethContract = null;
let currentSeedPhrase = null;
let encryptionKey = null;

// Encryption helpers using Web Crypto API
async function generateEncryptionKey() {
  // Generate a random key for AES-GCM encryption
  return await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

async function deriveKeyFromPassword(password) {
  // Derive a key from a user password using PBKDF2
  const encoder = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  const key = await window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );

  return { key, salt };
}

async function encryptData(data, key) {
  const encoder = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(JSON.stringify(data)),
  );

  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted)),
  };
}

async function decryptData(encryptedObj, key) {
  const decoder = new TextDecoder();
  const iv = new Uint8Array(encryptedObj.iv);
  const data = new Uint8Array(encryptedObj.data);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data,
  );

  return JSON.parse(decoder.decode(decrypted));
}

async function encryptWalletData(walletData, password) {
  const { key, salt } = await deriveKeyFromPassword(password);
  const encrypted = await encryptData(walletData, key);
  return {
    salt: Array.from(salt),
    ...encrypted,
  };
}

async function decryptWalletData(encryptedWallet, password) {
  const { key, salt } = await deriveKeyFromPassword(password);
  salt.set(encryptedWallet.salt);
  return await decryptData(encryptedWallet, key);
}

// Generate or retrieve encryption key for session
async function getSessionKey() {
  if (!encryptionKey) {
    encryptionKey = await generateEncryptionKey();
  }
  return encryptionKey;
}

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

let walletPassword = null;
let pendingEncryptedWallet = null;

async function initApp() {
  updateConnectionStatus("connecting");

  try {
    provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC);
    aethContract = new ethers.Contract(AETH_ADDRESS, AETH_ABI, provider);

    // Check for stored wallet
    const storedWalletData = localStorage.getItem("aetheron_wallet");

    if (storedWalletData) {
      try {
        const encryptedData = JSON.parse(storedWalletData);

        // Check if data is password-encrypted (has salt, iv, and data)
        if (encryptedData.salt && encryptedData.iv && encryptedData.data) {
          // Store for login screen and show login
          pendingEncryptedWallet = encryptedData;
          showScreen("login");
          return;
        } else if (encryptedData.iv && encryptedData.data) {
          // Old session-based encryption - need migration
          pendingEncryptedWallet = encryptedData;
          showScreen("login");
          return;
        } else {
          // Legacy unencrypted data - still works but should migrate
          await loadWallet(encryptedData.seedPhrase);
        }
      } catch (decryptError) {
        console.error("Failed to decrypt wallet:", decryptError);
        localStorage.removeItem("aetheron_wallet");
        localStorage.removeItem("aetheron_wallet_verifier");
      }
    }

    updateConnectionStatus("connected");
  } catch (error) {
    console.error("Init error:", error);
    updateConnectionStatus("error");
  }
}
      } catch (decryptError) {
        console.error("Failed to decrypt wallet:", decryptError);
        localStorage.removeItem("aetheron_wallet");
        localStorage.removeItem("aetheron_wallet_verifier");
      }
    }

    updateConnectionStatus("connected");
  } catch (error) {
    console.error("Init error:", error);
    updateConnectionStatus("error");
  }
}

// Show password prompt on load
function showPasswordPrompt(encryptedData) {
  const password = prompt("Enter your wallet password to unlock:");
  if (!password) {
    showScreen("welcome");
    return;
  }

  unlockWallet(encryptedData, password);
}

// Show migration prompt for old wallets
function showMigrationPrompt(encryptedData) {
  const password = prompt(
    "Your wallet needs to be updated. Please set a new password:",
  );
  if (!password || password.length < 8) {
    alert("Password must be at least 8 characters");
    showMigrationPrompt(encryptedData);
    return;
  }

  const confirm = prompt("Confirm password:");
  if (password !== confirm) {
    alert("Passwords do not match");
    showMigrationPrompt(encryptedData);
    return;
  }

  // Decrypt with old key, re-encrypt with password
  // For simplicity, we'll just create new storage
  unlockWallet(encryptedData, password);
}

// Unlock wallet with password
async function unlockWallet(encryptedData, password) {
  try {
    const salt = new Uint8Array(encryptedData.salt);
    const { key } = await deriveKeyFromPasswordWithSalt(password, salt);
    const walletData = await decryptData(encryptedData, key);

    // Verify password using stored hash
    const storedVerifier = localStorage.getItem("aetheron_wallet_verifier");
    if (storedVerifier) {
      const inputHash = await hashPassword(password);
      if (inputHash !== storedVerifier) {
        alert("Incorrect password");
        showScreen("welcome");
        return;
      }
    }

    // Store password for session (not in localStorage)
    walletPassword = password;

    await loadWallet(walletData.seedPhrase);
    updateConnectionStatus("connected");
  } catch (error) {
    console.error("Unlock error:", error);
    alert("Failed to unlock wallet. Incorrect password?");
    showScreen("welcome");
  }
}

// Derive key from password with existing salt
async function deriveKeyFromPasswordWithSalt(password, existingSalt) {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: existingSalt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
  return { key, salt: existingSalt };
}

function updateConnectionStatus(status) {
  const el = document.getElementById("connectionStatus");
  if (!el) return;

  switch (status) {
    case "connected":
      el.innerHTML =
        '<i class="fas fa-check-circle" style="color: var(--success);"></i> Connected';
      break;
    case "connecting":
      el.innerHTML = '<i class="fas fa-sync fa-spin"></i> Connecting...';
      break;
    case "error":
      el.innerHTML =
        '<i class="fas fa-exclamation-circle" style="color: var(--error);"></i> Error';
      break;
  }
}

// Screen Navigation
function showScreen(screenName) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));

  switch (screenName) {
    case "welcome":
      document.getElementById("welcomeScreen").classList.add("active");
      break;
    case "login":
      document.getElementById("loginScreen").classList.add("active");
      break;
    case "create":
      generateSeedPhrase();
      document.getElementById("createScreen").classList.add("active");
      break;
    case "import":
      document.getElementById("importScreen").classList.add("active");
      break;
    case "dashboard":
      if (wallet) {
        updateDashboard();
        document.getElementById("dashboardScreen").classList.add("active");
      } else {
        showScreen("welcome");
      }
      break;
    case "send":
      if (wallet) {
        document.getElementById("sendScreen").classList.add("active");
        updateSendMaxBalance();
      } else {
        showScreen("welcome");
      }
      break;
    case "stake":
      if (wallet) {
        document.getElementById("stakeScreen").classList.add("active");
        loadStakingInfo();
      } else {
        showScreen("welcome");
      }
      break;
    case "swap":
      if (wallet) {
        document.getElementById("swapScreen").classList.add("active");
        updateSwapRates();
      } else {
        showScreen("welcome");
      }
      break;
    case "viewSeed":
      document.getElementById("viewSeedScreen").classList.add("active");
      displayStoredSeed();
      break;
  }
}

// Attempt to unlock wallet with password
let pendingEncryptedWalletData = null;

async function attemptUnlock() {
  const password = document.getElementById('unlockPassword').value;
  const errorEl = document.getElementById('unlockError');
  
  if (!password) {
    errorEl.textContent = 'Please enter your password';
    return;
  }
  
  if (!pendingEncryptedWallet) {
    showScreen('welcome');
    return;
  }
  
  try {
    const salt = new Uint8Array(pendingEncryptedWallet.salt);
    const { key } = await deriveKeyFromPasswordWithSalt(password, salt);
    const walletData = await decryptData(pendingEncryptedWallet, key);
    
    // Verify password using stored hash
    const storedVerifier = localStorage.getItem('aetheron_wallet_verifier');
    if (storedVerifier) {
      const inputHash = await hashPassword(password);
      if (inputHash !== storedVerifier) {
        errorEl.textContent = 'Incorrect password';
        return;
      }
    }
    
    // Success - load wallet
    walletPassword = password;
    await loadWallet(walletData.seedPhrase);
    document.getElementById('unlockPassword').value = '';
    errorEl.textContent = '';
    pendingEncryptedWallet = null;
  } catch (error) {
    console.error('Unlock error:', error);
    errorEl.textContent = 'Incorrect password';
  }
}
      break;
    case "send":
      if (wallet) {
        document.getElementById("sendScreen").classList.add("active");
        updateSendMaxBalance();
      } else {
        showScreen("welcome");
      }
      break;
    case "stake":
      if (wallet) {
        document.getElementById("stakeScreen").classList.add("active");
        loadStakingInfo();
      } else {
        showScreen("welcome");
      }
      break;
    case "swap":
      if (wallet) {
        document.getElementById("swapScreen").classList.add("active");
        updateSwapRates();
      } else {
        showScreen("welcome");
      }
      break;
    case "viewSeed":
      document.getElementById("viewSeedScreen").classList.add("active");
      displayStoredSeed();
      break;
    case "login":
      document.getElementById("loginScreen").classList.add("active");
      break;
  }
}

// Seed Phrase Generation
function generateSeedPhrase() {
  // Use ethers.js to generate mnemonic
  const entropy = ethers.utils.randomBytes(16);
  const mnemonic = ethers.utils.entropyToMnemonic(entropy);
  const words = mnemonic.split(" ");

  currentSeedPhrase = words;

  // Display seed phrase
  const display = document.getElementById("seedPhraseDisplay");
  display.innerHTML = words
    .map(
      (word, i) => `
        <div class="seed-word">
            <span class="number">${String(i + 1).padStart(2, "0")}</span>
            ${word}
        </div>
    `,
    )
    .join("");

  // Enable create button when checkbox is checked AND password is filled
  const updateCreateButtonState = () => {
    const seedSaved = document.getElementById('seedSaved')?.checked || false;
    const password = document.getElementById('walletPasswordCreate')?.value || '';
    const confirm = document.getElementById('walletPasswordCreateConfirm')?.value || '';
    const btn = document.getElementById('createWalletBtn');
    if (btn) {
      btn.disabled = !(seedSaved && password.length >= 8 && password === confirm);
    }
  };

  document.getElementById('seedSaved').addEventListener('change', updateCreateButtonState);
  document.getElementById('walletPasswordCreate').addEventListener('input', updateCreateButtonState);
  document.getElementById('walletPasswordCreateConfirm').addEventListener('input', updateCreateButtonState);
}

// Create Wallet from Generated Seed (with password)
async function createWalletFromSeed() {
  if (!currentSeedPhrase) return;

  const password = document.getElementById("walletPasswordCreate").value;
  const confirmPassword = document.getElementById(
    "walletPasswordCreateConfirm",
  ).value;
  const errorEl = document.getElementById("createPasswordError");

  // Validate password
  if (!password || password.length < 8) {
    errorEl.textContent = "Password must be at least 8 characters";
    return;
  }

  if (password !== confirmPassword) {
    errorEl.textContent = "Passwords do not match";
    return;
  }

  errorEl.textContent = "";
  const mnemonic = currentSeedPhrase.join(" ");
  await saveAndLoadWallet(mnemonic, password);
}

// Import Existing Wallet (with password)
async function importWallet() {
  const seedInput = document.getElementById("importSeedInput").value.trim();
  const password = document.getElementById("walletPasswordImport").value;
  const errorEl = document.getElementById("importError");

  if (!seedInput) {
    errorEl.textContent = "Please enter your seed phrase";
    return;
  }

  if (!password) {
    errorEl.textContent = "Please enter your password";
    return;
  }

  const words = seedInput.toLowerCase().split(/\s+/);

  // Validate word count
  if (words.length !== 12 && words.length !== 24) {
    errorEl.textContent = "Seed phrase must be 12 or 24 words";
    return;
  }

  try {
    // Validate mnemonic
    const mnemonic = words.join(" ");
    const checkWallet = ethers.Wallet.fromMnemonic(mnemonic);

    await saveAndLoadWallet(mnemonic, password);
  } catch (error) {
    console.error("Import error:", error);
    errorEl.textContent = "Invalid seed phrase. Please check and try again.";
  }
}

// Import Existing Wallet
function importWallet() {
  const seedInput = document.getElementById("importSeedInput").value.trim();
  const errorEl = document.getElementById("importError");

  if (!seedInput) {
    errorEl.textContent = "Please enter your seed phrase";
    return;
  }

  const words = seedInput.toLowerCase().split(/\s+/);

  // Validate word count
  if (words.length !== 12 && words.length !== 24) {
    errorEl.textContent = "Seed phrase must be 12 or 24 words";
    return;
  }

  try {
    // Validate mnemonic
    const mnemonic = words.join(" ");
    const checkWallet = ethers.Wallet.fromMnemonic(mnemonic);

    saveAndLoadWallet(mnemonic);
  } catch (error) {
    console.error("Import error:", error);
    errorEl.textContent = "Invalid seed phrase. Please check and try again.";
  }
}

// Save Wallet and Load (with password-based encryption)
async function saveAndLoadWallet(mnemonic, password) {
  try {
    // Create wallet from mnemonic
    wallet = ethers.Wallet.fromMnemonic(mnemonic);

    const walletData = {
      seedPhrase: mnemonic,
      address: wallet.address,
      created: Date.now(),
    };

    // Encrypt wallet data using password before storing
    const { key, salt } = await deriveKeyFromPassword(password);
    const encryptedData = await encryptData(walletData, key);

    // Store encrypted data with salt in localStorage
    const storageData = {
      salt: Array.from(salt),
      iv: encryptedData.iv,
      data: encryptedData.data,
    };
    localStorage.setItem("aetheron_wallet", JSON.stringify(storageData));

    // Store password hash for verification (not the password itself!)
    const passwordHash = await hashPassword(password);
    localStorage.setItem("aetheron_wallet_verifier", passwordHash);

    // Setup provider and signer
    provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC);
    signer = wallet.connect(provider);
    aethContract = new ethers.Contract(AETH_ADDRESS, AETH_ABI, signer);

    currentSeedPhrase = mnemonic.split(" ");

    showScreen("dashboard");
  } catch (error) {
    console.error("Save wallet error:", error);
    alert("Failed to create wallet: " + error.message);
  }
}

// Helper to hash password for verification
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "aetheron_wallet_salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Load Existing Wallet
async function loadWallet(seedPhrase) {
  try {
    wallet = ethers.Wallet.fromMnemonic(seedPhrase);
    provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC);
    signer = wallet.connect(provider);
    aethContract = new ethers.Contract(AETH_ADDRESS, AETH_ABI, signer);

    currentSeedPhrase = seedPhrase.split(" ");

    showScreen("dashboard");
  } catch (error) {
    console.error("Load wallet error:", error);
    localStorage.removeItem("aetheron_wallet");
    showScreen("welcome");
  }
}

// Update Dashboard
async function updateDashboard() {
  if (!wallet) return;

  // Update address display
  document.getElementById("addressText").textContent = wallet.address;

  // Get balance
  try {
    const balance = await aethContract.balanceOf(wallet.address);
    const decimals = await aethContract.decimals();
    const formattedBalance = ethers.utils.formatUnits(balance, decimals);

    document.getElementById("balanceAmount").textContent =
      parseFloat(formattedBalance).toFixed(4);

    // Get AETH price (approximate - in production use oracle)
    const price = await getAethPrice();
    const usdValue = parseFloat(formattedBalance) * price;
    document.getElementById("balanceUsd").textContent =
      "$" + usdValue.toFixed(2) + " USD";
  } catch (error) {
    console.error("Balance error:", error);
    document.getElementById("balanceAmount").textContent = "0.0000";
  }

  // Load transaction history
  await loadTransactionHistory();
}

// Get AETH Price (from QuickSwap pair)
async function getAethPrice() {
  try {
    const pairAddress = "0xd57c5E33ebDC1b565F99d06809debbf86142705D";
    const pairAbi = [
      "function getReserves() view returns (uint112, uint112, uint32)",
    ];
    const pairContract = new ethers.Contract(pairAddress, pairAbi, provider);
    const reserves = await pairContract.getReserves();

    // AETH/USDC pair - AETH is token0
    const aethReserve = ethers.utils.formatEther(reserves[0]);
    const usdcReserve = reserves[1] / 1e6;

    return usdcReserve / parseFloat(aethReserve);
  } catch (error) {
    console.error("Price fetch error:", error);
    return 0.001; // Fallback price
  }
}

// Transaction History
async function loadTransactionHistory() {
  const container = document.getElementById("txHistory");

  try {
    // Get transfer events
    const filter = aethContract.filters.Transfer(null, wallet.address);
    const received = await aethContract.queryFilter(filter, -10000);

    const sentFilter = aethContract.filters.Transfer(wallet.address, null);
    const sent = await aethContract.queryFilter(sentFilter, -10000);

    // Combine and sort
    const allTxs = [
      ...received.map((e) => ({ ...e, type: "receive" })),
      ...sent.map((e) => ({ ...e, type: "send" })),
    ]
      .sort((a, b) => b.blockNumber - a.blockNumber)
      .slice(0, 10);

    if (allTxs.length === 0) {
      container.innerHTML =
        '<p style="color: var(--text-muted); text-align: center; padding: 20px; font-size: 13px;">No transactions yet</p>';
      return;
    }

    container.innerHTML = allTxs
      .map((tx) => {
        const amount = ethers.utils.formatEther(tx.args.value);
        const shortAddr =
          tx.type === "receive"
            ? tx.args.from.slice(0, 6) + "..."
            : tx.args.to.slice(0, 6) + "...";

        return `
                <div class="tx-item">
                    <div class="tx-icon ${tx.type}">
                        <i class="fas fa-arrow-${tx.type === "receive" ? "down" : "up"}"></i>
                    </div>
                    <div class="tx-details">
                        <div class="tx-type">${tx.type === "receive" ? "Received" : "Sent"}</div>
                        <div class="tx-address">${shortAddr}</div>
                    </div>
                    <div class="tx-amount ${tx.type}">
                        <div>${tx.type === "receive" ? "+" : "-"}${parseFloat(amount).toFixed(4)}</div>
                        <div class="tx-time">AETH</div>
                    </div>
                </div>
            `;
      })
      .join("");
  } catch (error) {
    console.error("Tx history error:", error);
    container.innerHTML =
      '<p style="color: var(--text-muted); text-align: center; padding: 20px; font-size: 13px;">Error loading transactions</p>';
  }
}

// Update Send Max Balance
async function updateSendMaxBalance() {
  if (!wallet) return;

  try {
    const balance = await aethContract.balanceOf(wallet.address);
    const formatted = ethers.utils.formatEther(balance);
    document.getElementById("sendMaxBalance").textContent =
      parseFloat(formatted).toFixed(4) + " AETH";
  } catch (error) {
    document.getElementById("sendMaxBalance").textContent = "0 AETH";
  }
}

// Send Transaction
async function sendTransaction() {
  const toAddress = document.getElementById("sendToAddress").value.trim();
  const amount = document.getElementById("sendAmount").value;
  const isInternal = document.getElementById("internalTransfer").checked;
  const errorEl = document.getElementById("sendError");

  errorEl.textContent = "";

  // Validation
  if (!ethers.utils.isAddress(toAddress)) {
    errorEl.textContent = "Invalid recipient address";
    return;
  }

  if (!amount || parseFloat(amount) <= 0) {
    errorEl.textContent = "Invalid amount";
    return;
  }

  try {
    const amountWei = ethers.utils.parseEther(amount);

    // Check balance
    const balance = await aethContract.balanceOf(wallet.address);
    if (balance.lt(amountWei)) {
      errorEl.textContent = "Insufficient balance";
      return;
    }

    if (isInternal) {
      // Internal transfer (no gas, instant)
      await sendInternalTransfer(toAddress, amountWei);
    } else {
      // On-chain transfer (requires gas)
      await sendOnChainTransfer(toAddress, amountWei);
    }
  } catch (error) {
    console.error("Send error:", error);
    errorEl.textContent = "Error: " + error.message;
  }
}

// Internal Aetheron Transfer (simulated - no gas)
async function sendInternalTransfer(toAddress, amountWei) {
  // In production, this would call an internal transfer function on a contract
  // For now, simulate with on-chain transfer
  const tx = await aethContract.transfer(toAddress, amountWei);

  document.getElementById("txHashDisplay").textContent = "Hash: " + tx.hash;
  document.getElementById("txExplorerLink").href =
    "https://polygonscan.com/tx/" + tx.hash;
  document.getElementById("txSentModal").classList.add("active");

  // Clear form
  document.getElementById("sendToAddress").value = "";
  document.getElementById("sendAmount").value = "";
  document.getElementById("internalTransfer").checked = false;

  // Refresh balance
  await updateDashboard();
}

// On-chain Transfer
async function sendOnChainTransfer(toAddress, amountWei) {
  const tx = await aethContract.transfer(toAddress, amountWei);

  document.getElementById("txHashDisplay").textContent = "Hash: " + tx.hash;
  document.getElementById("txExplorerLink").href =
    "https://polygonscan.com/tx/" + tx.hash;
  document.getElementById("txSentModal").classList.add("active");

  // Clear form
  document.getElementById("sendToAddress").value = "";
  document.getElementById("sendAmount").value = "";

  // Refresh balance
  await updateDashboard();
}

// Close transaction sent modal
function closeTxSentModal() {
  document.getElementById("txSentModal").classList.remove("active");
}

// Show Receive Modal
function showReceiveModal() {
  if (!wallet) return;

  const modal = document.getElementById("receiveModal");
  const qrContainer = document.getElementById("qrCode");
  const addressEl = document
    .getElementById("receiveAddress")
    .querySelector("span");

  // Set address
  addressEl.textContent = wallet.address;

  // Generate QR
  qrContainer.innerHTML = "";
  new QRCode(qrContainer, {
    text: wallet.address,
    width: 180,
    height: 180,
    colorDark: "#000000",
    colorLight: "#ffffff",
  });

  modal.classList.add("active");
}

// Close Receive Modal
function closeReceiveModal() {
  document.getElementById("receiveModal").classList.remove("active");
}

// Copy Address
function copyAddress() {
  if (!wallet) return;

  navigator.clipboard.writeText(wallet.address).then(() => {
    alert("Address copied to clipboard!");
  });
}

// View Seed Phrase
function showSeedPhrase() {
  showScreen("viewSeed");
}

// Display Stored Seed
function displayStoredSeed() {
  if (!currentSeedPhrase) return;

  const display = document.getElementById("viewSeedPhrase");
  display.innerHTML = currentSeedPhrase
    .map(
      (word, i) => `
        <div class="seed-word">
            <span class="number">${String(i + 1).padStart(2, "0")}</span>
            ${word}
        </div>
    `,
    )
    .join("");
}

// Copy Seed Phrase
function copySeedPhrase() {
  if (!currentSeedPhrase) return;

  navigator.clipboard.writeText(currentSeedPhrase.join(" ")).then(() => {
    alert("Seed phrase copied to clipboard!");
  });
}

// Logout
function logout() {
  if (
    confirm(
      "Are you sure you want to logout? Make sure you have saved your seed phrase.",
    )
  ) {
    localStorage.removeItem("aetheron_wallet");
    localStorage.removeItem("aetheron_wallet_verifier");
    wallet = null;
    signer = null;
    currentSeedPhrase = null;
    encryptionKey = null; // Clear encryption key
    walletPassword = null;
    pendingEncryptedWallet = null;
    showScreen("welcome");
  }
}

// Export for debugging
window.aetheronWallet = {
  getWallet: () => wallet,
  getAddress: () => wallet?.address,
  getBalance: async () => {
    if (!wallet) return null;
    return await aethContract.balanceOf(wallet.address);
  },
};

// Staking Variables
let selectedPool = 0;
let stakingContract = null;

const STAKING_ABI = [
  "function stake(uint256 poolId, uint256 amount)",
  "function unstake(uint256 stakeId)",
  "function claimRewards(uint256 stakeId)",
  "function getUserStakes(address user) view returns (tuple(uint256 amount, uint256 startTime, uint256 lastClaimTime, uint256 poolId, uint256 pendingReward, uint256 unlockTime)[])",
  "function pools(uint256) view returns (uint256 duration, uint256 rewardRate, uint256 totalStaked, bool active)",
];

const POOL_INFO = [
  { duration: 30, apy: 8, lockDays: "30 Days", minStake: 100 },
  { duration: 90, apy: 12, lockDays: "90 Days", minStake: 500 },
  { duration: 180, apy: 18, lockDays: "180 Days", minStake: 1000 },
];

// Initialize staking
async function initStaking() {
  if (!signer) return;
  stakingContract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);
}

// Select stake pool
function selectStakePool(poolIndex) {
  selectedPool = poolIndex;
  document.querySelectorAll(".tab-btn").forEach((btn, i) => {
    btn.classList.toggle("active", i === poolIndex);
  });
  document.getElementById("poolApy").textContent =
    POOL_INFO[poolIndex].apy + "%";
  document.getElementById("poolLock").textContent =
    POOL_INFO[poolIndex].lockDays;
}

// Load staking info
async function loadStakingInfo() {
  await initStaking();

  if (!stakingContract || !wallet) return;

  try {
    // Get user's stakes
    const stakes = await stakingContract.getUserStakes(wallet.address);
    displayActiveStakes(stakes);

    // Calculate total staked and rewards
    let totalStaked = 0;
    let totalRewards = 0;
    stakes.forEach((s) => {
      totalStaked += parseFloat(ethers.utils.formatEther(s.amount));
      totalRewards += parseFloat(ethers.utils.formatEther(s.pendingReward));
    });

    document.getElementById("stakedAmount").textContent =
      totalStaked.toFixed(4) + " AETH";
    document.getElementById("stakingRewards").textContent =
      totalRewards.toFixed(4) + " AETH";
  } catch (error) {
    console.error("Staking info error:", error);
  }
}

// Display active stakes
function displayActiveStakes(stakes) {
  const container = document.getElementById("activeStakes");
  if (!stakes || stakes.length === 0) {
    container.innerHTML =
      '<p style="color: var(--text-muted); text-align: center; padding: 20px; font-size: 13px;">No active stakes</p>';
    return;
  }

  container.innerHTML = stakes
    .map((s, i) => {
      const pool = POOL_INFO[s.poolId] || POOL_INFO[0];
      const amount = parseFloat(ethers.utils.formatEther(s.amount));
      const reward = parseFloat(ethers.utils.formatEther(s.pendingReward));
      const unlockTime = new Date(parseInt(s.unlockTime) * 1000);
      const isUnlocked = unlockTime < new Date();

      return `
      <div style="background: var(--bg-elevated); padding: 12px; border-radius: 10px; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-weight: 600;">Pool ${s.poolId + 1} - ${pool.lockDays}</span>
          <span style="color: ${isUnlocked ? "var(--success)" : "var(--warning)"}">${isUnlocked ? "Unlocked" : "Locked"}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; color: var(--text-muted);">
          <span>Staked: ${amount.toFixed(2)} AETH</span>
          <span>Reward: ${reward.toFixed(4)} AETH</span>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 8px;">
          ${!isUnlocked ? `<button class="btn btn-secondary" style="padding: 8px 12px; font-size: 12px;" onclick="unstake(${i})">Unstake</button>` : ""}
          <button class="btn btn-primary" style="padding: 8px 12px; font-size: 12px;" onclick="claimStakeReward(${i})">Claim</button>
        </div>
      </div>
    `;
    })
    .join("");
}

// Set max stake
function setMaxStake() {
  document.getElementById("stakeAmount").value = document
    .getElementById("sendMaxBalance")
    .textContent.replace(" AETH", "");
}

// Stake tokens
async function stakeTokens() {
  const amount = document.getElementById("stakeAmount").value;
  const errorEl = document.getElementById("stakeError");

  if (!amount || parseFloat(amount) < POOL_INFO[selectedPool].minStake) {
    errorEl.textContent = `Minimum stake is ${POOL_INFO[selectedPool].minStake} AETH`;
    return;
  }

  try {
    await initStaking();

    const amountWei = ethers.utils.parseEther(amount);

    // Approve tokens first
    const approveTx = await aethContract.approve(STAKING_ADDRESS, amountWei);
    await approveTx.wait();

    // Stake
    const stakeTx = await stakingContract.stake(selectedPool, amountWei);
    await stakeTx.wait();

    errorEl.textContent = "";
    errorEl.className = "success-msg";
    errorEl.textContent = "Staking successful!";

    document.getElementById("stakeAmount").value = "";
    loadStakingInfo();
    updateDashboard();
  } catch (error) {
    console.error("Stake error:", error);
    errorEl.textContent = "Error: " + (error.message || "Staking failed");
  }
}

// Unstake
async function unstake(stakeId) {
  try {
    await initStaking();
    const tx = await stakingContract.unstake(stakeId);
    await tx.wait();
    loadStakingInfo();
    updateDashboard();
  } catch (error) {
    console.error("Unstake error:", error);
    alert("Error: " + (error.message || "Unstake failed"));
  }
}

// Claim staking rewards
async function claimStakingRewards() {
  try {
    await initStaking();
    const stakes = await stakingContract.getUserStakes(wallet.address);

    for (let i = 0; i < stakes.length; i++) {
      if (parseFloat(ethers.utils.formatEther(stakes[i].pendingReward)) > 0) {
        const tx = await stakingContract.claimRewards(i);
        await tx.wait();
      }
    }

    loadStakingInfo();
    updateDashboard();
    alert("Rewards claimed!");
  } catch (error) {
    console.error("Claim error:", error);
    alert("Error: " + (error.message || "Claim failed"));
  }
}

async function claimStakeReward(stakeId) {
  await claimStakingRewards();
}

// SWAP FUNCTIONS
let swapPrices = {
  AETH: 0.001,
  MATIC: 0.0008,
  USDC: 0.000001,
};

async function updateSwapRates() {
  // Update from token balance
  const fromToken = document.getElementById("fromToken").value;
  let balance = 0;

  if (fromToken === "AETH" && aethContract) {
    const bal = await aethContract.balanceOf(wallet.address);
    balance = parseFloat(ethers.utils.formatEther(bal));
  } else if (fromToken === "MATIC") {
    const bal = await provider.getBalance(wallet.address);
    balance = parseFloat(ethers.utils.formatEther(bal));
  } else if (fromToken === "USDC") {
    // USDC would need a contract lookup - use mock for now
    balance = 0;
  }

  document.getElementById("fromTokenBalance").textContent = balance.toFixed(2);

  // Update rate display
  const rate = swapPrices[fromToken] || 0;
  document.getElementById("swapRate").textContent =
    `1 ${fromToken} = $${(rate * 1000000).toFixed(4)}`;
}

// Calculate swap amount
document.addEventListener("input", function (e) {
  if (e.target.id === "swapFromAmount") {
    const fromToken = document.getElementById("fromToken").value;
    const toToken = document.getElementById("toToken").value;
    const amount = parseFloat(e.target.value) || 0;

    const fromPrice = swapPrices[fromToken] || 1;
    const toPrice = swapPrices[toToken] || 1;

    const usdValue = amount * fromPrice;
    const toAmount = usdValue / toPrice;

    document.getElementById("swapToAmount").value = toAmount.toFixed(6);
  }
});

// Token selector change
document.addEventListener("change", function (e) {
  if (e.target.id === "fromToken" || e.target.id === "toToken") {
    updateSwapRates();
  }
});

// Execute swap
async function executeSwap() {
  const fromToken = document.getElementById("fromToken").value;
  const toToken = document.getElementById("toToken").value;
  const amount = parseFloat(document.getElementById("swapFromAmount").value);

  if (!amount || amount <= 0) {
    alert("Please enter an amount");
    return;
  }

  if (fromToken === toToken) {
    alert("Please select different tokens");
    return;
  }

  // For real implementation, this would use 1inch API or similar
  // For now, simulate the swap
  alert(
    `Swap ${amount} ${fromToken} to ${toToken} - This would use 1inch aggregator API in production`,
  );
}
