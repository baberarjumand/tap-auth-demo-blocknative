import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../shared/services/auth.service';
import { UtilService } from '../shared/services/util.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  connectedWallets = [];
  updateUserDataSub: Subscription;
  isLoading = false;

  constructor(
    private authService: AuthService,
    private util: UtilService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    await this.fetchUserData();
    this.updateUserDataSub = this.authService.updateUserDataEmitter$.subscribe(
      async (val) => {
        this.fetchUserData();
      }
    );
  }

  ngOnDestroy(): void {
    if (this.updateUserDataSub) {
      this.updateUserDataSub.unsubscribe();
    }
  }

  logOut() {
    // this.authService.sampleLogOut();
    this.authService.logOut();
  }

  async fetchUserData() {
    try {
      await this.util.showLoading();
      this.isLoading = true;
      this.connectedWallets = this.authService.getConnectedWallets();
      console.log('Connected Wallets in HomePage:', this.connectedWallets);
    } catch (error) {
      console.log('Error in home fetchUserData:', error);
    } finally {
      await this.util.hideLoading();
      this.isLoading = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  connectAnotherWallet() {
    this.authService.connectAnotherWallet();
  }
}
