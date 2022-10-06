import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';

import Onboard from '@web3-onboard/core';
import injectedModule from '@web3-onboard/injected-wallets';
import walletConnectModule from '@web3-onboard/walletconnect';
import magicModule from '@web3-onboard/magic';
import { distinctUntilChanged } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public isAuthenticated$ = new BehaviorSubject(false);
  public isProfileComplete$ = new BehaviorSubject(false);
  public updateUserDataEmitter$ = new BehaviorSubject('');

  private initWeb3Onboard;
  private connectedWallets = [];
  private unsubscribeRef;

  constructor(private router: Router) {
    this.initializeWeb3Onboard();
  }

  initializeWeb3Onboard() {
    //   const logoSVG = `<svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
    // <path d="M21.1406 13.2041L9.86746 1.93094" stroke="#E74A4A" stroke-width="2.96608" stroke-linecap="round"/>
    // <path d="M13.2754 21.0691L2.00223 9.79593" stroke="#3E6AAC" stroke-width="2.96608" stroke-linecap="round"/>
    // <path d="M17.0771 17.1055L5.80398 5.8323" stroke="#FAB961" stroke-width="2.96608" stroke-linecap="round"/>
    // <path d="M13.2754 1.93091L2.00223 13.2041" stroke="#E74A4A" stroke-width="2.96608" stroke-linecap="round"/>
    // <path d="M21.1396 9.7959L9.86648 21.0691" stroke="#3E6AAC" stroke-width="2.96608" stroke-linecap="round"/>
    // <path d="M17.1758 5.99463L5.90262 17.2678" stroke="#FAB961" stroke-width="2.96608" stroke-linecap="round"/>
    // </svg>
    // `;

    const logoSVG =
      // eslint-disable-next-line max-len
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjMiIGhlaWdodD0iMjMiIHZpZXdCb3g9IjAgMCAyMyAyMyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxLjE0MDYgMTMuMjA0MUw5Ljg2NzQ2IDEuOTMwOTQiIHN0cm9rZT0iI0U3NEE0QSIgc3Ryb2tlLXdpZHRoPSIyLjk2NjA4IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPHBhdGggZD0iTTEzLjI3NTQgMjEuMDY5MUwyLjAwMjIzIDkuNzk1OTMiIHN0cm9rZT0iIzNFNkFBQyIgc3Ryb2tlLXdpZHRoPSIyLjk2NjA4IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPHBhdGggZD0iTTE3LjA3NzEgMTcuMTA1NUw1LjgwMzk4IDUuODMyMyIgc3Ryb2tlPSIjRkFCOTYxIiBzdHJva2Utd2lkdGg9IjIuOTY2MDgiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cGF0aCBkPSJNMTMuMjc1NCAxLjkzMDkxTDIuMDAyMjMgMTMuMjA0MSIgc3Ryb2tlPSIjRTc0QTRBIiBzdHJva2Utd2lkdGg9IjIuOTY2MDgiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cGF0aCBkPSJNMjEuMTM5NiA5Ljc5NTlMOS44NjY0OCAyMS4wNjkxIiBzdHJva2U9IiMzRTZBQUMiIHN0cm9rZS13aWR0aD0iMi45NjYwOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxwYXRoIGQ9Ik0xNy4xNzU4IDUuOTk0NjNMNS45MDI2MiAxNy4yNjc4IiBzdHJva2U9IiNGQUI5NjEiIHN0cm9rZS13aWR0aD0iMi45NjYwOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPgo=';

    const base64CraneIcon =
      // eslint-disable-next-line max-len
      'data:image/png;base64,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';

    const injected = injectedModule();
    const walletConnect = walletConnectModule();
    const magic = magicModule({
      apiKey: environment.MAGIC_API_KEY,
    });

    const wallets = [injected, walletConnect, magic];

    const chains = [
      {
        id: 1,
        token: 'ETH',
        label: 'Ethereum Mainnet',
        rpcUrl: `https://mainnet.infura.io/v3/${environment.INFURA_ID}`,
      },
      // {
      //   id: 137,
      //   token: 'MATIC',
      //   label: 'Matic Mainnet',
      //   rpcUrl: 'https://matic-mainnet.chainstacklabs.com',
      // },
    ];

    const appMetadata = {
      name: 'Tap Auth Demo Blocknative',
      icon: '../../../assets/icon/icon-logo.svg',
      logo: '../../../assets/icon/icon-logo.svg',
      description: 'Connect to Tap Auth Demo',
      recommendedInjectedWallets: [
        { name: 'MetaMask', url: 'https://metamask.io' },
        { name: 'WalletConnect', url: 'https://walletconnect.com/' },
      ],
      agreement: {
        version: '1.0.0',
        termsUrl: 'https://www.blocknative.com/terms-conditions',
        privacyUrl: 'https://www.blocknative.com/privacy-policy',
      },
    };

    this.initWeb3Onboard = Onboard({
      wallets,
      chains,
      appMetadata,
      accountCenter: {
        desktop: {
          enabled: true,
        },
        mobile: {
          enabled: true,
        },
      },
    });

    const { unsubscribe } = this.initWeb3Onboard.state
      .select()
      .pipe(
        distinctUntilChanged((prev: any, curr: any) => {
          if (prev.wallets.length === curr.wallets.length) {
            return true;
          } else {
            return false;
          }
        })
      )
      .subscribe((update) => {
        console.log('State Update:', update);
        this.updateConnectedWallets(update.wallets);
        console.log('Connected Wallets:', this.connectedWallets);
        this.updateUserDataEmitter$.next('');

        if (update.wallets.length === 0) {
          this.logOut();
        }
      });

    this.unsubscribeRef = unsubscribe;
  }

  async login() {
    // this.connectedWallets = await this.initWeb3Onboard.connectWallet();
    await this.initWeb3Onboard.connectWallet();

    if (this.connectedWallets.length > 0) {
      // console.log('Login:', this.connectedWallets);
      this.isAuthenticated$.next(true);
      this.isProfileComplete$.next(true);
      this.router.navigate(['']);
    }
  }

  async connectAnotherWallet() {
    // this.connectedWallets = await this.initWeb3Onboard.connectWallet();
    await this.initWeb3Onboard.connectWallet();
    // console.log('Connected Wallets:', this.connectedWallets);
  }

  async disconnectWallet() {}

  async logOut() {
    try {
      // await this.initWeb3Onboard.resetWalletState();

      const currentlyConnectedWallets =
        this.initWeb3Onboard.state.get().wallets;
      const labelsArr = [];

      if (currentlyConnectedWallets.length > 0) {
        for (const wallet of currentlyConnectedWallets) {
          labelsArr.push(wallet.label);
        }
      }

      console.log('labelsArr:', labelsArr);
      const labelsToDisconnect = new Set(labelsArr);
      console.log('labelsSet:', labelsToDisconnect);

      for (const walletLabel of labelsToDisconnect) {
        console.log('Disconnecting ' + walletLabel);
        await this.initWeb3Onboard.disconnectWallet({ label: walletLabel });
        console.log('Disconnected ' + walletLabel);
      }

      this.isAuthenticated$.next(false);
      this.isProfileComplete$.next(false);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error in logOut:', error);
    }
  }

  updateConnectedWallets(walletsArr) {
    const arr = [];
    if (walletsArr.length > 0) {
      for (const wallet of walletsArr) {
        const accountsArr = wallet.accounts;

        if (accountsArr.length > 0) {
          for (const account of accountsArr) {
            arr.push({
              walletType: wallet.label,
              walletAddress: account.address,
            });
          }
        }
      }
    }

    this.connectedWallets = arr;
  }

  getConnectedWallets() {
    return this.connectedWallets;
  }

  // if profile is complete, then go to home page
  // if profile is incomplete, then go to setup-profile page
  sampleLogin() {
    this.isAuthenticated$.next(true);
    this.router.navigate(['setup-profile']);
  }

  sampleLogOut() {
    this.isAuthenticated$.next(false);
    this.isProfileComplete$.next(false);
    this.router.navigate(['login']);
  }

  signUp() {
    this.isAuthenticated$.next(true);
    this.router.navigate(['']);
  }

  isUserHandleUnique(handle: string) {
    // console.log('Checking input: ' + handle);

    return new Promise((resolve) =>
      setTimeout(() => {
        if (handle === 'sample01') {
          resolve(false);
        } else {
          resolve(true);
        }
      }, 1500)
    );

    // if (handle === 'sample01') {
    //   return false;
    // } else {
    //   return true;
    // }
  }

  submitUserHandleForm() {
    this.isProfileComplete$.next(true);
    this.router.navigate(['']);
  }
}
