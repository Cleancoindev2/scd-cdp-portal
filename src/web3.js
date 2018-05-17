import Web3 from 'web3';
import * as Web3ProviderEngine from 'web3-provider-engine/dist/es5';
import * as RpcSource from 'web3-provider-engine/dist/es5/subproviders/rpc';
import Transport from "@ledgerhq/hw-transport-u2f";
import LedgerSubProvider from './vendor/ledger-subprovider';
import TrezorSubProvider from './vendor/trezor-subprovider';

const settings = require('./settings');

const web3 = new Web3();
export default web3;

window.web3Provider = web3;

export const setHWProvider = (device, network, path, accountsOffset = 0, accountsLength = 1) => {
  return new Promise(async (resolve, reject) => {
    try {
      const networkId = network === 'main' ? 1 : (network === 'kovan' ? 42 : '');
      web3.setProvider(new Web3ProviderEngine());
      const hwWalletSubProvider = device === 'ledger'
                                  ? LedgerSubProvider(async () => await Transport.create(), {networkId, path, accountsOffset, accountsLength})
                                  : TrezorSubProvider({networkId, path, accountsOffset, accountsLength});
      web3.currentProvider.name = device;
      web3.currentProvider.addProvider(hwWalletSubProvider);
      web3.currentProvider.addProvider(new RpcSource({rpcUrl: settings.chain[network].nodeURL}));
      web3.currentProvider.start();
      web3.useLogs = false;
      resolve(true);
    } catch(e) {
      reject(e);
    }
  });
}

export const setWebClientProvider = () => {
  return new Promise(async (resolve, reject) => {
    try {
      if (window.web3) {
        web3.setProvider(window.web3.currentProvider);
      } else {
        alert('error');
      }
      web3.useLogs = true;
      web3.currentProvider.name = web3.currentProvider.isMetaMask || web3.currentProvider.constructor.name === 'MetamaskInpageProvider' ? 'metamask' : 'other';
      resolve(web3);
    } catch(e) {
      reject(e);
    }
  });
}
