import { observable, decorate } from "mobx";
import * as Blockchain from "../blockchainHandler";

import { toBigNumber, isAddress } from '../helpers';

class ProfileStore {
  accountBalance = toBigNumber(-1);
  proxy = -1;

  getAccountBalance = account => {
    if (isAddress(account)) {
      Blockchain.getEthBalanceOf(account).then(r => {
        this.accountBalance = r;
      }, () => {});
    }
  }

  getAndSetProxy = (callbacks = null) => {
    console.log('entra a get and set proxy')
    return new Promise((resolve, reject) => {
      console.log('account', this.transactions.network.defaultAccount);
      Blockchain.getProxyAddress(this.transactions.network.defaultAccount).then(proxy => {
        console.log('recibe proxy en get and set proxy', proxy)
        if (proxy) {
          this.setProxy(proxy);
          callbacks && callbacks.forEach(callback => this.transactions.executeCallback(callback));
        }
        resolve(proxy);
      }, () => reject(false));
    });
  }

  setProxy = proxy => {
    this.proxy = proxy;
    Blockchain.loadObject('dsproxy', this.proxy, 'proxy');
    console.log('proxy', this.proxy);
  }

  checkProxy = callbacks => {
    if (this.proxy) {
      callbacks.forEach(callback => this.transactions.executeCallback(callback));
    } else {
      const id = Math.random();
      const title = 'Create Proxy';
      this.transactions.logRequestTransaction(id, title);
      const proxyRegistry = Blockchain.objects.proxyRegistry;
      callbacks = [['profile/getAndSetProxy', callbacks]];
      if (this.transactions.network.isLedger) {
        Blockchain.signTransactionLedger(this.transactions.network.defaultAccount, proxyRegistry.address, proxyRegistry.build.getData(), 0).then(tx => {
          this.transactions.logPendingTransaction(id, tx, title, callbacks);
        }, e => {
          this.transactions.logTransactionRejected(id, title, e.message);
        });;
      } else {
        proxyRegistry.build((e, tx) => this.transactions.log(e, tx, id, title, callbacks));
      }
    }
  }
}

decorate(ProfileStore, {
  accountBalance: observable,
  proxy: observable
});

const store = new ProfileStore();
export default store;

// autorun(() => {
//   console.log('changed', store.address);
// });
