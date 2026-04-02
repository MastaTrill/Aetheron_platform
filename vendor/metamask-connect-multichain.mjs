/* Browser ES build */
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/domain/errors/base.ts
var BaseErr;
var init_base = __esm({
  "src/domain/errors/base.ts"() {
    "use strict";
    BaseErr = class extends Error {
      constructor(message, code) {
        super(message);
        this.message = message;
        this.code = code;
      }
    };
  }
});

// src/domain/errors/rpc.ts
var _RPCHttpErr, RPCHttpErr, _RPCReadonlyResponseErr, RPCReadonlyResponseErr, _RPCReadonlyRequestErr, RPCReadonlyRequestErr, _RPCInvokeMethodErr, RPCInvokeMethodErr;
var init_rpc = __esm({
  "src/domain/errors/rpc.ts"() {
    "use strict";
    init_base();
    _RPCHttpErr = class _RPCHttpErr extends BaseErr {
      constructor(rpcEndpoint, method, httpStatus) {
        super(
          `RPCErr${_RPCHttpErr.code}: ${httpStatus} on ${rpcEndpoint} for method ${method}`,
          _RPCHttpErr.code
        );
        this.rpcEndpoint = rpcEndpoint;
        this.method = method;
        this.httpStatus = httpStatus;
      }
    };
    _RPCHttpErr.code = 50;
    RPCHttpErr = _RPCHttpErr;
    _RPCReadonlyResponseErr = class _RPCReadonlyResponseErr extends BaseErr {
      constructor(reason) {
        super(
          `RPCErr${_RPCReadonlyResponseErr.code}: RPC Client response reason ${reason}`,
          _RPCReadonlyResponseErr.code
        );
        this.reason = reason;
      }
    };
    _RPCReadonlyResponseErr.code = 51;
    RPCReadonlyResponseErr = _RPCReadonlyResponseErr;
    _RPCReadonlyRequestErr = class _RPCReadonlyRequestErr extends BaseErr {
      constructor(reason) {
        super(
          `RPCErr${_RPCReadonlyRequestErr.code}: RPC Client fetch reason ${reason}`,
          _RPCReadonlyRequestErr.code
        );
        this.reason = reason;
      }
    };
    _RPCReadonlyRequestErr.code = 52;
    RPCReadonlyRequestErr = _RPCReadonlyRequestErr;
    _RPCInvokeMethodErr = class _RPCInvokeMethodErr extends BaseErr {
      constructor(reason, rpcCode, rpcMessage) {
        super(
          `RPCErr${_RPCInvokeMethodErr.code}: RPC Client invoke method reason (${reason})`,
          _RPCInvokeMethodErr.code
        );
        this.reason = reason;
        this.rpcCode = rpcCode;
        this.rpcMessage = rpcMessage;
      }
    };
    _RPCInvokeMethodErr.code = 53;
    RPCInvokeMethodErr = _RPCInvokeMethodErr;
  }
});

// src/domain/errors/index.ts
var init_errors = __esm({
  "src/domain/errors/index.ts"() {
    "use strict";
    init_rpc();
  }
});

// src/domain/events/index.ts
import { EventEmitter as EventEmitter3 } from "eventemitter3";
var _emitter, EventEmitter;
var init_events = __esm({
  "src/domain/events/index.ts"() {
    "use strict";
    EventEmitter = class {
      constructor() {
        __privateAdd(this, _emitter, new EventEmitter3());
      }
      /**
       * Emits an event with the specified name and arguments.
       *
       * @template TEventName - The name of the event to emit (must be a key of TEvents)
       * @param eventName - The name of the event to emit
       * @param eventArg - The arguments to pass to the event handlers
       */
      emit(eventName, ...eventArg) {
        __privateGet(this, _emitter).emit(eventName, ...eventArg);
      }
      /**
       * Registers an event handler for the specified event.
       *
       * @template TEventName - The name of the event to listen for (must be a key of TEvents)
       * @param eventName - The name of the event to listen for
       * @param handler - The function to call when the event is emitted
       * @returns Nothing
       */
      on(eventName, handler) {
        __privateGet(this, _emitter).on(eventName, handler);
        return () => {
          this.off(eventName, handler);
        };
      }
      /**
       * Removes a specific event handler for the specified event.
       *
       * @template TEventName - The name of the event to remove the handler from (must be a key of TEvents)
       * @param eventName - The name of the event to remove the handler from
       * @param handler - The specific handler function to remove
       */
      off(eventName, handler) {
        __privateGet(this, _emitter).off(eventName, handler);
      }
      /**
       * Removes a specific event handler for the specified event.
       * Added for compatibility as some libraries use this method name.
       *
       * @template TEventName - The name of the event to remove the handler from (must be a key of TEvents)
       * @param eventName - The name of the event to remove the handler from
       * @param handler - The specific handler function to remove
       */
      removeListener(eventName, handler) {
        __privateGet(this, _emitter).off(eventName, handler);
      }
      /**
       * Registers an event handler for the specified event that will only be called once.
       *
       * @template TEventName - The name of the event to listen for (must be a key of TEvents)
       * @param eventName - The name of the event to listen for
       * @param handler - The function to call when the event is emitted (only once)
       * @returns A function to remove the listener
       */
      once(eventName, handler) {
        __privateGet(this, _emitter).once(eventName, handler);
        return () => {
          this.off(eventName, handler);
        };
      }
      /**
       * Returns the number of listeners registered for the specified event.
       *
       * @template TEventName - The name of the event to count listeners for (must be a key of TEvents)
       * @param eventName - The name of the event to count listeners for
       * @returns The number of listeners registered for the event
       */
      listenerCount(eventName) {
        return __privateGet(this, _emitter).listenerCount(eventName);
      }
    };
    _emitter = new WeakMap();
  }
});

// src/domain/logger/index.ts
import debug from "debug";
function isNamespaceEnabled(debugValue, namespace) {
  return debugValue.includes(namespace) || debugValue.includes("metamask-sdk:*") || debugValue.includes("*");
}
var createLogger, enableDebug, isEnabled;
var init_logger = __esm({
  "src/domain/logger/index.ts"() {
    "use strict";
    createLogger = (namespace = "metamask-sdk", color = "214") => {
      const logger4 = debug(namespace);
      logger4.color = color;
      return logger4;
    };
    enableDebug = (namespace = "metamask-sdk") => {
      debug.enable(namespace);
    };
    isEnabled = (namespace, storage) => __async(null, null, function* () {
      var _a3;
      if ("process" in globalThis && ((_a3 = process == null ? void 0 : process.env) == null ? void 0 : _a3.DEBUG)) {
        const { DEBUG } = process.env;
        return isNamespaceEnabled(DEBUG, namespace);
      }
      const storageDebug = yield storage.getDebug();
      if (storageDebug) {
        return isNamespaceEnabled(storageDebug, namespace);
      }
      return false;
    });
  }
});

// src/domain/multichain/api/constants.ts
var infuraRpcUrls, RPC_HANDLED_METHODS, SDK_HANDLED_METHODS;
var init_constants = __esm({
  "src/domain/multichain/api/constants.ts"() {
    "use strict";
    infuraRpcUrls = {
      // ###### Ethereum ######
      // Mainnet
      "eip155:1": "https://mainnet.infura.io/v3/",
      // Sepolia 11155111
      "eip155:11155111": "https://sepolia.infura.io/v3/",
      // Hoodi
      "eip155:560048": "https://hoodi.infura.io/v3/",
      // ###### Linea ######
      // Mainnet Alpha
      "eip155:59144": "https://linea-mainnet.infura.io/v3/",
      // Sepolia
      "eip155:59141": "https://linea-sepolia.infura.io/v3/",
      // ###### Polygon ######
      // Mainnet
      "eip155:137": "https://polygon-mainnet.infura.io/v3/",
      // Amoy
      "eip155:80002": "https://polygon-amoy.infura.io/v3/",
      // ###### Optimism ######
      // Mainnet
      "eip155:10": "https://optimism-mainnet.infura.io/v3/",
      // Sepolia
      "eip155:11155420": "https://optimism-sepolia.infura.io/v3/",
      // ###### Arbitrum ######
      // Mainnet
      "eip155:42161": "https://arbitrum-mainnet.infura.io/v3/",
      // Sepolia
      "eip155:421614": "https://arbitrum-sepolia.infura.io/v3/",
      // ###### Base ######
      // Mainnet
      "eip155:8453": "https://base-mainnet.infura.io/v3/",
      // Sepolia
      "eip155:84532": "https://base-sepolia.infura.io/v3/",
      // ###### Blast ######
      // Mainnet
      "eip155:81457": "https://blast-mainnet.infura.io/v3/",
      // Sepolia
      "eip155:168587773": "https://blast-sepolia.infura.io/v3/",
      // ###### zkSync ######
      // Mainnet
      "eip155:324": "https://zksync-mainnet.infura.io/v3/",
      // Sepolia
      "eip155:300": "https://zksync-sepolia.infura.io/v3/",
      // ###### BSC ######
      // Mainnet
      "eip155:56": "https://bsc-mainnet.infura.io/v3/",
      // Testnet
      "eip155:97": "https://bsc-testnet.infura.io/v3/",
      // ###### opBNB ######
      // Mainnet
      "eip155:204": "https://opbnb-mainnet.infura.io/v3/",
      // Testnet
      "eip155:5611": "https://opbnb-testnet.infura.io/v3/",
      // ###### Scroll ######
      // Mainnet
      "eip155:534352": "https://scroll-mainnet.infura.io/v3/",
      // Sepolia
      "eip155:534351": "https://scroll-sepolia.infura.io/v3/",
      // ###### Mantle ######
      // Mainnet
      "eip155:5000": "https://mantle-mainnet.infura.io/v3/",
      // Sepolia
      "eip155:5003": "https://mantle-sepolia.infura.io/v3/",
      // ###### Sei ######
      // Mainnet
      "eip155:1329": "https://sei-mainnet.infura.io/v3/",
      // Testnet
      "eip155:713715": "https://sei-testnet.infura.io/v3/",
      // ###### Swellchain ######
      // Mainnet
      "eip155:1923": "https://swellchain-mainnet.infura.io/v3/",
      // Testnet
      "eip155:1924": "https://swellchain-testnet.infura.io/v3/",
      // ###### Unichain ######
      // Mainnet
      "eip155:130": "https://unichain-mainnet.infura.io/v3/",
      // Sepolia
      "eip155:1301": "https://unichain-sepolia.infura.io/v3/",
      // ###### Hemi ######
      // Mainnet
      "eip155:43111": "https://hemi-mainnet.infura.io/v3/",
      // Testnet
      "eip155:743111": "https://hemi-testnet.infura.io/v3/",
      // ###### MegaETH ######
      // Mainnet
      "eip155:6342": "https://megaeth-mainnet.infura.io/v3/",
      // Testnet
      "eip155:6342001": "https://megaeth-testnet.infura.io/v3/",
      // ###### Monad ######
      // Mainnet
      "eip155:143": "https://monad-mainnet.infura.io/v3/",
      // Testnet
      "eip155:10143": "https://monad-testnet.infura.io/v3/",
      // ###### Palm ######
      // Mainnet
      "eip155:11297108109": "https://palm-mainnet.infura.io/v3/",
      // ###### Avalanche C-Chain ######
      // Mainnet
      "eip155:43114": "https://avalanche-mainnet.infura.io/v3/",
      // Fuji
      "eip155:43113": "https://avalanche-fuji.infura.io/v3/",
      // // ###### NEAR ######
      // // Mainnet
      // 'near:mainnet': `https://near-mainnet.infura.io/v3/`,
      // // Testnet
      // 'near:testnet': `https://near-testnet.infura.io/v3/`,
      // ###### StarkNet ######
      // Mainnet
      //
      // 'starknet:SN_MAIN': `https://starknet-mainnet.infura.io/v3/`,
      // // Goerli
      // 'starknet:SN_GOERLI': `https://starknet-goerli.infura.io/v3/`,
      // // Goerli 2
      // 'starknet:SN_GOERLI2': `https://starknet-goerli2.infura.io/v3/`,
      // ###### Celo ######
      // Mainnet
      "eip155:42220": "https://celo-mainnet.infura.io/v3/",
      // Sepolia
      "eip155:44787": "https://celo-sepolia.infura.io/v3/",
      // ###### Solana ######
      // Mainnet
      "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp": "https://solana-mainnet.infura.io/v3/",
      // Devnet
      "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1": "https://solana-devnet.infura.io/v3/"
    };
    RPC_HANDLED_METHODS = /* @__PURE__ */ new Set([
      "eth_blockNumber",
      "eth_gasPrice",
      "eth_maxPriorityFeePerGas",
      "eth_blobBaseFee",
      "eth_feeHistory",
      "eth_getBalance",
      "eth_getCode",
      "eth_getStorageAt",
      "eth_call",
      "eth_estimateGas",
      "eth_getLogs",
      "eth_getProof",
      "eth_getTransactionCount",
      "eth_getBlockByNumber",
      "eth_getBlockByHash",
      "eth_getBlockTransactionCountByNumber",
      "eth_getBlockTransactionCountByHash",
      "eth_getUncleCountByBlockNumber",
      "eth_getUncleCountByBlockHash",
      "eth_getTransactionByHash",
      "eth_getTransactionByBlockNumberAndIndex",
      "eth_getTransactionByBlockHashAndIndex",
      "eth_getTransactionReceipt",
      "eth_getUncleByBlockNumberAndIndex",
      "eth_getUncleByBlockHashAndIndex",
      "eth_getFilterChanges",
      "eth_getFilterLogs",
      "eth_newBlockFilter",
      "eth_newFilter",
      "eth_newPendingTransactionFilter",
      "eth_sendRawTransaction",
      "eth_syncing",
      "eth_uninstallFilter"
    ]);
    SDK_HANDLED_METHODS = /* @__PURE__ */ new Set(["eth_accounts", "eth_chainId"]);
  }
});

// src/domain/multichain/api/infura.ts
function getInfuraRpcUrls({
  infuraApiKey,
  caipChainIds
}) {
  const keys = caipChainIds && caipChainIds.length > 0 ? caipChainIds : Object.keys(infuraRpcUrls);
  return keys.reduce((acc, key) => {
    const baseUrl = infuraRpcUrls[key];
    if (baseUrl) {
      acc[key] = `${baseUrl}${infuraApiKey}`;
    }
    return acc;
  }, {});
}
var init_infura = __esm({
  "src/domain/multichain/api/infura.ts"() {
    "use strict";
    init_constants();
  }
});

// src/domain/multichain/index.ts
function getTransportType(type) {
  switch (type) {
    case "browser":
      return "browser" /* Browser */;
    case "mwp":
      return "mwp" /* MWP */;
    default:
      return "unknown" /* UNKNOWN */;
  }
}
var TransportType, MultichainCore;
var init_multichain = __esm({
  "src/domain/multichain/index.ts"() {
    "use strict";
    init_events();
    init_constants();
    init_infura();
    TransportType = /* @__PURE__ */ ((TransportType2) => {
      TransportType2["Browser"] = "browser";
      TransportType2["MWP"] = "mwp";
      TransportType2["UNKNOWN"] = "unknown";
      return TransportType2;
    })(TransportType || {});
    MultichainCore = class extends EventEmitter {
      constructor(options) {
        super();
        this.options = options;
      }
      /**
       * Merges the given options into the current instance options.
       * Only the mergeable keys are updated (api.supportedNetworks, versions, ui.*, mobile.*, transport.extensionId, debug).
       * The main thing to note is that the value for `dapp` is not merged as it does not make sense for
       * subsequent calls to `createMultichainClient` to have a different `dapp` value.
       * Used when createMultichainClient is called with an existing singleton.
       *
       * @param partial - Options to merge/overwrite onto the current instance
       */
      mergeOptions(partial) {
        var _a3, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o;
        const opts = this.options;
        this.options = __spreadProps(__spreadValues({}, opts), {
          api: __spreadProps(__spreadValues({}, opts.api), {
            supportedNetworks: __spreadValues(__spreadValues({}, opts.api.supportedNetworks), (_b = (_a3 = partial.api) == null ? void 0 : _a3.supportedNetworks) != null ? _b : {})
          }),
          versions: __spreadValues(__spreadValues({}, opts.versions), (_c = partial.versions) != null ? _c : {}),
          ui: __spreadProps(__spreadValues({}, opts.ui), {
            headless: (_e = (_d = partial.ui) == null ? void 0 : _d.headless) != null ? _e : opts.ui.headless,
            preferExtension: (_g = (_f = partial.ui) == null ? void 0 : _f.preferExtension) != null ? _g : opts.ui.preferExtension,
            showInstallModal: (_i = (_h = partial.ui) == null ? void 0 : _h.showInstallModal) != null ? _i : opts.ui.showInstallModal
          }),
          mobile: __spreadValues(__spreadValues({}, opts.mobile), (_j = partial.mobile) != null ? _j : {}),
          transport: __spreadProps(__spreadValues({}, (_k = opts.transport) != null ? _k : {}), {
            extensionId: (_n = (_l = partial.transport) == null ? void 0 : _l.extensionId) != null ? _n : (_m = opts.transport) == null ? void 0 : _m.extensionId
          }),
          debug: (_o = partial.debug) != null ? _o : opts.debug
        });
      }
    };
  }
});

// src/domain/platform/index.ts
import Bowser from "bowser";
function isNotBrowser() {
  var _a3;
  if (typeof window === "undefined") {
    return true;
  }
  if (!(window == null ? void 0 : window.navigator)) {
    return true;
  }
  if (typeof global !== "undefined" && ((_a3 = global == null ? void 0 : global.navigator) == null ? void 0 : _a3.product) === "ReactNative") {
    return true;
  }
  return (navigator == null ? void 0 : navigator.product) === "ReactNative";
}
function isReactNative() {
  var _a3;
  const hasWindowNavigator = typeof window !== "undefined" && window.navigator !== void 0;
  const nav = hasWindowNavigator ? window.navigator : void 0;
  if (!nav) {
    return false;
  }
  return hasWindowNavigator && ((_a3 = window.navigator) == null ? void 0 : _a3.product) === "ReactNative";
}
function isMetaMaskMobileWebView() {
  return typeof window !== "undefined" && // @ts-expect-error ReactNativeWebView should be defined
  Boolean(window.ReactNativeWebView) && Boolean(window.navigator.userAgent.endsWith("MetaMaskMobile"));
}
function isMobile() {
  var _a3, _b;
  const browser = Bowser.parse(window.navigator.userAgent);
  return ((_a3 = browser == null ? void 0 : browser.platform) == null ? void 0 : _a3.type) === "mobile" || ((_b = browser == null ? void 0 : browser.platform) == null ? void 0 : _b.type) === "tablet";
}
function getPlatformType() {
  if (isReactNative()) {
    return "react-native" /* ReactNative */;
  }
  if (isNotBrowser()) {
    return "nodejs" /* NonBrowser */;
  }
  if (isMetaMaskMobileWebView()) {
    return "in-app-browser" /* MetaMaskMobileWebview */;
  }
  if (isMobile()) {
    return "web-mobile" /* MobileWeb */;
  }
  return "web-desktop" /* DesktopWeb */;
}
function isMetamaskExtensionInstalled() {
  var _a3;
  if (typeof window === "undefined") {
    return false;
  }
  return Boolean((_a3 = window.ethereum) == null ? void 0 : _a3.isMetaMask);
}
function isSecure() {
  const platformType = getPlatformType();
  return isReactNative() || platformType === "web-mobile" /* MobileWeb */;
}
function hasExtension() {
  return __async(this, null, function* () {
    return detectionPromise;
  });
}
var PlatformType, detectionPromise;
var init_platform = __esm({
  "src/domain/platform/index.ts"() {
    "use strict";
    PlatformType = /* @__PURE__ */ ((PlatformType2) => {
      PlatformType2["NonBrowser"] = "nodejs";
      PlatformType2["MetaMaskMobileWebview"] = "in-app-browser";
      PlatformType2["DesktopWeb"] = "web-desktop";
      PlatformType2["MobileWeb"] = "web-mobile";
      PlatformType2["ReactNative"] = "react-native";
      return PlatformType2;
    })(PlatformType || {});
    detectionPromise = (() => __async(null, null, function* () {
      const pt = getPlatformType();
      if (pt === "nodejs" /* NonBrowser */ || pt === "react-native" /* ReactNative */) {
        return Promise.resolve(false);
      }
      return new Promise((resolve) => {
        const providers = [];
        const handler = (event) => {
          var _a3, _b;
          if ((_b = (_a3 = event == null ? void 0 : event.detail) == null ? void 0 : _a3.info) == null ? void 0 : _b.rdns) {
            providers.push(event.detail);
          }
        };
        window.addEventListener("eip6963:announceProvider", handler);
        window.dispatchEvent(new Event("eip6963:requestProvider"));
        setTimeout(() => {
          window.removeEventListener("eip6963:announceProvider", handler);
          const hasMetaMask = providers.some(
            (provider) => {
              var _a3, _b;
              return (_b = (_a3 = provider == null ? void 0 : provider.info) == null ? void 0 : _a3.rdns) == null ? void 0 : _b.startsWith("io.metamask");
            }
          );
          resolve(hasMetaMask);
        }, 300);
      });
    }))();
  }
});

// src/domain/store/adapter.ts
var StoreAdapter;
var init_adapter = __esm({
  "src/domain/store/adapter.ts"() {
    "use strict";
    StoreAdapter = class {
      constructor(options) {
        this.options = options;
      }
    };
  }
});

// src/domain/store/client.ts
var StoreClient;
var init_client = __esm({
  "src/domain/store/client.ts"() {
    "use strict";
    StoreClient = class {
    };
  }
});

// src/domain/store/index.ts
var init_store = __esm({
  "src/domain/store/index.ts"() {
    "use strict";
    init_adapter();
    init_client();
  }
});

// src/domain/ui/types.ts
var Modal;
var init_types = __esm({
  "src/domain/ui/types.ts"() {
    "use strict";
    Modal = class {
      // eslint-disable-next-line @typescript-eslint/parameter-properties
      constructor(options) {
        this.options = options;
      }
      get isMounted() {
        return this.instance !== void 0;
      }
      get data() {
        if (typeof this.options === "object" && this.options && "link" in this.options) {
          return this.options.link;
        }
        if (typeof this.options === "object" && this.options && "otpCode" in this.options) {
          return this.options.otpCode;
        }
        throw new Error("Invalid options");
      }
      set data(data) {
        if (typeof this.options === "object" && this.options && "link" in this.options) {
          this.options.link = data;
        }
        if (typeof this.options === "object" && this.options && "otpCode" in this.options) {
          this.options.otpCode = data;
        }
      }
    };
  }
});

// src/domain/ui/index.ts
var init_ui = __esm({
  "src/domain/ui/index.ts"() {
    "use strict";
    init_types();
  }
});

// src/multichain/utils/analytics.ts
function isRejectionError(error) {
  var _a3, _b;
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const errorObj = error;
  const errorCode = errorObj.code;
  const errorMessage = (_b = (_a3 = errorObj.message) == null ? void 0 : _a3.toLowerCase()) != null ? _b : "";
  return errorCode === 4001 || // User rejected request (common EIP-1193 code)
  errorCode === 4100 || // Unauthorized (common rejection code)
  errorMessage.includes("reject") || errorMessage.includes("denied") || errorMessage.includes("cancel") || errorMessage.includes("user");
}
function getBaseAnalyticsProperties(options, storage) {
  return __async(this, null, function* () {
    var _a3;
    const dappId = getDappId(options.dapp);
    const platform = getPlatformType();
    const anonId = yield storage.getAnonId();
    return {
      mmconnect_versions: (_a3 = options.versions) != null ? _a3 : {},
      dapp_id: dappId,
      platform,
      anon_id: anonId
    };
  });
}
function getWalletActionAnalyticsProperties(options, storage, invokeOptions, transportType) {
  return __async(this, null, function* () {
    var _a3;
    const dappId = getDappId(options.dapp);
    const anonId = yield storage.getAnonId();
    return {
      mmconnect_versions: (_a3 = options.versions) != null ? _a3 : {},
      dapp_id: dappId,
      method: invokeOptions.request.method,
      caip_chain_id: invokeOptions.scope,
      anon_id: anonId,
      transport_type: transportType
    };
  });
}
var init_analytics = __esm({
  "src/multichain/utils/analytics.ts"() {
    "use strict";
    init_utils2();
    init_domain();
  }
});

// src/domain/utils/index.ts
function getVersion() {
  return "0.0.0";
}
var init_utils = __esm({
  "src/domain/utils/index.ts"() {
    "use strict";
    init_analytics();
  }
});

// src/domain/index.ts
var init_domain = __esm({
  "src/domain/index.ts"() {
    "use strict";
    init_errors();
    init_events();
    init_logger();
    init_multichain();
    init_platform();
    init_store();
    init_ui();
    init_utils();
  }
});

// src/multichain/utils/index.ts
import {
  parseCaipAccountId,
  parseCaipChainId
} from "@metamask/utils";
import { deflate } from "pako";
function getGlobalObject() {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  throw new Error("Unable to locate global object");
}
function base64Encode(str) {
  if (typeof btoa !== "undefined") {
    return btoa(str);
  } else if (typeof Buffer !== "undefined") {
    return Buffer.from(str).toString("base64");
  }
  throw new Error("No base64 encoding method available");
}
function compressString(str) {
  const compressed = deflate(str);
  const binaryString = String.fromCharCode.apply(null, Array.from(compressed));
  return base64Encode(binaryString);
}
function getDappId(dapp) {
  var _a3;
  return (_a3 = dapp.url) != null ? _a3 : dapp.name;
}
function openDeeplink(options, deeplink, universalLink) {
  var _a3;
  const { mobile } = options;
  const useDeeplink = (_a3 = mobile == null ? void 0 : mobile.useDeeplink) != null ? _a3 : true;
  if (useDeeplink) {
    if (typeof window !== "undefined") {
      window.location.href = deeplink;
    }
  } else if (typeof document !== "undefined") {
    const link = document.createElement("a");
    link.href = universalLink;
    link.target = "_self";
    link.rel = "noreferrer noopener";
    link.click();
  }
}
function mergeRequestedSessionWithExisting(sessionData, scopes, caipAccountIds, sessionProperties) {
  const existingCaipChainIds = Object.keys(sessionData.sessionScopes);
  const existingCaipAccountIds = [];
  Object.values(sessionData.sessionScopes).forEach((scopeObject) => {
    if ((scopeObject == null ? void 0 : scopeObject.accounts) && Array.isArray(scopeObject.accounts)) {
      scopeObject.accounts.forEach((account) => {
        existingCaipAccountIds.push(account);
      });
    }
  });
  const mergedScopes = Array.from(
    /* @__PURE__ */ new Set([...existingCaipChainIds, ...scopes])
  );
  const mergedCaipAccountIds = Array.from(
    /* @__PURE__ */ new Set([...existingCaipAccountIds, ...caipAccountIds])
  );
  const mergedSessionProperties = __spreadValues(__spreadValues({}, sessionData.sessionProperties), sessionProperties);
  return {
    mergedScopes,
    mergedCaipAccountIds,
    mergedSessionProperties
  };
}
function getOptionalScopes(scopes) {
  return scopes.reduce(
    (prev, scope) => __spreadProps(__spreadValues({}, prev), {
      [scope]: {
        methods: [],
        notifications: [],
        accounts: []
      }
    }),
    {}
  );
}
function normalizeNativeUrl(url) {
  var _a3;
  const httpPattern = /^https?:\/\//u;
  if (httpPattern.test(url)) {
    return void 0;
  }
  const schemeMatch = url.match(/^([^:]*):\/\//u);
  const rawScheme = (_a3 = schemeMatch == null ? void 0 : schemeMatch[1]) != null ? _a3 : url;
  const sanitized = rawScheme.toLowerCase().replace(/[^a-z0-9-]/gu, "-").replace(/^-+|-+$/gu, "");
  const subdomain = (sanitized || "unknown").slice(0, 63).replace(/-+$/u, "");
  return {
    url: `https://${subdomain}.rn.dapp.local`,
    nativeScheme: url
  };
}
function setupDappMetadata(options) {
  var _a3, _b;
  const platform = getPlatformType();
  const isBrowser = platform === "web-desktop" /* DesktopWeb */ || platform === "web-mobile" /* MobileWeb */ || platform === "in-app-browser" /* MetaMaskMobileWebview */;
  if (!((_a3 = options.dapp) == null ? void 0 : _a3.name)) {
    throw new Error("You must provide dapp name");
  }
  if (isBrowser) {
    options.dapp = __spreadProps(__spreadValues({}, options.dapp), {
      url: `${window.location.protocol}//${window.location.host}`
    });
  }
  if (!((_b = options.dapp) == null ? void 0 : _b.url)) {
    throw new Error("You must provide dapp url");
  }
  if (platform === "react-native" /* ReactNative */ && options.dapp.url) {
    const normalized = normalizeNativeUrl(options.dapp.url);
    if (normalized) {
      console.info(
        `Normalizing dapp URL for React Native: "${options.dapp.url}" -> "${normalized.url}"`
      );
      options.dapp = __spreadProps(__spreadValues({}, options.dapp), {
        url: normalized.url,
        nativeScheme: normalized.nativeScheme
      });
    }
  }
  const BASE_64_ICON_MAX_LENGTH = 163400;
  const urlPattern = /^(http|https):\/\/[^\s]*$/u;
  if (options.dapp) {
    if ("iconUrl" in options.dapp) {
      if (options.dapp.iconUrl && !urlPattern.test(options.dapp.iconUrl)) {
        console.warn(
          "Invalid dappMetadata.iconUrl: URL must start with http:// or https://"
        );
        options.dapp.iconUrl = void 0;
      }
    }
    if ("base64Icon" in options.dapp) {
      if (options.dapp.base64Icon && options.dapp.base64Icon.length > BASE_64_ICON_MAX_LENGTH) {
        console.warn(
          "Invalid dappMetadata.base64Icon: Base64-encoded icon string length must be less than 163400 characters"
        );
        options.dapp.base64Icon = void 0;
      }
    }
    if (options.dapp.url && !urlPattern.test(options.dapp.url)) {
      console.warn(
        "Invalid dappMetadata.url: URL must start with http:// or https://"
      );
    }
    const favicon = extractFavicon();
    if (favicon && !("iconUrl" in options.dapp) && !("base64Icon" in options.dapp)) {
      const faviconUrl = `${window.location.protocol}//${window.location.host}${favicon}`;
      options.dapp.iconUrl = faviconUrl;
    }
  }
  return options;
}
function isSameScopesAndAccounts(currentScopes, proposedScopes, walletSession, proposedCaipAccountIds) {
  const isSameScopes = currentScopes.every((scope) => proposedScopes.includes(scope)) && proposedScopes.every((scope) => currentScopes.includes(scope));
  if (!isSameScopes) {
    return false;
  }
  const existingAccountIds = Object.values(
    walletSession.sessionScopes
  ).filter(({ accounts }) => Boolean(accounts)).flatMap(({ accounts }) => accounts != null ? accounts : []);
  const allProposedAccountsIncluded = proposedCaipAccountIds.every(
    (proposedAccountId) => existingAccountIds.includes(proposedAccountId)
  );
  return allProposedAccountsIncluded;
}
function getValidAccounts(caipAccountIds) {
  return caipAccountIds.reduce(
    (caipAccounts, caipAccountId) => {
      try {
        return [...caipAccounts, parseCaipAccountId(caipAccountId)];
      } catch (error) {
        const stringifiedAccountId = JSON.stringify(caipAccountId);
        console.error(
          `Invalid CAIP account ID: ${stringifiedAccountId}`,
          error
        );
        return caipAccounts;
      }
    },
    []
  );
}
function addValidAccounts(optionalScopes, validAccounts) {
  var _a3;
  if (!optionalScopes || !(validAccounts == null ? void 0 : validAccounts.length)) {
    return optionalScopes;
  }
  const result = Object.fromEntries(
    Object.entries(optionalScopes).map(([scope, scopeData]) => {
      var _a4, _b, _c;
      return [
        scope,
        {
          methods: [...(_a4 = scopeData == null ? void 0 : scopeData.methods) != null ? _a4 : []],
          notifications: [...(_b = scopeData == null ? void 0 : scopeData.notifications) != null ? _b : []],
          accounts: [...(_c = scopeData == null ? void 0 : scopeData.accounts) != null ? _c : []]
        }
      ];
    })
  );
  const accountsByChain = /* @__PURE__ */ new Map();
  for (const account of validAccounts) {
    const chainKey = `${account.chain.namespace}:${account.chain.reference}`;
    const accountId = `${account.chainId}:${account.address}`;
    if (!accountsByChain.has(chainKey)) {
      accountsByChain.set(chainKey, []);
    }
    (_a3 = accountsByChain.get(chainKey)) == null ? void 0 : _a3.push(accountId);
  }
  for (const [scopeKey, scopeData] of Object.entries(result)) {
    if (!(scopeData == null ? void 0 : scopeData.accounts)) {
      continue;
    }
    try {
      const scope = scopeKey;
      const scopeDetails = parseCaipChainId(scope);
      const chainKey = `${scopeDetails.namespace}:${scopeDetails.reference}`;
      const matchingAccounts = accountsByChain.get(chainKey);
      if (matchingAccounts) {
        const existingAccounts = new Set(scopeData.accounts);
        const newAccounts = matchingAccounts.filter(
          (account) => !existingAccounts.has(account)
        );
        scopeData.accounts.push(...newAccounts);
      }
    } catch (error) {
      console.error(`Invalid scope format: ${scopeKey}`, error);
    }
  }
  return result;
}
var extractFavicon, MAX, idCounter, getUniqueRequestId;
var init_utils2 = __esm({
  "src/multichain/utils/index.ts"() {
    "use strict";
    init_domain();
    extractFavicon = () => {
      var _a3;
      if (typeof document === "undefined") {
        return void 0;
      }
      let favicon;
      const nodeList = document.getElementsByTagName("link");
      for (let i = 0; i < nodeList.length; i++) {
        if (nodeList[i].getAttribute("rel") === "icon" || nodeList[i].getAttribute("rel") === "shortcut icon") {
          favicon = (_a3 = nodeList[i].getAttribute("href")) != null ? _a3 : void 0;
        }
      }
      return favicon;
    };
    MAX = 4294967295;
    idCounter = Math.floor(Math.random() * MAX);
    getUniqueRequestId = () => {
      idCounter = (idCounter + 1) % MAX;
      return idCounter;
    };
  }
});

// src/ui/modals/base/utils.ts
function formatRemainingTime(milliseconds) {
  if (milliseconds <= 0) {
    return "EXPIRED";
  }
  const seconds = Math.floor(milliseconds / 1e3);
  return `${seconds}s`;
}
function shouldLogCountdown(remainingSeconds) {
  if (remainingSeconds <= 10) {
    return true;
  } else if (remainingSeconds <= 30) {
    return remainingSeconds % 5 === 0;
  } else if (remainingSeconds <= 60) {
    return remainingSeconds % 10 === 0;
  } else if (remainingSeconds <= 300) {
    return remainingSeconds % 30 === 0;
  }
  return remainingSeconds % 60 === 0;
}
var init_utils3 = __esm({
  "src/ui/modals/base/utils.ts"() {
    "use strict";
  }
});

// src/ui/modals/base/AbstractInstallModal.ts
var logger3, _expirationInterval, _lastLoggedCountdown, AbstractInstallModal;
var init_AbstractInstallModal = __esm({
  "src/ui/modals/base/AbstractInstallModal.ts"() {
    "use strict";
    init_utils3();
    init_domain();
    logger3 = createLogger("metamask-sdk:ui");
    AbstractInstallModal = class extends Modal {
      constructor() {
        super(...arguments);
        __privateAdd(this, _expirationInterval, null);
        __privateAdd(this, _lastLoggedCountdown, -1);
      }
      get link() {
        return this.data;
      }
      set link(link) {
        this.data = link;
      }
      get connectionRequest() {
        return this.options.connectionRequest;
      }
      set connectionRequest(connectionRequest) {
        this.options.connectionRequest = connectionRequest;
      }
      updateLink(link) {
        this.link = link;
        if (this.instance) {
          this.instance.link = link;
        }
      }
      updateExpiresIn(expiresIn) {
        if (expiresIn >= 0 && this.instance) {
          this.instance.expiresIn = expiresIn;
        }
      }
      startExpirationCheck(connectionRequest) {
        this.stopExpirationCheck();
        let currentConnectionRequest = connectionRequest;
        __privateSet(this, _expirationInterval, setInterval(() => __async(this, null, function* () {
          const { sessionRequest } = currentConnectionRequest;
          const now = Date.now();
          const remainingMs = sessionRequest.expiresAt - now;
          const remainingSeconds = Math.floor(remainingMs / 1e3);
          if (remainingMs > 0 && shouldLogCountdown(remainingSeconds) && __privateGet(this, _lastLoggedCountdown) !== remainingSeconds) {
            const formattedTime = formatRemainingTime(remainingMs);
            logger3(
              `[UI: InstallModal-nodejs()] QR code expires in: ${formattedTime} (${remainingSeconds}s)`
            );
            __privateSet(this, _lastLoggedCountdown, remainingSeconds);
          }
          if (now >= sessionRequest.expiresAt) {
            this.stopExpirationCheck();
            logger3(
              "[UI: InstallModal-nodejs()] \u23F0 QR code EXPIRED! Generating new one..."
            );
            try {
              currentConnectionRequest = yield this.options.createConnectionRequest();
              const generateQRCode = yield this.options.generateQRCode(
                currentConnectionRequest
              );
              __privateSet(this, _lastLoggedCountdown, -1);
              this.updateLink(generateQRCode);
              this.updateExpiresIn(remainingSeconds);
              this.renderQRCode(generateQRCode, currentConnectionRequest);
            } catch (error) {
              logger3(
                `[UI: InstallModal-nodejs()] \u274C Error generating new QR code: ${error}`
              );
            }
          }
        }), 1e3));
      }
      stopExpirationCheck() {
        if (__privateGet(this, _expirationInterval)) {
          clearInterval(__privateGet(this, _expirationInterval));
          __privateSet(this, _expirationInterval, null);
          logger3(
            "[UI: InstallModal-nodejs()] \u{1F6D1} Stopped QR code expiration checking"
          );
        }
      }
    };
    _expirationInterval = new WeakMap();
    _lastLoggedCountdown = new WeakMap();
  }
});

// src/ui/modals/web/install.ts
var InstallModal;
var init_install = __esm({
  "src/ui/modals/web/install.ts"() {
    "use strict";
    init_AbstractInstallModal();
    InstallModal = class extends AbstractInstallModal {
      renderQRCode() {
      }
      mount() {
        var _a3;
        const { options } = this;
        const modal = document.createElement(
          "mm-install-modal"
        );
        modal.showInstallModal = options.showInstallModal;
        modal.addEventListener("close", (ev) => {
          const { detail } = ev;
          options.onClose(detail == null ? void 0 : detail.shouldTerminate);
        });
        modal.addEventListener(
          "startDesktopOnboarding",
          options.startDesktopOnboarding
        );
        modal.link = options.link;
        this.instance = modal;
        (_a3 = options.parentElement) == null ? void 0 : _a3.appendChild(modal);
        this.startExpirationCheck(options.connectionRequest);
      }
      unmount() {
        var _a3;
        const { options, instance: modal } = this;
        this.stopExpirationCheck();
        if (modal && ((_a3 = options.parentElement) == null ? void 0 : _a3.contains(modal))) {
          options.parentElement.removeChild(modal);
          this.instance = void 0;
        }
      }
    };
  }
});

// src/ui/modals/base/AbstractOTPModal.ts
var AbstractOTPCodeModal;
var init_AbstractOTPModal = __esm({
  "src/ui/modals/base/AbstractOTPModal.ts"() {
    "use strict";
    init_domain();
    AbstractOTPCodeModal = class extends Modal {
      get otpCode() {
        return this.data;
      }
      set otpCode(code) {
        this.data = code;
      }
      updateOTPCode(code) {
        this.otpCode = code;
        if (this.instance) {
          this.instance.otpCode = code;
        }
      }
    };
  }
});

// src/ui/modals/web/otp.ts
var OTPCodeModal;
var init_otp = __esm({
  "src/ui/modals/web/otp.ts"() {
    "use strict";
    init_AbstractOTPModal();
    OTPCodeModal = class extends AbstractOTPCodeModal {
      mount() {
      }
      unmount() {
      }
    };
  }
});

// src/ui/modals/web/index.ts
var web_exports = {};
__export(web_exports, {
  InstallModal: () => InstallModal,
  OTPCodeModal: () => OTPCodeModal
});
var init_web = __esm({
  "src/ui/modals/web/index.ts"() {
    "use strict";
    init_install();
    init_otp();
  }
});

// src/store/adapters/web.ts
var web_exports2 = {};
__export(web_exports2, {
  StoreAdapterWeb: () => StoreAdapterWeb
});
var _StoreAdapterWeb, StoreAdapterWeb;
var init_web2 = __esm({
  "src/store/adapters/web.ts"() {
    "use strict";
    init_domain();
    _StoreAdapterWeb = class _StoreAdapterWeb extends StoreAdapter {
      constructor(dbNameSuffix = "-kv-store", storeName = _StoreAdapterWeb.stores[0]) {
        super();
        this.storeName = storeName;
        this.platform = "web";
        const dbName = `${_StoreAdapterWeb.DB_NAME}${dbNameSuffix}`;
        this.dbPromise = new Promise((resolve, reject) => {
          try {
            const request = this.internal.open(dbName, 1);
            request.onerror = () => reject(new Error("Failed to open IndexedDB."));
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = () => {
              const db = request.result;
              for (const name of _StoreAdapterWeb.stores) {
                if (!db.objectStoreNames.contains(name)) {
                  db.createObjectStore(name);
                }
              }
            };
          } catch (error) {
            reject(error);
          }
        });
      }
      get internal() {
        if (typeof window === "undefined" || !window.indexedDB) {
          throw new Error("indexedDB is not available in this environment");
        }
        return window.indexedDB;
      }
      get(key) {
        return __async(this, null, function* () {
          const { storeName } = this;
          const db = yield this.dbPromise;
          return new Promise((resolve, reject) => {
            try {
              const tx = db.transaction(storeName, "readonly");
              const store = tx.objectStore(storeName);
              const request = store.get(key);
              request.onerror = () => reject(new Error("Failed to get value from IndexedDB."));
              request.onsuccess = () => {
                var _a3;
                return resolve((_a3 = request.result) != null ? _a3 : null);
              };
            } catch (error) {
              reject(error);
            }
          });
        });
      }
      set(key, value) {
        return __async(this, null, function* () {
          const { storeName } = this;
          const db = yield this.dbPromise;
          return new Promise((resolve, reject) => {
            try {
              const tx = db.transaction(storeName, "readwrite");
              const store = tx.objectStore(storeName);
              const request = store.put(value, key);
              request.onerror = () => reject(new Error("Failed to set value in IndexedDB."));
              request.onsuccess = () => resolve();
            } catch (error) {
              reject(error);
            }
          });
        });
      }
      delete(key) {
        return __async(this, null, function* () {
          const { storeName } = this;
          const db = yield this.dbPromise;
          return new Promise((resolve, reject) => {
            try {
              const tx = db.transaction(storeName, "readwrite");
              const store = tx.objectStore(storeName);
              const request = store.delete(key);
              request.onerror = () => reject(new Error("Failed to delete value from IndexedDB."));
              request.onsuccess = () => resolve();
            } catch (error) {
              reject(error);
            }
          });
        });
      }
    };
    _StoreAdapterWeb.stores = ["sdk-kv-store", "key-value-pairs"];
    _StoreAdapterWeb.DB_NAME = "mmconnect";
    StoreAdapterWeb = _StoreAdapterWeb;
  }
});

// src/polyfills/buffer-shim.ts
init_utils2();
import { Buffer as Buffer2 } from "buffer";
var globalObj = getGlobalObject();
var _a;
(_a = globalObj.Buffer) != null ? _a : globalObj.Buffer = Buffer2;

// src/index.browser.ts
init_domain();

// src/multichain/index.ts
import { analytics as analytics2 } from "@metamask/analytics";
import {
  ErrorCode,
  ProtocolError,
  SessionStore as SessionStore2,
  WebSocketTransport
} from "@metamask/mobile-wallet-protocol-core";
import { DappClient } from "@metamask/mobile-wallet-protocol-dapp-client";
import {
  getMultichainClient
} from "@metamask/multichain-api-client";

// src/config/index.ts
var MWP_RELAY_URL = "wss://mm-sdk-relay.api.cx.metamask.io/connection/websocket";
var METAMASK_CONNECT_BASE_URL = "https://metamask.app.link/connect";
var METAMASK_DEEPLINK_BASE = "metamask://connect";

// src/multichain/index.ts
init_domain();
init_analytics();
init_logger();
init_multichain();
init_platform();

// src/multichain/rpc/handlers/rpcClient.ts
init_domain();
import fetch from "cross-fetch";
var rpcId = 1;
function getNextRpcId() {
  rpcId += 1;
  return rpcId;
}
var MissingRpcEndpointErr = class extends Error {
};
var RpcClient = class {
  constructor(config, sdkInfo) {
    this.config = config;
    this.sdkInfo = sdkInfo;
  }
  /**
   * Routes the request to a configured RPC node.
   *
   * @param options - The invoke method options.
   * @returns The JSON response from the RPC node.
   */
  request(options) {
    return __async(this, null, function* () {
      const { request } = options;
      const body = JSON.stringify({
        jsonrpc: "2.0",
        method: request.method,
        params: request.params,
        id: getNextRpcId()
      });
      const rpcEndpoint = this.getRpcEndpoint(options.scope);
      const rpcRequest = yield this.fetchWithTimeout(
        rpcEndpoint,
        body,
        "POST",
        this.getHeaders(rpcEndpoint),
        3e4
      );
      const response = yield this.parseResponse(rpcRequest);
      return response;
    });
  }
  getRpcEndpoint(scope) {
    var _a3, _b, _c;
    const supportedNetworks = (_c = (_b = (_a3 = this.config) == null ? void 0 : _a3.api) == null ? void 0 : _b.supportedNetworks) != null ? _c : {};
    const rpcEndpoint = supportedNetworks[scope];
    if (!rpcEndpoint) {
      throw new MissingRpcEndpointErr(
        `No RPC endpoint found for scope ${scope}`
      );
    }
    return rpcEndpoint;
  }
  fetchWithTimeout(endpoint, body, method, headers, timeout) {
    return __async(this, null, function* () {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      try {
        const response = yield fetch(endpoint, {
          method,
          headers,
          body,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
          throw new RPCHttpErr(endpoint, method, response.status);
        }
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof RPCHttpErr) {
          throw error;
        }
        if (error instanceof Error && error.name === "AbortError") {
          throw new RPCReadonlyRequestErr(`Request timeout after ${timeout}ms`);
        }
        throw new RPCReadonlyRequestErr(error.message);
      }
    });
  }
  parseResponse(response) {
    return __async(this, null, function* () {
      try {
        const rpcResponse = yield response.json();
        return rpcResponse.result;
      } catch (error) {
        throw new RPCReadonlyResponseErr(error.message);
      }
    });
  }
  getHeaders(rpcEndpoint) {
    const defaultHeaders = {
      Accept: "application/json",
      "Content-Type": "application/json"
    };
    if (rpcEndpoint.includes("infura")) {
      return __spreadProps(__spreadValues({}, defaultHeaders), {
        "Metamask-Sdk-Info": this.sdkInfo
      });
    }
    return defaultHeaders;
  }
};

// src/multichain/rpc/requestRouter.ts
import { analytics } from "@metamask/analytics";
init_domain();
init_utils2();
init_analytics();
var _RequestRouter_instances, withAnalyticsTracking_fn, trackWalletActionRequested_fn, trackWalletActionSucceeded_fn, trackWalletActionFailed_fn, trackWalletActionRejected_fn;
var RequestRouter = class {
  constructor(transport, rpcClient, config, transportType) {
    this.transport = transport;
    this.rpcClient = rpcClient;
    this.config = config;
    this.transportType = transportType;
    __privateAdd(this, _RequestRouter_instances);
  }
  /**
   * The main entry point for invoking an RPC method.
   * This method acts as a router, determining the correct handling strategy
   * for the request and delegating to the appropriate private handler.
   *
   * @param options
   */
  invokeMethod(options) {
    return __async(this, null, function* () {
      const { method } = options.request;
      if (RPC_HANDLED_METHODS.has(method)) {
        return this.handleWithRpcNode(options);
      }
      if (SDK_HANDLED_METHODS.has(method)) {
        return this.handleWithSdkState(options);
      }
      return this.handleWithWallet(options);
    });
  }
  /**
   * Forwards the request directly to the wallet via the transport.
   *
   * @param options
   */
  handleWithWallet(options) {
    return __async(this, null, function* () {
      return __privateMethod(this, _RequestRouter_instances, withAnalyticsTracking_fn).call(this, options, () => __async(this, null, function* () {
        const request = this.transport.request({
          method: "wallet_invokeMethod",
          params: options
        });
        const { ui, mobile } = this.config;
        const { showInstallModal = false } = ui != null ? ui : {};
        const secure = isSecure();
        const shouldOpenDeeplink = secure && !showInstallModal;
        if (shouldOpenDeeplink) {
          setTimeout(() => __async(this, null, function* () {
            const session = yield this.transport.getActiveSession();
            if (!session) {
              throw new Error("No active session found");
            }
            const url = `${METAMASK_DEEPLINK_BASE}/mwp?id=${encodeURIComponent(session.id)}`;
            if (mobile == null ? void 0 : mobile.preferredOpenLink) {
              mobile.preferredOpenLink(url, "_self");
            } else {
              openDeeplink(this.config, url, METAMASK_CONNECT_BASE_URL);
            }
          }), 10);
        }
        const response = yield request;
        if (response.error) {
          const { error } = response;
          throw new RPCInvokeMethodErr(
            `RPC Request failed with code ${error.code}: ${error.message}`,
            error.code,
            error.message
          );
        }
        return response.result;
      }));
    });
  }
  /**
   * Routes the request to a configured RPC node.
   *
   * @param options
   */
  handleWithRpcNode(options) {
    return __async(this, null, function* () {
      try {
        return yield this.rpcClient.request(options);
      } catch (error) {
        if (error instanceof MissingRpcEndpointErr) {
          return this.handleWithWallet(options);
        }
        throw error;
      }
    });
  }
  /**
   * Responds directly from the SDK's session state.
   *
   * @param options
   */
  handleWithSdkState(options) {
    return __async(this, null, function* () {
      console.warn(
        `Method "${options.request.method}" is configured for SDK state handling, but this is not yet implemented. Falling back to wallet passthrough.`
      );
      return this.handleWithWallet(options);
    });
  }
};
_RequestRouter_instances = new WeakSet();
withAnalyticsTracking_fn = function(options, execute) {
  return __async(this, null, function* () {
    var _a3;
    yield __privateMethod(this, _RequestRouter_instances, trackWalletActionRequested_fn).call(this, options);
    try {
      const result = yield execute();
      yield __privateMethod(this, _RequestRouter_instances, trackWalletActionSucceeded_fn).call(this, options);
      return result;
    } catch (error) {
      const isRejection = isRejectionError(error);
      if (isRejection) {
        yield __privateMethod(this, _RequestRouter_instances, trackWalletActionRejected_fn).call(this, options);
      } else {
        yield __privateMethod(this, _RequestRouter_instances, trackWalletActionFailed_fn).call(this, options);
      }
      if (error instanceof RPCInvokeMethodErr) {
        throw error;
      }
      const castError = error;
      throw new RPCInvokeMethodErr(
        (_a3 = castError.message) != null ? _a3 : "Unknown error",
        castError.code
      );
    }
  });
};
trackWalletActionRequested_fn = function(options) {
  return __async(this, null, function* () {
    const props = yield getWalletActionAnalyticsProperties(
      this.config,
      this.config.storage,
      options,
      this.transportType
    );
    analytics.track("mmconnect_wallet_action_requested", props);
  });
};
trackWalletActionSucceeded_fn = function(options) {
  return __async(this, null, function* () {
    const props = yield getWalletActionAnalyticsProperties(
      this.config,
      this.config.storage,
      options,
      this.transportType
    );
    analytics.track("mmconnect_wallet_action_succeeded", props);
  });
};
trackWalletActionFailed_fn = function(options) {
  return __async(this, null, function* () {
    const props = yield getWalletActionAnalyticsProperties(
      this.config,
      this.config.storage,
      options,
      this.transportType
    );
    analytics.track("mmconnect_wallet_action_failed", props);
  });
};
trackWalletActionRejected_fn = function(options) {
  return __async(this, null, function* () {
    const props = yield getWalletActionAnalyticsProperties(
      this.config,
      this.config.storage,
      options,
      this.transportType
    );
    analytics.track("mmconnect_wallet_action_rejected", props);
  });
};

// src/multichain/transports/default/index.ts
init_utils2();
import {
  getDefaultTransport
} from "@metamask/multichain-api-client";
var DEFAULT_REQUEST_TIMEOUT = 60 * 1e3;
var _notificationCallbacks, _transport, _defaultRequestOptions, _pendingRequests, _handleResponseListener, _handleNotificationListener, _DefaultTransport_instances, notifyCallbacks_fn, isMetamaskProviderEvent_fn, handleResponse_fn, handleNotification_fn, setupMessageListener_fn, init_fn;
var DefaultTransport = class {
  constructor() {
    __privateAdd(this, _DefaultTransport_instances);
    __privateAdd(this, _notificationCallbacks, /* @__PURE__ */ new Set());
    __privateAdd(this, _transport, getDefaultTransport());
    __privateAdd(this, _defaultRequestOptions, {
      timeout: DEFAULT_REQUEST_TIMEOUT
    });
    __privateAdd(this, _pendingRequests, /* @__PURE__ */ new Map());
    __privateAdd(this, _handleResponseListener);
    __privateAdd(this, _handleNotificationListener);
  }
  sendEip1193Message(payload, options) {
    return __async(this, null, function* () {
      __privateMethod(this, _DefaultTransport_instances, setupMessageListener_fn).call(this);
      const requestId = String(getUniqueRequestId());
      const request = __spreadValues({
        jsonrpc: "2.0",
        id: requestId
      }, payload);
      return new Promise((resolve, reject) => {
        var _a3;
        const timeout = setTimeout(() => {
          __privateGet(this, _pendingRequests).delete(requestId);
          reject(new Error("Request timeout"));
        }, (_a3 = options == null ? void 0 : options.timeout) != null ? _a3 : __privateGet(this, _defaultRequestOptions).timeout);
        __privateGet(this, _pendingRequests).set(requestId, {
          resolve: (response) => {
            resolve(response);
          },
          reject,
          timeout
        });
        window.postMessage(
          {
            target: "metamask-contentscript",
            data: {
              name: "metamask-provider",
              data: request
            }
          },
          // eslint-disable-next-line no-restricted-globals
          location.origin
        );
      });
    });
  }
  init() {
    return __async(this, null, function* () {
      yield __privateMethod(this, _DefaultTransport_instances, init_fn).call(this);
      let walletSession = { sessionScopes: {} };
      try {
        const sessionRequest = yield this.request(
          { method: "wallet_getSession" },
          __privateGet(this, _defaultRequestOptions)
        );
        walletSession = sessionRequest.result;
      } catch (e) {
        console.error(
          "Failed to get wallet session during DefaultTransport init"
        );
      }
      __privateMethod(this, _DefaultTransport_instances, notifyCallbacks_fn).call(this, {
        method: "wallet_sessionChanged",
        params: walletSession
      });
    });
  }
  connect(options) {
    return __async(this, null, function* () {
      var _a3, _b, _c, _d, _e;
      yield __privateMethod(this, _DefaultTransport_instances, init_fn).call(this);
      const sessionRequest = yield this.request(
        { method: "wallet_getSession" },
        __privateGet(this, _defaultRequestOptions)
      );
      if (sessionRequest.error) {
        throw new Error(sessionRequest.error.message);
      }
      let walletSession = sessionRequest.result;
      const createSessionParams = {
        optionalScopes: addValidAccounts(
          getOptionalScopes((_a3 = options == null ? void 0 : options.scopes) != null ? _a3 : []),
          getValidAccounts((_b = options == null ? void 0 : options.caipAccountIds) != null ? _b : [])
        ),
        sessionProperties: options == null ? void 0 : options.sessionProperties
      };
      if (walletSession && options && !options.forceRequest) {
        const currentScopes = Object.keys(
          (_c = walletSession == null ? void 0 : walletSession.sessionScopes) != null ? _c : {}
        );
        const proposedScopes = (_d = options == null ? void 0 : options.scopes) != null ? _d : [];
        const proposedCaipAccountIds = (_e = options == null ? void 0 : options.caipAccountIds) != null ? _e : [];
        const hasSameScopesAndAccounts = isSameScopesAndAccounts(
          currentScopes,
          proposedScopes,
          walletSession,
          proposedCaipAccountIds
        );
        if (!hasSameScopesAndAccounts) {
          const response = yield this.request(
            { method: "wallet_createSession", params: createSessionParams },
            __privateGet(this, _defaultRequestOptions)
          );
          if (response.error) {
            throw new Error(response.error.message);
          }
          walletSession = response.result;
        }
      } else if (!walletSession || (options == null ? void 0 : options.forceRequest)) {
        const response = yield this.request(
          { method: "wallet_createSession", params: createSessionParams },
          __privateGet(this, _defaultRequestOptions)
        );
        if (response.error) {
          throw new Error(response.error.message);
        }
        walletSession = response.result;
      }
      __privateMethod(this, _DefaultTransport_instances, notifyCallbacks_fn).call(this, {
        method: "wallet_sessionChanged",
        params: walletSession
      });
    });
  }
  disconnect() {
    return __async(this, arguments, function* (scopes = []) {
      yield this.request({ method: "wallet_revokeSession", params: { scopes } });
    });
  }
  isConnected() {
    return __privateGet(this, _transport).isConnected();
  }
  request(_0) {
    return __async(this, arguments, function* (request, options = __privateGet(this, _defaultRequestOptions)) {
      return __privateGet(this, _transport).request(request, options);
    });
  }
  onNotification(callback) {
    __privateGet(this, _transport).onNotification(callback);
    __privateGet(this, _notificationCallbacks).add(callback);
    return () => {
      __privateGet(this, _notificationCallbacks).delete(callback);
    };
  }
  getActiveSession() {
    return __async(this, null, function* () {
      throw new Error(
        "getActiveSession is purposely not implemented for the DefaultTransport"
      );
    });
  }
  getStoredPendingSessionRequest() {
    return __async(this, null, function* () {
      throw new Error(
        "getStoredPendingSessionRequest is purposely not implemented for the DefaultTransport"
      );
    });
  }
};
_notificationCallbacks = new WeakMap();
_transport = new WeakMap();
_defaultRequestOptions = new WeakMap();
_pendingRequests = new WeakMap();
_handleResponseListener = new WeakMap();
_handleNotificationListener = new WeakMap();
_DefaultTransport_instances = new WeakSet();
notifyCallbacks_fn = function(data) {
  for (const callback of __privateGet(this, _notificationCallbacks)) {
    try {
      callback(data);
    } catch (error) {
      console.log(
        "[WindowPostMessageTransport] notifyCallbacks error:",
        error
      );
    }
  }
};
isMetamaskProviderEvent_fn = function(event) {
  var _a3, _b;
  return ((_b = (_a3 = event == null ? void 0 : event.data) == null ? void 0 : _a3.data) == null ? void 0 : _b.name) === "metamask-provider" && // eslint-disable-next-line no-restricted-globals
  event.origin === location.origin;
};
handleResponse_fn = function(event) {
  var _a3, _b;
  if (!__privateMethod(this, _DefaultTransport_instances, isMetamaskProviderEvent_fn).call(this, event)) {
    return;
  }
  const responseData = (_b = (_a3 = event == null ? void 0 : event.data) == null ? void 0 : _a3.data) == null ? void 0 : _b.data;
  if (typeof responseData === "object" && responseData !== null && "method" in responseData) {
    return;
  }
  if (typeof responseData === "object" && responseData !== null && "id" in responseData && ("result" in responseData || "error" in responseData)) {
    const responseId = String(responseData.id);
    const pendingRequest = __privateGet(this, _pendingRequests).get(responseId);
    if (pendingRequest) {
      clearTimeout(pendingRequest.timeout);
      __privateGet(this, _pendingRequests).delete(responseId);
      const response = responseData;
      if ("error" in response && response.error) {
        const error = new Error(
          response.error.message || "Request failed"
        );
        if (typeof response.error.code === "number") {
          error.code = response.error.code;
        }
        pendingRequest.reject(error);
      } else {
        pendingRequest.resolve(response);
      }
    }
  }
};
handleNotification_fn = function(event) {
  var _a3, _b;
  if (!__privateMethod(this, _DefaultTransport_instances, isMetamaskProviderEvent_fn).call(this, event)) {
    return;
  }
  const responseData = (_b = (_a3 = event == null ? void 0 : event.data) == null ? void 0 : _a3.data) == null ? void 0 : _b.data;
  if (typeof responseData === "object" && responseData !== null && "method" in responseData) {
    __privateMethod(this, _DefaultTransport_instances, notifyCallbacks_fn).call(this, responseData);
  }
};
setupMessageListener_fn = function() {
  if (__privateGet(this, _handleResponseListener)) {
    return;
  }
  __privateSet(this, _handleResponseListener, __privateMethod(this, _DefaultTransport_instances, handleResponse_fn).bind(this));
  __privateSet(this, _handleNotificationListener, __privateMethod(this, _DefaultTransport_instances, handleNotification_fn).bind(this));
  window.addEventListener("message", __privateGet(this, _handleResponseListener));
  window.addEventListener("message", __privateGet(this, _handleNotificationListener));
};
init_fn = function() {
  return __async(this, null, function* () {
    __privateMethod(this, _DefaultTransport_instances, setupMessageListener_fn).call(this);
    if (!__privateGet(this, _transport).isConnected()) {
      yield __privateGet(this, _transport).connect();
    }
  });
};

// src/multichain/transports/multichainApiClientWrapper/index.ts
init_utils2();
import { providerErrors } from "@metamask/rpc-errors";
var _notificationCallbacks2, _MultichainApiClientWrapperTransport_instances, walletCreateSession_fn, walletGetSession_fn, walletRevokeSession_fn, walletInvokeMethod_fn;
var MultichainApiClientWrapperTransport = class {
  constructor(metamaskConnectMultichain) {
    this.metamaskConnectMultichain = metamaskConnectMultichain;
    __privateAdd(this, _MultichainApiClientWrapperTransport_instances);
    __privateAdd(this, _notificationCallbacks2, /* @__PURE__ */ new Set());
  }
  isTransportDefined() {
    try {
      return Boolean(this.metamaskConnectMultichain.transport);
    } catch (_error) {
      return false;
    }
  }
  clearNotificationCallbacks() {
    __privateGet(this, _notificationCallbacks2).clear();
  }
  notifyCallbacks(data) {
    __privateGet(this, _notificationCallbacks2).forEach((callback) => {
      callback(data);
    });
  }
  clearTransportNotificationListener() {
    var _a3;
    (_a3 = this.notificationListener) == null ? void 0 : _a3.call(this);
    this.notificationListener = void 0;
  }
  setupTransportNotificationListener() {
    if (!this.isTransportDefined() || this.notificationListener) {
      return;
    }
    this.notificationListener = this.metamaskConnectMultichain.transport.onNotification(
      this.notifyCallbacks.bind(this)
    );
  }
  connect() {
    return __async(this, null, function* () {
      console.log("\u{1F4DA} connect");
      yield this.metamaskConnectMultichain.emitSessionChanged();
    });
  }
  disconnect() {
    return __async(this, null, function* () {
      return Promise.resolve();
    });
  }
  isConnected() {
    return true;
  }
  request(_0) {
    return __async(this, arguments, function* (params, _options = {}) {
      const id = getUniqueRequestId();
      const requestPayload = __spreadValues({
        id,
        jsonrpc: "2.0"
      }, params);
      switch (requestPayload.method) {
        case "wallet_createSession":
          return __privateMethod(this, _MultichainApiClientWrapperTransport_instances, walletCreateSession_fn).call(this, requestPayload);
        case "wallet_getSession":
          return __privateMethod(this, _MultichainApiClientWrapperTransport_instances, walletGetSession_fn).call(this, requestPayload);
        case "wallet_revokeSession":
          return __privateMethod(this, _MultichainApiClientWrapperTransport_instances, walletRevokeSession_fn).call(this, requestPayload);
        case "wallet_invokeMethod":
          return __privateMethod(this, _MultichainApiClientWrapperTransport_instances, walletInvokeMethod_fn).call(this, requestPayload);
        default:
          throw new Error(`Unsupported method: ${requestPayload.method}`);
      }
      throw new Error(`Unknown method: ${requestPayload.method}`);
    });
  }
  onNotification(callback) {
    this.setupTransportNotificationListener();
    __privateGet(this, _notificationCallbacks2).add(callback);
    return () => {
      __privateGet(this, _notificationCallbacks2).delete(callback);
    };
  }
};
_notificationCallbacks2 = new WeakMap();
_MultichainApiClientWrapperTransport_instances = new WeakSet();
walletCreateSession_fn = function(request) {
  return __async(this, null, function* () {
    const createSessionParams = request.params;
    const scopes = Object.keys(__spreadValues(__spreadValues({}, createSessionParams.optionalScopes), createSessionParams.requiredScopes));
    const scopeAccounts = [];
    scopes.forEach((scope) => {
      var _a3, _b, _c, _d;
      const requiredScope = (_a3 = createSessionParams.requiredScopes) == null ? void 0 : _a3[scope];
      const optionalScope = (_b = createSessionParams.optionalScopes) == null ? void 0 : _b[scope];
      if (requiredScope) {
        scopeAccounts.push(...(_c = requiredScope.accounts) != null ? _c : []);
      }
      if (optionalScope) {
        scopeAccounts.push(...(_d = optionalScope.accounts) != null ? _d : []);
      }
    });
    const accounts = [...new Set(scopeAccounts)];
    console.log("\u{1F4DA} SDK connect");
    yield this.metamaskConnectMultichain.connect(
      scopes,
      accounts,
      createSessionParams.sessionProperties
    );
    console.log("\u{1F4DA} SDK connected");
    return this.metamaskConnectMultichain.transport.request({
      method: "wallet_getSession"
    });
  });
};
walletGetSession_fn = function(request) {
  return __async(this, null, function* () {
    if (!this.isTransportDefined()) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          sessionScopes: {}
        }
      };
    }
    return this.metamaskConnectMultichain.transport.request({
      method: "wallet_getSession"
    });
  });
};
walletRevokeSession_fn = function(request) {
  return __async(this, null, function* () {
    var _a3;
    if (!this.isTransportDefined()) {
      return { jsonrpc: "2.0", id: request.id, result: true };
    }
    const revokeSessionParams = request.params;
    const scopes = (_a3 = revokeSessionParams == null ? void 0 : revokeSessionParams.scopes) != null ? _a3 : [];
    try {
      yield this.metamaskConnectMultichain.disconnect(scopes);
      return { jsonrpc: "2.0", id: request.id, result: true };
    } catch (_error) {
      return { jsonrpc: "2.0", id: request.id, result: false };
    }
  });
};
walletInvokeMethod_fn = function(request) {
  return __async(this, null, function* () {
    if (!this.isTransportDefined()) {
      return { error: providerErrors.unauthorized() };
    }
    const result = this.metamaskConnectMultichain.invokeMethod(
      request.params
    );
    return {
      result
    };
  });
};

// src/multichain/transports/mwp/index.ts
init_domain();
init_utils2();
import { SessionStore } from "@metamask/mobile-wallet-protocol-core";
import {
  TransportTimeoutError
} from "@metamask/multichain-api-client";
import { JsonRpcError, providerErrors as providerErrors2, rpcErrors } from "@metamask/rpc-errors";

// src/multichain/transports/constants.ts
var MULTICHAIN_PROVIDER_STREAM_NAME = "metamask-multichain-provider";

// src/multichain/transports/mwp/index.ts
var DEFAULT_REQUEST_TIMEOUT2 = 60 * 1e3;
var CONNECTION_GRACE_PERIOD = 60 * 1e3;
var DEFAULT_CONNECTION_TIMEOUT = DEFAULT_REQUEST_TIMEOUT2 + CONNECTION_GRACE_PERIOD;
var DEFAULT_RESUME_TIMEOUT = 10 * 1e3;
var SESSION_STORE_KEY = "cache_wallet_getSession";
var ACCOUNTS_STORE_KEY = "cache_eth_accounts";
var CHAIN_STORE_KEY = "cache_eth_chainId";
var PENDING_SESSION_REQUEST_KEY = "pending_session_request";
var CACHED_METHOD_LIST = [
  "wallet_getSession",
  "wallet_createSession",
  "wallet_sessionChanged"
];
var CACHED_RESET_METHOD_LIST = [
  "wallet_revokeSession",
  "wallet_revokePermissions"
];
var logger = createLogger("metamask-sdk:transport");
var MWPTransport = class {
  constructor(dappClient, kvstore, options = {
    requestTimeout: DEFAULT_REQUEST_TIMEOUT2,
    connectionTimeout: DEFAULT_CONNECTION_TIMEOUT,
    resumeTimeout: DEFAULT_RESUME_TIMEOUT
  }) {
    this.dappClient = dappClient;
    this.kvstore = kvstore;
    this.options = options;
    this.__pendingRequests = /* @__PURE__ */ new Map();
    this.notificationCallbacks = /* @__PURE__ */ new Set();
    this.dappClient.on("message", this.handleMessage.bind(this));
    this.dappClient.on("session_request", (sessionRequest) => {
      this.currentSessionRequest = sessionRequest;
      this.kvstore.set(PENDING_SESSION_REQUEST_KEY, JSON.stringify(sessionRequest)).catch((err) => {
        logger("Failed to store pending session request", err);
      });
    });
    if (typeof window !== "undefined" && typeof window.addEventListener !== "undefined") {
      this.windowFocusHandler = this.onWindowFocus.bind(this);
      window.addEventListener("focus", this.windowFocusHandler);
    }
  }
  get pendingRequests() {
    return this.__pendingRequests;
  }
  set pendingRequests(pendingRequests) {
    this.__pendingRequests = pendingRequests;
  }
  get sessionRequest() {
    return this.currentSessionRequest;
  }
  /**
   * Returns the stored pending session request from the dappClient session_request event, if any.
   *
   * @returns The stored SessionRequest, or null if none or invalid.
   */
  getStoredPendingSessionRequest() {
    return __async(this, null, function* () {
      try {
        const raw = yield this.kvstore.get(PENDING_SESSION_REQUEST_KEY);
        if (!raw) {
          return null;
        }
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    });
  }
  /**
   * Removes the stored pending session request from the KVStore.
   * This is necessary to ensure that ConnectMultichain is able to correctly
   * infer the MWP Transport connection attempt status.
   */
  removeStoredPendingSessionRequest() {
    return __async(this, null, function* () {
      yield this.kvstore.delete(PENDING_SESSION_REQUEST_KEY);
    });
  }
  onWindowFocus() {
    if (!this.isConnected()) {
      this.dappClient.reconnect();
    }
  }
  notifyCallbacks(data) {
    this.notificationCallbacks.forEach((callback) => callback(data));
  }
  rejectRequest(id, error = new Error("Request rejected")) {
    const request = this.pendingRequests.get(id);
    if (request) {
      this.pendingRequests.delete(id);
      clearTimeout(request.timeout);
      request.reject(error);
    }
  }
  parseWalletError(errorPayload) {
    const errorData = errorPayload;
    if (typeof errorData.code === "number" && typeof errorData.message === "string") {
      const { code, message: message2 } = errorData;
      if (code >= 1e3 && code <= 4999) {
        return providerErrors2.custom({ code, message: message2 });
      }
      return new JsonRpcError(code, message2);
    }
    const message = errorPayload instanceof Error ? errorPayload.message : JSON.stringify(errorPayload);
    return rpcErrors.internal({ message });
  }
  handleMessage(message) {
    if (typeof message === "object" && message !== null) {
      if ("data" in message) {
        const messagePayload = message.data;
        if ("id" in messagePayload && typeof messagePayload.id === "string") {
          const request = this.pendingRequests.get(messagePayload.id);
          if (request) {
            clearTimeout(request.timeout);
            if ("error" in messagePayload && messagePayload.error) {
              this.pendingRequests.delete(messagePayload.id);
              request.reject(this.parseWalletError(messagePayload.error));
              return;
            }
            const requestWithName = __spreadProps(__spreadValues({}, messagePayload), {
              method: request.method === "wallet_getSession" || request.method === "wallet_createSession" ? "wallet_sessionChanged" : request.method
            });
            const notification = __spreadProps(__spreadValues({}, messagePayload), {
              method: request.method === "wallet_getSession" || request.method === "wallet_createSession" ? "wallet_sessionChanged" : request.method,
              params: requestWithName.result
            });
            this.notifyCallbacks(notification);
            request.resolve(requestWithName);
            this.pendingRequests.delete(messagePayload.id);
          }
        } else {
          if (message.data.method === "metamask_chainChanged") {
            this.kvstore.set(
              CHAIN_STORE_KEY,
              JSON.stringify(
                message.data.params.chainId
              )
            );
          }
          if (message.data.method === "metamask_accountsChanged") {
            this.kvstore.set(
              ACCOUNTS_STORE_KEY,
              JSON.stringify(
                message.data.params
              )
            );
          }
          if (message.data.method === "wallet_sessionChanged") {
            const notification = message.data;
            const response = {
              result: notification.params
            };
            this.kvstore.set(SESSION_STORE_KEY, JSON.stringify(response));
          }
          this.notifyCallbacks(message.data);
        }
      }
    }
  }
  onResumeSuccess(resumeResolve, resumeReject, options) {
    return __async(this, null, function* () {
      var _a3, _b, _c, _d, _e, _f, _g;
      try {
        yield this.waitForWalletSessionIfNotCached();
        const sessionRequest = yield this.request({
          method: "wallet_getSession"
        });
        if (sessionRequest.error) {
          return resumeReject(new Error(sessionRequest.error.message));
        }
        let walletSession = sessionRequest.result;
        if (walletSession && options) {
          const currentScopes = Object.keys(
            (_a3 = walletSession == null ? void 0 : walletSession.sessionScopes) != null ? _a3 : {}
          );
          const proposedScopes = (_b = options == null ? void 0 : options.scopes) != null ? _b : [];
          const proposedCaipAccountIds = (_c = options == null ? void 0 : options.caipAccountIds) != null ? _c : [];
          const hasSameScopesAndAccounts = isSameScopesAndAccounts(
            currentScopes,
            proposedScopes,
            walletSession,
            proposedCaipAccountIds
          );
          if (!hasSameScopesAndAccounts) {
            const optionalScopes = addValidAccounts(
              getOptionalScopes((_d = options == null ? void 0 : options.scopes) != null ? _d : []),
              getValidAccounts((_e = options == null ? void 0 : options.caipAccountIds) != null ? _e : [])
            );
            const sessionRequest2 = {
              optionalScopes
            };
            const response = yield this.request({
              method: "wallet_createSession",
              params: sessionRequest2
            });
            if (response.error) {
              return resumeReject(new Error(response.error.message));
            }
            walletSession = response.result;
          }
        } else if (!walletSession) {
          const optionalScopes = addValidAccounts(
            getOptionalScopes((_f = options == null ? void 0 : options.scopes) != null ? _f : []),
            getValidAccounts((_g = options == null ? void 0 : options.caipAccountIds) != null ? _g : [])
          );
          const sessionRequest2 = { optionalScopes };
          const response = yield this.request({
            method: "wallet_createSession",
            params: sessionRequest2
          });
          if (response.error) {
            return resumeReject(new Error(response.error.message));
          }
          walletSession = response.result;
        }
        yield this.removeStoredPendingSessionRequest();
        this.notifyCallbacks({
          method: "wallet_sessionChanged",
          params: walletSession
        });
        return resumeResolve();
      } catch (err) {
        return resumeReject(err);
      }
    });
  }
  init() {
    return __async(this, null, function* () {
    });
  }
  // TODO: Rename this
  sendEip1193Message(payload, options) {
    return __async(this, null, function* () {
      const request = __spreadValues({
        jsonrpc: "2.0",
        id: String(getUniqueRequestId())
      }, payload);
      const cachedWalletSession = yield this.getCachedResponse(request);
      if (cachedWalletSession) {
        this.notifyCallbacks(cachedWalletSession);
        return cachedWalletSession;
      }
      return new Promise((resolve, reject) => {
        var _a3;
        const timeout = setTimeout(() => {
          this.rejectRequest(request.id, new TransportTimeoutError());
        }, (_a3 = options == null ? void 0 : options.timeout) != null ? _a3 : this.options.requestTimeout);
        this.pendingRequests.set(request.id, {
          request,
          method: request.method,
          resolve: (response) => __async(this, null, function* () {
            yield this.storeWalletSession(request, response);
            return resolve(response);
          }),
          reject,
          timeout
        });
        this.dappClient.sendRequest({
          name: "metamask-provider",
          data: request
        }).catch(reject);
      });
    });
  }
  connect(options) {
    return __async(this, null, function* () {
      const { dappClient } = this;
      const session = yield this.getActiveSession();
      if (session) {
        logger("active session found", {
          id: session.id,
          channel: session.channel,
          expiresAt: session.expiresAt
        });
      }
      const storedSessionRequestBeforeConnectionAttempt = yield this.getStoredPendingSessionRequest();
      let timeout;
      let initialConnectionMessageHandler;
      const connectionPromise = new Promise((resolve, reject) => __async(this, null, function* () {
        let connection;
        if (session) {
          connection = new Promise((resumeResolve, resumeReject) => {
            var _a3;
            if (this.dappClient.state === "CONNECTED") {
              this.onResumeSuccess(resumeResolve, resumeReject, options);
            } else {
              this.dappClient.once("connected", () => __async(this, null, function* () {
                this.onResumeSuccess(resumeResolve, resumeReject, options);
              }));
              dappClient.resume((_a3 = session == null ? void 0 : session.id) != null ? _a3 : "");
            }
          });
        } else {
          connection = new Promise(
            (resolveConnection, rejectConnection) => {
              var _a3, _b;
              const optionalScopes = addValidAccounts(
                getOptionalScopes((_a3 = options == null ? void 0 : options.scopes) != null ? _a3 : []),
                getValidAccounts((_b = options == null ? void 0 : options.caipAccountIds) != null ? _b : [])
              );
              const sessionRequest = {
                optionalScopes,
                sessionProperties: options == null ? void 0 : options.sessionProperties
              };
              const request = {
                jsonrpc: "2.0",
                id: String(getUniqueRequestId()),
                method: "wallet_createSession",
                params: sessionRequest
              };
              initialConnectionMessageHandler = (message) => __async(this, null, function* () {
                if (typeof message !== "object" || message === null) {
                  return;
                }
                if (!("data" in message)) {
                  return;
                }
                const messagePayload = message.data;
                const isMatchingId = messagePayload.id === request.id;
                const isMatchingMethod = messagePayload.method === "wallet_createSession" || messagePayload.method === "wallet_sessionChanged";
                if (!isMatchingId && !isMatchingMethod) {
                  return;
                }
                if (messagePayload.error) {
                  return rejectConnection(
                    this.parseWalletError(messagePayload.error)
                  );
                }
                yield this.storeWalletSession(
                  request,
                  messagePayload
                );
                yield this.removeStoredPendingSessionRequest();
                this.notifyCallbacks(messagePayload);
                return resolveConnection();
              });
              this.dappClient.on("message", initialConnectionMessageHandler);
              dappClient.connect({
                mode: "trusted",
                initialPayload: {
                  name: MULTICHAIN_PROVIDER_STREAM_NAME,
                  data: request
                }
              }).catch((error) => {
                if (initialConnectionMessageHandler) {
                  this.dappClient.off(
                    "message",
                    initialConnectionMessageHandler
                  );
                }
                rejectConnection(error);
              });
            }
          );
        }
        timeout = setTimeout(
          () => {
            reject(new TransportTimeoutError());
          },
          storedSessionRequestBeforeConnectionAttempt ? this.options.resumeTimeout : this.options.connectionTimeout
        );
        connection.then(resolve).catch(reject);
      }));
      return connectionPromise.catch((error) => __async(this, null, function* () {
        yield this.dappClient.disconnect();
        throw error;
      })).finally(() => {
        if (timeout) {
          clearTimeout(timeout);
        }
        if (initialConnectionMessageHandler) {
          this.dappClient.off("message", initialConnectionMessageHandler);
          initialConnectionMessageHandler = void 0;
        }
        this.removeStoredPendingSessionRequest();
      });
    });
  }
  /**
   * Disconnects from the Mobile Wallet Protocol
   *
   * @param [scopes] - The scopes to revoke. If not provided or empty, all scopes will be revoked.
   * @returns Nothing
   */
  disconnect() {
    return __async(this, arguments, function* (scopes = []) {
      var _a3, _b;
      const cachedSession = yield this.getCachedResponse({
        jsonrpc: "2.0",
        id: "0",
        method: "wallet_getSession"
      });
      const cachedSessionScopes = (_b = (_a3 = cachedSession == null ? void 0 : cachedSession.result) == null ? void 0 : _a3.sessionScopes) != null ? _b : {};
      const remainingScopes = scopes.length === 0 ? [] : Object.keys(cachedSessionScopes).filter(
        (scope) => !scopes.includes(scope)
      );
      const newSessionScopes = Object.fromEntries(
        Object.entries(cachedSessionScopes).filter(
          ([key]) => remainingScopes.includes(key)
        )
      );
      this.request({ method: "wallet_revokeSession", params: { scopes } }).catch(
        (err) => {
          console.error("error revoking session", err);
        }
      );
      const remainingScopesIncludeEip155 = remainingScopes.some(
        (scope) => scope.includes("eip155")
      );
      if (!remainingScopesIncludeEip155) {
        this.kvstore.delete(ACCOUNTS_STORE_KEY);
        this.kvstore.delete(CHAIN_STORE_KEY);
      }
      if (remainingScopes.length > 0) {
        this.kvstore.set(
          SESSION_STORE_KEY,
          JSON.stringify({
            result: {
              sessionScopes: newSessionScopes
            }
          })
        );
      } else {
        this.kvstore.delete(SESSION_STORE_KEY);
        if (typeof window !== "undefined" && typeof window.removeEventListener !== "undefined" && this.windowFocusHandler) {
          window.removeEventListener("focus", this.windowFocusHandler);
          this.windowFocusHandler = void 0;
        }
        yield this.dappClient.disconnect();
      }
      this.notifyCallbacks({
        method: "wallet_sessionChanged",
        params: {
          sessionScopes: newSessionScopes
        }
      });
    });
  }
  /**
   * Checks if the transport is connected
   *
   * @returns True if transport is connected, false otherwise
   */
  isConnected() {
    return this.dappClient.state === "CONNECTED";
  }
  /**
   * Attempts to re-establish a connection via DappClient
   *
   * @returns Nothing
   */
  // TODO: We should re-evaluate adding this to the WebSocketTransport layer from `@metamask/mobile-wallet-protocol-core`
  // ticket: https://consensyssoftware.atlassian.net/browse/WAPI-862
  attemptResumeSession() {
    return __async(this, null, function* () {
      try {
        yield this.dappClient.reconnect();
        yield new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Resume timeout"));
          }, 2e3);
          if (this.isConnected()) {
            clearTimeout(timeout);
            resolve();
          } else {
            this.dappClient.once("connected", () => {
              clearTimeout(timeout);
              resolve();
            });
          }
        });
      } catch (error) {
        return Promise.reject(
          new Error(`Failed to resume session: ${error.message}`)
        );
      }
    });
  }
  getCachedResponse(request) {
    return __async(this, null, function* () {
      var _a3;
      if (request.method === "wallet_getSession") {
        const walletGetSession = yield this.kvstore.get(SESSION_STORE_KEY);
        if (walletGetSession) {
          const walletSession = JSON.parse(walletGetSession);
          return {
            id: request.id,
            jsonrpc: "2.0",
            result: (_a3 = walletSession.params) != null ? _a3 : walletSession.result,
            // "what?... why walletSession.params?.."
            method: request.method
          };
        }
      } else if (request.method === "eth_accounts") {
        const ethAccounts = yield this.kvstore.get(ACCOUNTS_STORE_KEY);
        if (ethAccounts) {
          return {
            id: request.id,
            jsonrpc: "2.0",
            result: JSON.parse(ethAccounts),
            method: request.method
          };
        }
      } else if (request.method === "eth_chainId") {
        const ethChainId = yield this.kvstore.get(CHAIN_STORE_KEY);
        if (ethChainId) {
          return {
            id: request.id,
            jsonrpc: "2.0",
            result: JSON.parse(ethChainId),
            method: request.method
          };
        }
      }
    });
  }
  storeWalletSession(request, response) {
    return __async(this, null, function* () {
      if (response.error) {
        return;
      }
      if (CACHED_METHOD_LIST.includes(request.method)) {
        yield this.kvstore.set(SESSION_STORE_KEY, JSON.stringify(response));
      } else if (request.method === "eth_accounts") {
        yield this.kvstore.set(
          ACCOUNTS_STORE_KEY,
          JSON.stringify(response.result)
        );
      } else if (request.method === "eth_chainId") {
        yield this.kvstore.set(CHAIN_STORE_KEY, JSON.stringify(response.result));
      } else if (CACHED_RESET_METHOD_LIST.includes(request.method)) {
        yield this.kvstore.delete(SESSION_STORE_KEY);
        yield this.kvstore.delete(ACCOUNTS_STORE_KEY);
        yield this.kvstore.delete(CHAIN_STORE_KEY);
      }
    });
  }
  request(payload, options) {
    return __async(this, null, function* () {
      const request = __spreadValues({
        jsonrpc: "2.0",
        id: String(getUniqueRequestId())
      }, payload);
      const cachedWalletSession = yield this.getCachedResponse(request);
      if (cachedWalletSession) {
        this.notifyCallbacks(cachedWalletSession);
        return cachedWalletSession;
      }
      if (!this.isConnected()) {
        yield this.attemptResumeSession();
      }
      return new Promise((resolve, reject) => {
        var _a3;
        const timeout = setTimeout(() => {
          this.rejectRequest(request.id, new TransportTimeoutError());
        }, (_a3 = options == null ? void 0 : options.timeout) != null ? _a3 : this.options.requestTimeout);
        this.pendingRequests.set(request.id, {
          request,
          method: request.method,
          resolve: (response) => __async(this, null, function* () {
            yield this.storeWalletSession(request, response);
            return resolve(response);
          }),
          reject,
          timeout
        });
        this.dappClient.sendRequest({
          name: MULTICHAIN_PROVIDER_STREAM_NAME,
          data: request
        }).catch(reject);
      });
    });
  }
  onNotification(callback) {
    this.notificationCallbacks.add(callback);
    return () => {
      this.notificationCallbacks.delete(callback);
    };
  }
  getActiveSession() {
    return __async(this, null, function* () {
      const { kvstore } = this;
      const sessionStore = yield SessionStore.create(kvstore);
      try {
        const [activeSession] = yield sessionStore.list();
        return activeSession;
      } catch (error) {
        logger("error getting active session", error);
        return void 0;
      }
    });
  }
  // This method checks if an existing CAIP session response is cached or waits for one
  // to be received from the wallet if not cached. This is necessary because there is an edge
  // case during the initial connection flow where after the user has accepted the permission approval
  // and returned back to the dapp from the wallet, the dapp page may have gotten unloaded and refreshed.
  // When it is unloaded and refreshed, it will try to resume the session by making a request for wallet_getSession
  // which should resolve from cache, but because a race condition makes it possible for the response from the wallet
  // for the initial wallet_createSession connection request to not have been handled and cached yet. This results
  // in the wallet_getSession request never resolving unless we wait for it explicitly as done in this method.
  waitForWalletSessionIfNotCached() {
    return __async(this, null, function* () {
      const cachedWalletGetSessionResponse = yield this.kvstore.get(SESSION_STORE_KEY);
      if (cachedWalletGetSessionResponse) {
        return;
      }
      let unsubscribe;
      const responsePromise = new Promise((resolve) => {
        unsubscribe = this.onNotification((message) => {
          if (typeof message === "object" && message !== null) {
            if ("data" in message) {
              const messagePayload = message.data;
              if (messagePayload.method === "wallet_getSession" || messagePayload.method === "wallet_sessionChanged") {
                unsubscribe();
                resolve();
              }
            }
          }
        });
      });
      const timeoutPromise = new Promise((_resolve, reject) => {
        setTimeout(() => {
          unsubscribe();
          this.removeStoredPendingSessionRequest();
          reject(new TransportTimeoutError());
        }, this.options.resumeTimeout);
      });
      return Promise.race([responsePromise, timeoutPromise]);
    });
  }
};

// src/multichain/transports/mwp/KeyManager.ts
import { decrypt, encrypt, PrivateKey, PublicKey } from "eciesjs";
var KeyManager = class {
  generateKeyPair() {
    const privateKey = new PrivateKey();
    return {
      privateKey: new Uint8Array(privateKey.secret),
      publicKey: privateKey.publicKey.toBytes(true)
    };
  }
  encrypt(plaintext, theirPublicKey) {
    return __async(this, null, function* () {
      const plaintextBuffer = Buffer.from(plaintext, "utf8");
      const encryptedBuffer = encrypt(theirPublicKey, plaintextBuffer);
      return encryptedBuffer.toString("base64");
    });
  }
  decrypt(encryptedB64, myPrivateKey) {
    return __async(this, null, function* () {
      const encryptedBuffer = Buffer.from(encryptedB64, "base64");
      const decryptedBuffer = yield decrypt(myPrivateKey, encryptedBuffer);
      return Buffer.from(decryptedBuffer).toString("utf8");
    });
  }
  validatePeerKey(key) {
    PublicKey.fromHex(Buffer.from(key).toString("hex"));
  }
};
var keymanager = new KeyManager();

// src/multichain/index.ts
init_utils2();
var logger2 = createLogger("metamask-sdk:core");
var SINGLETON_KEY = "__METAMASK_CONNECT_MULTICHAIN_SINGLETON__";
var _a2, _provider, _providerTransportWrapper, _transport2, _dappClient, _beforeUnloadListener, _listener, _sdkInfo, _MetaMaskConnectMultichain_instances, setupAnalytics_fn, onTransportNotification_fn, getStoredTransport_fn, setupTransport_fn, init_fn2, createDappClient_fn, setupMWP_fn, onBeforeUnload_fn, createBeforeUnloadListener_fn, renderInstallModalAsync_fn, showInstallModal_fn, headlessConnect_fn, setupDefaultTransport_fn, deeplinkConnect_fn, handleConnection_fn, getCaipSession_fn, openConnectDeeplinkIfNeeded_fn;
var _MetaMaskConnectMultichain = class _MetaMaskConnectMultichain extends MultichainCore {
  constructor(options) {
    var _a3, _b, _c, _d, _e, _f;
    const withDappMetadata = setupDappMetadata(options);
    const integrationType = ((_a3 = options.analytics) == null ? void 0 : _a3.integrationType) || "direct";
    const allOptions = __spreadProps(__spreadValues({}, withDappMetadata), {
      ui: __spreadProps(__spreadValues({}, withDappMetadata.ui), {
        preferExtension: (_b = withDappMetadata.ui.preferExtension) != null ? _b : true,
        showInstallModal: (_c = withDappMetadata.ui.showInstallModal) != null ? _c : false,
        headless: (_d = withDappMetadata.ui.headless) != null ? _d : false
      }),
      analytics: __spreadProps(__spreadValues({}, (_e = options.analytics) != null ? _e : {}), {
        integrationType
      }),
      versions: __spreadValues({
        // typeof guard needed: Metro (React Native) bundles TS source directly,
        // bypassing the tsup build that substitutes __PACKAGE_VERSION__.
        "connect-multichain": false ? "unknown" : "0.11.0"
      }, (_f = options.versions) != null ? _f : {})
    });
    super(allOptions);
    __privateAdd(this, _MetaMaskConnectMultichain_instances);
    __privateAdd(this, _provider);
    __privateAdd(this, _providerTransportWrapper);
    __privateAdd(this, _transport2);
    __privateAdd(this, _dappClient);
    __privateAdd(this, _beforeUnloadListener);
    this._status = "pending";
    __privateAdd(this, _listener);
    __privateAdd(this, _sdkInfo, `Sdk/Javascript SdkVersion/${getVersion()} Platform/${getPlatformType()} dApp/${(_a2 = this.options.dapp.url) != null ? _a2 : this.options.dapp.name} dAppTitle/${this.options.dapp.name}`);
    __privateSet(this, _providerTransportWrapper, new MultichainApiClientWrapperTransport(
      this
    ));
    __privateSet(this, _provider, getMultichainClient({
      transport: __privateGet(this, _providerTransportWrapper)
    }));
  }
  get status() {
    return this._status;
  }
  set status(value) {
    if (this._status === value) {
      return;
    }
    this._status = value;
    this.emit("stateChanged", value);
  }
  get provider() {
    return __privateGet(this, _provider);
  }
  get transport() {
    if (!__privateGet(this, _transport2)) {
      throw new Error("Transport not initialized, establish connection first");
    }
    return __privateGet(this, _transport2);
  }
  get dappClient() {
    if (!__privateGet(this, _dappClient)) {
      throw new Error("DappClient not initialized, establish connection first");
    }
    return __privateGet(this, _dappClient);
  }
  get storage() {
    return this.options.storage;
  }
  get transportType() {
    return __privateGet(this, _transport2) instanceof MWPTransport ? "mwp" /* MWP */ : "browser" /* Browser */;
  }
  // Creates a singleton instance of MetaMaskConnectMultichain.
  // If the singleton already exists, it merges the incoming options with the
  // existing singleton options for the following keys: `api.supportedNetworks`,
  // `versions`, `ui.*`, `mobile.*`, `transport.extensionId`, `debug`. Take note
  // that the value for `dapp` is not merged as it does not make sense for
  // subsequent calls to `createMultichainClient` to have a different `dapp` value.
  static create(options) {
    return __async(this, null, function* () {
      var _a3, _b;
      const globalObject = getGlobalObject();
      const existing = globalObject[SINGLETON_KEY];
      if (existing) {
        const instance = yield existing;
        instance.mergeOptions(options);
        analytics2.setGlobalProperty(
          "mmconnect_versions",
          (_a3 = instance.options.versions) != null ? _a3 : {}
        );
        if ((_b = options.analytics) == null ? void 0 : _b.integrationType) {
          analytics2.setGlobalProperty("integration_types", [
            options.analytics.integrationType
          ]);
        }
        if (options.debug) {
          enableDebug("metamask-sdk:*");
        }
        return instance;
      }
      const instancePromise = (() => __async(null, null, function* () {
        var _a4;
        const instance = new _MetaMaskConnectMultichain(options);
        const isEnabled2 = yield isEnabled(
          "metamask-sdk:core",
          instance.options.storage
        );
        if (isEnabled2) {
          enableDebug("metamask-sdk:core");
        }
        yield __privateMethod(_a4 = instance, _MetaMaskConnectMultichain_instances, init_fn2).call(_a4);
        return instance;
      }))();
      globalObject[SINGLETON_KEY] = instancePromise;
      instancePromise.catch((error) => {
        globalObject[SINGLETON_KEY] = void 0;
        console.error("Error initializing MetaMaskConnectMultichain", error);
      });
      return instancePromise;
    });
  }
  // TODO: make this into param object
  connect(scopes, caipAccountIds, sessionProperties, forceRequest) {
    return __async(this, null, function* () {
      var _a3;
      if (this.status === "connecting" && this.transportType === "mwp" /* MWP */) {
        yield __privateMethod(this, _MetaMaskConnectMultichain_instances, openConnectDeeplinkIfNeeded_fn).call(this);
        throw new Error(
          "Existing connection is pending. Please check your MetaMask Mobile app to continue."
        );
      }
      const { ui } = this.options;
      const platformType = getPlatformType();
      const isWeb = platformType === "in-app-browser" /* MetaMaskMobileWebview */ || platformType === "web-desktop" /* DesktopWeb */;
      const { preferExtension = true, showInstallModal = false } = ui;
      const secure = isSecure();
      const hasExtensionInstalled = yield hasExtension();
      let transportType;
      if (platformType === "in-app-browser" /* MetaMaskMobileWebview */ || isWeb && hasExtensionInstalled && preferExtension) {
        transportType = "browser" /* Browser */;
      } else {
        transportType = "mwp" /* MWP */;
      }
      try {
        const baseProps = yield getBaseAnalyticsProperties(
          this.options,
          this.storage
        );
        const dappConfiguredChains = Object.keys(
          this.options.api.supportedNetworks
        );
        analytics2.track("mmconnect_connection_initiated", __spreadProps(__spreadValues({}, baseProps), {
          transport_type: transportType,
          dapp_configured_chains: dappConfiguredChains,
          dapp_requested_chains: scopes
        }));
      } catch (error) {
        logger2("Error tracking connection_initiated event", error);
      }
      const sessionData = yield __privateMethod(this, _MetaMaskConnectMultichain_instances, getCaipSession_fn).call(this);
      const { mergedScopes, mergedCaipAccountIds, mergedSessionProperties } = mergeRequestedSessionWithExisting(
        sessionData,
        scopes,
        caipAccountIds,
        sessionProperties
      );
      const nonEmptySessionProperties = Object.keys(mergedSessionProperties != null ? mergedSessionProperties : {}).length > 0 ? mergedSessionProperties : void 0;
      if (((_a3 = __privateGet(this, _transport2)) == null ? void 0 : _a3.isConnected()) && !secure) {
        return __privateMethod(this, _MetaMaskConnectMultichain_instances, handleConnection_fn).call(this, __privateGet(this, _transport2).connect({
          scopes: mergedScopes,
          caipAccountIds: mergedCaipAccountIds,
          sessionProperties: nonEmptySessionProperties,
          forceRequest
        }).then(() => __async(this, null, function* () {
          if (__privateGet(this, _transport2) instanceof MWPTransport) {
            return this.storage.setTransport("mwp" /* MWP */);
          }
          return this.storage.setTransport("browser" /* Browser */);
        })), scopes, transportType);
      }
      if (platformType === "in-app-browser" /* MetaMaskMobileWebview */) {
        const defaultTransport = yield __privateMethod(this, _MetaMaskConnectMultichain_instances, setupDefaultTransport_fn).call(this);
        return __privateMethod(this, _MetaMaskConnectMultichain_instances, handleConnection_fn).call(this, defaultTransport.connect({
          scopes: mergedScopes,
          caipAccountIds: mergedCaipAccountIds,
          sessionProperties: nonEmptySessionProperties,
          forceRequest
        }), scopes, transportType);
      }
      if (isWeb && hasExtensionInstalled && preferExtension) {
        const defaultTransport = yield __privateMethod(this, _MetaMaskConnectMultichain_instances, setupDefaultTransport_fn).call(this);
        return __privateMethod(this, _MetaMaskConnectMultichain_instances, handleConnection_fn).call(this, defaultTransport.connect({
          scopes: mergedScopes,
          caipAccountIds: mergedCaipAccountIds,
          sessionProperties: nonEmptySessionProperties,
          forceRequest
        }), scopes, transportType);
      }
      yield __privateMethod(this, _MetaMaskConnectMultichain_instances, setupMWP_fn).call(this);
      const shouldShowInstallModal = hasExtensionInstalled ? showInstallModal : !preferExtension || showInstallModal;
      if (secure && !shouldShowInstallModal) {
        return __privateMethod(this, _MetaMaskConnectMultichain_instances, handleConnection_fn).call(this, __privateMethod(this, _MetaMaskConnectMultichain_instances, deeplinkConnect_fn).call(this, mergedScopes, mergedCaipAccountIds, nonEmptySessionProperties), scopes, transportType);
      }
      return __privateMethod(this, _MetaMaskConnectMultichain_instances, handleConnection_fn).call(this, __privateMethod(this, _MetaMaskConnectMultichain_instances, showInstallModal_fn).call(this, shouldShowInstallModal, mergedScopes, mergedCaipAccountIds, nonEmptySessionProperties), scopes, transportType);
    });
  }
  emit(event, args) {
    var _a3, _b;
    (_b = (_a3 = this.options.transport) == null ? void 0 : _a3.onNotification) == null ? void 0 : _b.call(_a3, { method: event, params: args });
    super.emit(event, args);
  }
  disconnect() {
    return __async(this, arguments, function* (scopes = []) {
      var _a3, _b, _c;
      const sessionData = yield __privateMethod(this, _MetaMaskConnectMultichain_instances, getCaipSession_fn).call(this);
      const remainingScopes = scopes.length === 0 ? [] : Object.keys(sessionData.sessionScopes).filter(
        (scope) => !scopes.includes(scope)
      );
      yield (_a3 = __privateGet(this, _transport2)) == null ? void 0 : _a3.disconnect(scopes);
      if (remainingScopes.length === 0) {
        yield this.storage.removeTransport();
        if (this.transportType !== "browser" /* Browser */) {
          yield (_b = __privateGet(this, _listener)) == null ? void 0 : _b.call(this);
          (_c = __privateGet(this, _beforeUnloadListener)) == null ? void 0 : _c.call(this);
          __privateSet(this, _listener, void 0);
          __privateSet(this, _beforeUnloadListener, void 0);
          __privateSet(this, _transport2, void 0);
          __privateGet(this, _providerTransportWrapper).clearTransportNotificationListener();
          __privateSet(this, _dappClient, void 0);
        }
        this.status = "disconnected";
      }
    });
  }
  invokeMethod(request) {
    return __async(this, null, function* () {
      const { transport, options } = this;
      const rpcClient = new RpcClient(options, __privateGet(this, _sdkInfo));
      const requestRouter = new RequestRouter(
        transport,
        rpcClient,
        options,
        this.transportType
      );
      return requestRouter.invokeMethod(request);
    });
  }
  // DRY THIS WITH REQUEST ROUTER
  openSimpleDeeplinkIfNeeded() {
    const { ui, mobile } = this.options;
    const { showInstallModal = false } = ui != null ? ui : {};
    const secure = isSecure();
    const shouldOpenDeeplink = secure && !showInstallModal;
    if (shouldOpenDeeplink) {
      setTimeout(() => __async(this, null, function* () {
        const session = yield this.transport.getActiveSession();
        if (!session) {
          throw new Error("No active session found");
        }
        const url = `${METAMASK_DEEPLINK_BASE}/mwp?id=${encodeURIComponent(session.id)}`;
        if (mobile == null ? void 0 : mobile.preferredOpenLink) {
          mobile.preferredOpenLink(url, "_self");
        } else {
          openDeeplink(this.options, url, METAMASK_CONNECT_BASE_URL);
        }
      }), 10);
    }
  }
  // Provides a way for ecosystem clients (EVM, Solana, etc.) to get the current CAIP session data
  // when instantiating themselves (as they would have already missed any initial sessionChanged events emitted by ConnectMultichain)
  // without having to concern themselves with the current transport connection status.
  emitSessionChanged() {
    return __async(this, null, function* () {
      var _a3, _b;
      const emptySession = { sessionScopes: {} };
      if (!((_a3 = __privateGet(this, _transport2)) == null ? void 0 : _a3.isConnected())) {
        this.emit("wallet_sessionChanged", emptySession);
        return;
      }
      const response = yield this.transport.request({
        method: "wallet_getSession"
      });
      this.emit("wallet_sessionChanged", (_b = response.result) != null ? _b : emptySession);
    });
  }
};
_provider = new WeakMap();
_providerTransportWrapper = new WeakMap();
_transport2 = new WeakMap();
_dappClient = new WeakMap();
_beforeUnloadListener = new WeakMap();
_listener = new WeakMap();
_sdkInfo = new WeakMap();
_MetaMaskConnectMultichain_instances = new WeakSet();
setupAnalytics_fn = function() {
  return __async(this, null, function* () {
    var _a3, _b;
    const platform = getPlatformType();
    const isBrowser = platform === "in-app-browser" /* MetaMaskMobileWebview */ || platform === "web-desktop" /* DesktopWeb */ || platform === "web-mobile" /* MobileWeb */;
    const isReactNative2 = platform === "react-native" /* ReactNative */;
    if (!isBrowser && !isReactNative2) {
      return;
    }
    const dappId = getDappId(this.options.dapp);
    const anonId = yield this.storage.getAnonId();
    const { integrationType } = (_a3 = this.options.analytics) != null ? _a3 : {
      integrationType: ""
    };
    analytics2.setGlobalProperty(
      "mmconnect_versions",
      (_b = this.options.versions) != null ? _b : {}
    );
    analytics2.setGlobalProperty("dapp_id", dappId);
    analytics2.setGlobalProperty("anon_id", anonId);
    analytics2.setGlobalProperty("platform", platform);
    if (integrationType) {
      analytics2.setGlobalProperty("integration_types", [integrationType]);
    }
    analytics2.enable();
  });
};
onTransportNotification_fn = function(payload) {
  return __async(this, null, function* () {
    var _a3, _b, _c;
    if (typeof payload === "object" && payload !== null && "method" in payload) {
      if (payload.method === "wallet_sessionChanged") {
        const sessionScopes = (_b = (_a3 = payload.params) == null ? void 0 : _a3.sessionScopes) != null ? _b : {};
        const hasScopes = Object.keys(sessionScopes).length > 0;
        if (this.status === "loaded" && !hasScopes) {
          return;
        }
        this.status = hasScopes ? "connected" : "disconnected";
      }
      this.emit(payload.method, (_c = payload.params) != null ? _c : payload.result);
    }
  });
};
getStoredTransport_fn = function() {
  return __async(this, null, function* () {
    const transportType = yield this.storage.getTransport();
    const hasExtensionInstalled = yield hasExtension();
    if (transportType) {
      if (transportType === "browser" /* Browser */) {
        if (hasExtensionInstalled) {
          const apiTransport = new DefaultTransport();
          __privateSet(this, _transport2, apiTransport);
          __privateGet(this, _providerTransportWrapper).setupTransportNotificationListener();
          __privateSet(this, _listener, apiTransport.onNotification(
            __privateMethod(this, _MetaMaskConnectMultichain_instances, onTransportNotification_fn).bind(this)
          ));
          return apiTransport;
        }
      } else if (transportType === "mwp" /* MWP */) {
        const { adapter: kvstore } = this.options.storage;
        const dappClient = yield __privateMethod(this, _MetaMaskConnectMultichain_instances, createDappClient_fn).call(this);
        const apiTransport = new MWPTransport(dappClient, kvstore);
        __privateSet(this, _dappClient, dappClient);
        __privateSet(this, _transport2, apiTransport);
        __privateGet(this, _providerTransportWrapper).setupTransportNotificationListener();
        __privateSet(this, _listener, apiTransport.onNotification(
          __privateMethod(this, _MetaMaskConnectMultichain_instances, onTransportNotification_fn).bind(this)
        ));
        return apiTransport;
      }
      yield this.storage.removeTransport();
    }
    return void 0;
  });
};
setupTransport_fn = function() {
  return __async(this, null, function* () {
    var _a3;
    const transport = yield __privateMethod(this, _MetaMaskConnectMultichain_instances, getStoredTransport_fn).call(this);
    if (transport) {
      if (!this.transport.isConnected()) {
        this.status = "connecting";
        yield this.transport.connect();
      }
      this.status = "connected";
      if (this.transport instanceof MWPTransport) {
        yield this.storage.setTransport("mwp" /* MWP */);
      } else {
        yield this.storage.setTransport("browser" /* Browser */);
      }
    } else {
      this.status = "loaded";
      const hasExtensionInstalled = yield hasExtension();
      const preferExtension = (_a3 = this.options.ui.preferExtension) != null ? _a3 : true;
      if (hasExtensionInstalled && preferExtension) {
        yield __privateMethod(this, _MetaMaskConnectMultichain_instances, setupDefaultTransport_fn).call(this, { persist: false });
        try {
          yield this.transport.init();
        } catch (error) {
          console.error("Passive init failed:", error);
        }
      }
    }
  });
};
init_fn2 = function() {
  return __async(this, null, function* () {
    try {
      yield __privateMethod(this, _MetaMaskConnectMultichain_instances, setupAnalytics_fn).call(this);
      yield __privateMethod(this, _MetaMaskConnectMultichain_instances, setupTransport_fn).call(this);
    } catch (error) {
      yield this.storage.removeTransport();
      this.status = "pending";
      logger2("MetaMaskSDK error during initialization", error);
    }
  });
};
createDappClient_fn = function() {
  return __async(this, null, function* () {
    const { adapter: kvstore } = this.options.storage;
    const sessionstore = yield SessionStore2.create(kvstore);
    const websocket = (
      // eslint-disable-next-line no-negated-condition
      typeof window !== "undefined" ? WebSocket : (yield import("ws")).WebSocket
    );
    const transport = yield WebSocketTransport.create({
      url: MWP_RELAY_URL,
      kvstore,
      websocket
    });
    const dappClient = new DappClient({ transport, sessionstore, keymanager });
    return dappClient;
  });
};
setupMWP_fn = function() {
  return __async(this, null, function* () {
    if (__privateGet(this, _transport2) instanceof MWPTransport) {
      return;
    }
    const { adapter: kvstore } = this.options.storage;
    const dappClient = yield __privateMethod(this, _MetaMaskConnectMultichain_instances, createDappClient_fn).call(this);
    __privateSet(this, _dappClient, dappClient);
    const apiTransport = new MWPTransport(dappClient, kvstore);
    __privateSet(this, _transport2, apiTransport);
    __privateGet(this, _providerTransportWrapper).setupTransportNotificationListener();
    __privateSet(this, _listener, this.transport.onNotification(
      __privateMethod(this, _MetaMaskConnectMultichain_instances, onTransportNotification_fn).bind(this)
    ));
    yield this.storage.setTransport("mwp" /* MWP */);
  });
};
onBeforeUnload_fn = function() {
  return __async(this, null, function* () {
    var _a3;
    if ((_a3 = this.options.ui.factory.modal) == null ? void 0 : _a3.isMounted) {
      yield this.storage.removeTransport();
    }
  });
};
createBeforeUnloadListener_fn = function() {
  const handler = __privateMethod(this, _MetaMaskConnectMultichain_instances, onBeforeUnload_fn).bind(this);
  if (typeof window !== "undefined" && typeof window.addEventListener !== "undefined") {
    window.addEventListener("beforeunload", handler);
  }
  return () => {
    if (typeof window !== "undefined" && typeof window.removeEventListener !== "undefined") {
      window.removeEventListener("beforeunload", handler);
    }
  };
};
renderInstallModalAsync_fn = function(desktopPreferred, scopes, caipAccountIds, sessionProperties) {
  return __async(this, null, function* () {
    return new Promise((resolve, reject) => {
      this.options.ui.factory.renderInstallModal(
        desktopPreferred,
        () => __async(this, null, function* () {
          if (this.dappClient.state === "CONNECTED" || this.dappClient.state === "CONNECTING") {
            yield this.dappClient.disconnect();
          }
          return new Promise((_resolve) => {
            this.dappClient.on(
              "session_request",
              (sessionRequest) => {
                _resolve({
                  sessionRequest,
                  metadata: {
                    dapp: this.options.dapp,
                    sdk: {
                      version: getVersion(),
                      platform: getPlatformType()
                    }
                  }
                });
              }
            );
            (() => __async(this, null, function* () {
              var _a3;
              try {
                yield this.transport.connect({
                  scopes,
                  caipAccountIds,
                  sessionProperties
                });
                yield this.options.ui.factory.unload();
                (_a3 = this.options.ui.factory.modal) == null ? void 0 : _a3.unmount();
                this.status = "connected";
                yield this.storage.setTransport("mwp" /* MWP */);
              } catch (error) {
                if (error instanceof ProtocolError) {
                  if (error.code !== ErrorCode.REQUEST_EXPIRED) {
                    this.status = "disconnected";
                    yield this.options.ui.factory.unload(error);
                    reject(error);
                  }
                } else {
                  this.status = "disconnected";
                  const normalizedError = error instanceof Error ? error : new Error(String(error));
                  yield this.options.ui.factory.unload(normalizedError);
                  reject(normalizedError);
                }
              }
            }))().catch(() => {
            });
          });
        }),
        (error) => __async(this, null, function* () {
          if (error) {
            yield this.storage.removeTransport();
            reject(error);
          } else {
            yield this.storage.setTransport("mwp" /* MWP */);
            resolve();
          }
        }),
        (uri) => {
          this.emit("display_uri", uri);
        }
      ).catch((error) => {
        reject(error instanceof Error ? error : new Error(String(error)));
      });
    });
  });
};
showInstallModal_fn = function(desktopPreferred, scopes, caipAccountIds, sessionProperties) {
  return __async(this, null, function* () {
    var _a3;
    (_a3 = __privateGet(this, _beforeUnloadListener)) != null ? _a3 : __privateSet(this, _beforeUnloadListener, __privateMethod(this, _MetaMaskConnectMultichain_instances, createBeforeUnloadListener_fn).call(this));
    if (this.options.ui.headless) {
      yield __privateMethod(this, _MetaMaskConnectMultichain_instances, headlessConnect_fn).call(this, scopes, caipAccountIds, sessionProperties);
    } else {
      yield __privateMethod(this, _MetaMaskConnectMultichain_instances, renderInstallModalAsync_fn).call(this, desktopPreferred, scopes, caipAccountIds, sessionProperties);
    }
  });
};
headlessConnect_fn = function(scopes, caipAccountIds, sessionProperties) {
  return __async(this, null, function* () {
    return new Promise((resolve, reject) => {
      if (this.dappClient.state === "CONNECTED" || this.dappClient.state === "CONNECTING") {
        this.dappClient.disconnect().catch(() => {
        });
      }
      this.dappClient.on(
        "session_request",
        (sessionRequest) => {
          const connectionRequest = {
            sessionRequest,
            metadata: {
              dapp: this.options.dapp,
              sdk: {
                version: getVersion(),
                platform: getPlatformType()
              }
            }
          };
          const deeplink = this.options.ui.factory.createConnectionDeeplink(connectionRequest);
          this.emit("display_uri", deeplink);
        }
      );
      this.transport.connect({ scopes, caipAccountIds, sessionProperties }).then(() => __async(this, null, function* () {
        this.status = "connected";
        yield this.storage.setTransport("mwp" /* MWP */);
        resolve();
      })).catch((error) => __async(this, null, function* () {
        if (error instanceof ProtocolError) {
          this.status = "disconnected";
          yield this.storage.removeTransport();
          reject(error);
        } else {
          this.status = "disconnected";
          yield this.storage.removeTransport();
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      }));
    });
  });
};
setupDefaultTransport_fn = function() {
  return __async(this, arguments, function* (options = { persist: true }) {
    if (__privateGet(this, _transport2) instanceof DefaultTransport) {
      return __privateGet(this, _transport2);
    }
    if (options == null ? void 0 : options.persist) {
      yield this.storage.setTransport("browser" /* Browser */);
    }
    const transport = new DefaultTransport();
    __privateSet(this, _listener, transport.onNotification(
      __privateMethod(this, _MetaMaskConnectMultichain_instances, onTransportNotification_fn).bind(this)
    ));
    __privateSet(this, _transport2, transport);
    __privateGet(this, _providerTransportWrapper).setupTransportNotificationListener();
    return transport;
  });
};
deeplinkConnect_fn = function(scopes, caipAccountIds, sessionProperties) {
  return __async(this, null, function* () {
    return new Promise((resolve, reject) => __async(this, null, function* () {
      const dappClientMessageHandler = (payload) => {
        var _a3;
        if (typeof payload !== "object" || payload === null || !("data" in payload)) {
          return;
        }
        const data = payload.data;
        if (typeof data === "object" && data !== null) {
          if (data.error) {
            this.dappClient.off("message", dappClientMessageHandler);
            reject(data.error);
          }
          if ((_a3 = data == null ? void 0 : data.result) == null ? void 0 : _a3.sessionScopes) {
            this.dappClient.off("message", dappClientMessageHandler);
          }
        }
      };
      this.dappClient.on("message", dappClientMessageHandler);
      let timeout;
      if (this.transport.isConnected()) {
        timeout = setTimeout(() => {
          this.openSimpleDeeplinkIfNeeded();
        }, 250);
      } else {
        this.dappClient.once(
          "session_request",
          (sessionRequest) => {
            var _a3;
            const connectionRequest = {
              sessionRequest,
              metadata: {
                dapp: this.options.dapp,
                sdk: { version: getVersion(), platform: getPlatformType() }
              }
            };
            const deeplink = this.options.ui.factory.createConnectionDeeplink(
              connectionRequest
            );
            const universalLink = this.options.ui.factory.createConnectionUniversalLink(
              connectionRequest
            );
            this.emit("display_uri", deeplink);
            if ((_a3 = this.options.mobile) == null ? void 0 : _a3.preferredOpenLink) {
              this.options.mobile.preferredOpenLink(deeplink, "_self");
            } else {
              openDeeplink(this.options, deeplink, universalLink);
            }
          }
        );
      }
      return this.transport.connect({ scopes, caipAccountIds, sessionProperties }).then(resolve).catch((error) => __async(this, null, function* () {
        yield this.storage.removeTransport();
        this.dappClient.off("message", dappClientMessageHandler);
        reject(error instanceof Error ? error : new Error(String(error)));
      })).finally(() => {
        if (timeout) {
          clearTimeout(timeout);
        }
      });
    }));
  });
};
handleConnection_fn = function(promise, scopes, transportType) {
  return __async(this, null, function* () {
    this.status = "connecting";
    return promise.then(() => __async(this, null, function* () {
      this.status = "connected";
      try {
        const baseProps = yield getBaseAnalyticsProperties(
          this.options,
          this.storage
        );
        analytics2.track("mmconnect_connection_established", __spreadProps(__spreadValues({}, baseProps), {
          transport_type: transportType,
          user_permissioned_chains: scopes
        }));
      } catch (error) {
        logger2("Error tracking connection_established event", error);
      }
      return void 0;
    })).catch((error) => __async(this, null, function* () {
      this.status = "disconnected";
      try {
        const baseProps = yield getBaseAnalyticsProperties(
          this.options,
          this.storage
        );
        const isRejection = isRejectionError(error);
        if (isRejection) {
          analytics2.track("mmconnect_connection_rejected", __spreadProps(__spreadValues({}, baseProps), {
            transport_type: transportType
          }));
        } else {
          analytics2.track("mmconnect_connection_failed", __spreadProps(__spreadValues({}, baseProps), {
            transport_type: transportType
          }));
        }
      } catch (e) {
        logger2("Error tracking connection failed/rejected event", error);
      }
      throw error;
    }));
  });
};
getCaipSession_fn = function() {
  return __async(this, null, function* () {
    var _a3;
    let sessionData = {
      sessionScopes: {},
      sessionProperties: {}
    };
    if ((_a3 = __privateGet(this, _transport2)) == null ? void 0 : _a3.isConnected()) {
      try {
        const response = yield this.transport.request({
          method: "wallet_getSession"
        });
        if (response.result) {
          sessionData = response.result;
        }
      } catch (e) {
      }
    }
    return sessionData;
  });
};
openConnectDeeplinkIfNeeded_fn = function() {
  return __async(this, null, function* () {
    var _a3, _b;
    const { ui } = this.options;
    const { showInstallModal = false } = ui != null ? ui : {};
    const secure = isSecure();
    const shouldOpenDeeplink = secure && !showInstallModal;
    if (!shouldOpenDeeplink) {
      return;
    }
    const storedSessionRequest = yield (_a3 = __privateGet(this, _transport2)) == null ? void 0 : _a3.getStoredPendingSessionRequest();
    if (!storedSessionRequest) {
      return;
    }
    const connectionRequest = {
      sessionRequest: storedSessionRequest,
      metadata: {
        dapp: this.options.dapp,
        sdk: { version: getVersion(), platform: getPlatformType() }
      }
    };
    const deeplink = this.options.ui.factory.createConnectionDeeplink(connectionRequest);
    const universalLink = this.options.ui.factory.createConnectionUniversalLink(connectionRequest);
    if ((_b = this.options.mobile) == null ? void 0 : _b.preferredOpenLink) {
      this.options.mobile.preferredOpenLink(deeplink, "_self");
    } else {
      openDeeplink(this.options, deeplink, universalLink);
    }
  });
};
var MetaMaskConnectMultichain = _MetaMaskConnectMultichain;

// src/store/index.ts
import * as uuid from "uuid";

// src/domain/errors/storage.ts
init_base();
var _StorageGetErr = class _StorageGetErr extends BaseErr {
  constructor(platform, key, reason) {
    super(
      `StorageErr${_StorageGetErr.code}: ${platform} storage get error in key: ${key} - ${reason}`,
      _StorageGetErr.code
    );
    this.platform = platform;
    this.key = key;
    this.reason = reason;
  }
};
_StorageGetErr.code = 60;
var StorageGetErr = _StorageGetErr;
var _StorageSetErr = class _StorageSetErr extends BaseErr {
  constructor(platform, key, reason) {
    super(
      `StorageErr${_StorageSetErr.code}: ${platform} storage set error in key: ${key} - ${reason}`,
      _StorageSetErr.code
    );
    this.platform = platform;
    this.key = key;
    this.reason = reason;
  }
};
_StorageSetErr.code = 61;
var StorageSetErr = _StorageSetErr;
var _StorageDeleteErr = class _StorageDeleteErr extends BaseErr {
  constructor(platform, key, reason) {
    super(
      `StorageErr${_StorageDeleteErr.code}: ${platform} storage delete error in key: ${key} - ${reason}`,
      _StorageDeleteErr.code
    );
    this.platform = platform;
    this.key = key;
    this.reason = reason;
  }
};
_StorageDeleteErr.code = 62;
var StorageDeleteErr = _StorageDeleteErr;

// src/store/index.ts
init_multichain();
init_client();
var Store = class extends StoreClient {
  constructor(adapter) {
    super();
    this.adapter = adapter;
  }
  getTransport() {
    return __async(this, null, function* () {
      try {
        const transport = yield this.adapter.get("multichain-transport");
        if (!transport) {
          return null;
        }
        return getTransportType(transport);
      } catch (err) {
        throw new StorageGetErr(
          this.adapter.platform,
          "multichain-transport",
          err.message
        );
      }
    });
  }
  setTransport(transport) {
    return __async(this, null, function* () {
      try {
        yield this.adapter.set("multichain-transport", transport);
      } catch (err) {
        throw new StorageSetErr(
          this.adapter.platform,
          "multichain-transport",
          err.message
        );
      }
    });
  }
  removeTransport() {
    return __async(this, null, function* () {
      try {
        yield this.adapter.delete("multichain-transport");
      } catch (err) {
        throw new StorageDeleteErr(
          this.adapter.platform,
          "multichain-transport",
          err.message
        );
      }
    });
  }
  getAnonId() {
    return __async(this, null, function* () {
      try {
        const anonId = yield this.adapter.get("anonId");
        if (anonId) {
          return anonId;
        }
        const newAnonId = uuid.v4();
        yield this.adapter.set("anonId", newAnonId);
        return newAnonId;
      } catch (err) {
        throw new StorageGetErr(this.adapter.platform, "anonId", err.message);
      }
    });
  }
  getExtensionId() {
    return __async(this, null, function* () {
      try {
        return yield this.adapter.get("extensionId");
      } catch (err) {
        throw new StorageGetErr(
          this.adapter.platform,
          "extensionId",
          err.message
        );
      }
    });
  }
  setAnonId(anonId) {
    return __async(this, null, function* () {
      try {
        return yield this.adapter.set("anonId", anonId);
      } catch (err) {
        throw new StorageSetErr(this.adapter.platform, "anonId", err.message);
      }
    });
  }
  setExtensionId(extensionId) {
    return __async(this, null, function* () {
      try {
        return yield this.adapter.set("extensionId", extensionId);
      } catch (err) {
        throw new StorageSetErr(
          this.adapter.platform,
          "extensionId",
          err.message
        );
      }
    });
  }
  removeExtensionId() {
    return __async(this, null, function* () {
      try {
        return yield this.adapter.delete("extensionId");
      } catch (err) {
        throw new StorageDeleteErr(
          this.adapter.platform,
          "extensionId",
          err.message
        );
      }
    });
  }
  removeAnonId() {
    return __async(this, null, function* () {
      try {
        return yield this.adapter.delete("anonId");
      } catch (err) {
        throw new StorageDeleteErr(this.adapter.platform, "anonId", err.message);
      }
    });
  }
  getDebug() {
    return __async(this, null, function* () {
      try {
        return yield this.adapter.get("DEBUG");
      } catch (err) {
        throw new StorageGetErr(this.adapter.platform, "DEBUG", err.message);
      }
    });
  }
};

// src/ui/ModalFactory.ts
import MetaMaskOnboarding from "@metamask/onboarding";
init_domain();
init_utils2();
var BaseModalFactory = class {
  /**
   * Creates a new modal factory instance.
   *
   * @param options - The modals configuration object
   */
  constructor(options) {
    this.options = options;
    this.platform = getPlatformType();
    this.validateModals();
  }
  validateModals() {
    const requiredModals = ["InstallModal", "OTPCodeModal"];
    const missingModals = requiredModals.filter(
      (modal) => !this.options[modal]
    );
    if (missingModals.length > 0) {
      throw new Error(`Missing required modals: ${missingModals.join(", ")}`);
    }
  }
  unload(error) {
    return __async(this, null, function* () {
      var _a3, _b;
      (_a3 = this.modal) == null ? void 0 : _a3.unmount();
      yield (_b = this.successCallback) == null ? void 0 : _b.call(this, error);
    });
  }
  /**
   * Determines if the current platform is a mobile native environment.
   * Currently only includes React Native.
   */
  get isMobile() {
    return this.platform === "react-native" /* ReactNative */;
  }
  /**
   * Determines if the current platform is a Node.js environment.
   * Used for server-side or non-browser environments.
   */
  get isNode() {
    return this.platform === "nodejs" /* NonBrowser */;
  }
  /**
   * Determines if the current platform is a web environment.
   * Includes desktop web, MetaMask mobile webview, and mobile web.
   */
  get isWeb() {
    return this.platform === "web-desktop" /* DesktopWeb */ || this.platform === "in-app-browser" /* MetaMaskMobileWebview */ || this.platform === "web-mobile" /* MobileWeb */;
  }
  getContainer() {
    return typeof document === "undefined" ? void 0 : document.createElement("div");
  }
  getMountedContainer() {
    if (typeof document === "undefined") {
      return void 0;
    }
    const container = this.getContainer();
    if (container) {
      document.body.appendChild(container);
    }
    return container;
  }
  createConnectionDeeplink(connectionRequest) {
    if (!connectionRequest) {
      throw new Error(
        "createConnectionDeeplink can only be called with a connection request"
      );
    }
    const json = JSON.stringify(connectionRequest);
    const compressed = compressString(json);
    const urlEncoded = encodeURIComponent(compressed);
    return `${METAMASK_DEEPLINK_BASE}/mwp?p=${urlEncoded}&c=1`;
  }
  createConnectionUniversalLink(connectionRequest) {
    if (!connectionRequest) {
      return `${METAMASK_CONNECT_BASE_URL}`;
    }
    const json = JSON.stringify(connectionRequest);
    const compressed = compressString(json);
    const urlEncoded = encodeURIComponent(compressed);
    return `${METAMASK_CONNECT_BASE_URL}/mwp?p=${urlEncoded}&c=1`;
  }
  onCloseModal(shouldTerminate = true) {
    return __async(this, null, function* () {
      return this.unload(
        shouldTerminate ? new Error("User closed modal") : void 0
      );
    });
  }
  onStartDesktopOnboarding() {
    new MetaMaskOnboarding().startOnboarding();
  }
  renderInstallModal(showInstallModal, createConnectionRequest, successCallback, onDisplayUri) {
    return __async(this, null, function* () {
      var _a3, _b;
      (_a3 = this.modal) == null ? void 0 : _a3.unmount();
      yield this.preload();
      this.successCallback = successCallback;
      this.displayUriCallback = onDisplayUri;
      const parentElement = this.getMountedContainer();
      const connectionRequest = yield createConnectionRequest();
      const qrCodeLink = this.createConnectionDeeplink(connectionRequest);
      (_b = this.displayUriCallback) == null ? void 0 : _b.call(this, qrCodeLink);
      const modal = new this.options.InstallModal({
        expiresIn: (connectionRequest.sessionRequest.expiresAt - Date.now()) / 1e3,
        connectionRequest,
        parentElement,
        showInstallModal,
        link: qrCodeLink,
        generateQRCode: (request) => __async(this, null, function* () {
          var _a4;
          const newLink = this.createConnectionDeeplink(request);
          (_a4 = this.displayUriCallback) == null ? void 0 : _a4.call(this, newLink);
          return newLink;
        }),
        onClose: this.onCloseModal.bind(this),
        startDesktopOnboarding: this.onStartDesktopOnboarding.bind(this),
        createConnectionRequest,
        onDisplayUri: this.displayUriCallback
      });
      this.modal = modal;
      modal.mount();
    });
  }
  renderOTPCodeModal(createOTPCode, successCallback, updateOTPCode) {
    return __async(this, null, function* () {
      var _a3;
      (_a3 = this.modal) == null ? void 0 : _a3.unmount();
      yield this.preload();
      this.successCallback = successCallback;
      const container = this.getMountedContainer();
      const otpCode = yield createOTPCode();
      const modal = new this.options.OTPCodeModal({
        parentElement: container,
        otpCode,
        onClose: this.onCloseModal.bind(this),
        createOTPCode,
        updateOTPCode: (otpCode2) => updateOTPCode(otpCode2, modal)
      });
      this.modal = modal;
      modal.mount();
    });
  }
};

// src/ui/index.ts
function preload() {
  return __async(this, null, function* () {
    if (typeof document === "undefined") {
      return;
    }
    try {
      const { defineCustomElements } = yield import("@metamask/multichain-ui/loader");
      yield defineCustomElements();
    } catch (error) {
      console.error("Failed to load customElements:", error);
    }
  });
}
var ModalFactory = class extends BaseModalFactory {
  preload() {
    return __async(this, null, function* () {
      return preload();
    });
  }
};

// src/index.browser.ts
init_domain();
var createMultichainClient = (options) => __async(null, null, function* () {
  if (options.debug) {
    enableDebug("metamask-sdk:*");
  }
  const uiModules = yield Promise.resolve().then(() => (init_web(), web_exports));
  let storage;
  if (options.storage) {
    storage = options.storage;
  } else {
    const { StoreAdapterWeb: StoreAdapterWeb2 } = yield Promise.resolve().then(() => (init_web2(), web_exports2));
    const adapter = new StoreAdapterWeb2();
    storage = new Store(adapter);
  }
  const factory = new ModalFactory(uiModules);
  return MetaMaskConnectMultichain.create(__spreadProps(__spreadValues({}, options), {
    storage,
    ui: __spreadProps(__spreadValues({}, options.ui), {
      factory
    })
  }));
});
export {
  EventEmitter,
  Modal,
  MultichainCore,
  PlatformType,
  RPCHttpErr,
  RPCInvokeMethodErr,
  RPCReadonlyRequestErr,
  RPCReadonlyResponseErr,
  RPC_HANDLED_METHODS,
  SDK_HANDLED_METHODS,
  StoreAdapter,
  StoreClient,
  TransportType,
  createLogger,
  createMultichainClient,
  enableDebug,
  getInfuraRpcUrls,
  getPlatformType,
  getTransportType,
  getVersion,
  getWalletActionAnalyticsProperties,
  hasExtension,
  infuraRpcUrls,
  isEnabled,
  isMetamaskExtensionInstalled,
  isRejectionError,
  isSecure
};
//# sourceMappingURL=connect-multichain.mjs.map