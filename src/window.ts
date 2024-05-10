import * as Splashscreen from "@trodi/electron-splashscreen";
import {BrowserView, BrowserWindow, Menu, app, dialog, shell} from "electron";
import path from "path";

import {isAllowedUrl, isUrl} from "./libs/url";

/**
 * ブラウザウィンドウ
 */
export class Browser {
  private window!: BrowserWindow;
  private view!: BrowserView;

  /**
   * 拡大率(標準は16倍)
   * */
  private zoomLevel = 16;

  /** 最小解像度 */
  private gameWindowSize = {
    width: 71 * this.zoomLevel,
    height: 40 * this.zoomLevel
  };

  /** タイトルバーの高さ */
  private titlebarHeight = 24;

  /**
   * コミュ並列観覧モードの補正
   * 無効=0, 水平=1, 垂直=2
   */
  private subScreenMode = 0;

  /**
   * メインウィンドウ設定を取得
   * @returns 設定
   */
  private getWindowOption = (): Electron.BrowserWindowConstructorOptions => {
    const windowSize = {
      ...this.gameWindowSize,
      height: this.gameWindowSize.height + this.titlebarHeight
    };

    return {
      title: "mayuzu",
      ...windowSize,
      minWidth: windowSize.width / this.zoomLevel,
      minHeight: windowSize.height / this.zoomLevel,
      center: true,
      frame: false,
      show: false,
      resizable: true,
      webPreferences: {
        // devTools: false,
        preload: path.join(__dirname, "preload.js")
      }
    };
  };

  /**
   * ビューをリサイズ
   * @param bounds 画面サイズ
   */
  private resizeView = (bounds?: Electron.Rectangle) => {
    // 指定なしの場合、現在のサイズを取得
    const {width, height} = bounds || this.window.getBounds();

    // タイトルバーの高さを考慮
    this.view.setBounds({
      x: 0,
      y: this.titlebarHeight,
      width,
      height: height - this.titlebarHeight
    });
  };

  /**
   * ウィンドウをリサイズ
   */
  private resizeWindow = () => {
    // 拡大率の制限
    if (this.zoomLevel <= 0) {
      this.zoomLevel = 7;
      return;
    }

    // 解像度の変数を更新
    this.gameWindowSize = {
      width: 71 * this.zoomLevel * (this.subScreenMode == 1 ? 2 : 1), // 水平モード(1)だったら水平に広げる
      height: 40 * this.zoomLevel * (this.subScreenMode == 2 ? 2 : 1) // 垂直モード(1)だったら垂直に広げる
    };

    this.window.setBounds({
      width: this.gameWindowSize.width,
      height: this.gameWindowSize.height + this.titlebarHeight
    });

    this.resizeView();
  }

  /**
   * ウィンドウを作成
   */
  public create = () => {
    // スプラッシュスクリーン
    this.window = Splashscreen.initSplashScreen({
      windowOpts: this.getWindowOption(),
      templateUrl: `${__dirname}/images/splash.svg`,
      splashScreenOpts: {
        width: 520,
        height: 264,
        center: true,
        transparent: true
      }
    });

    // ビューの設定
    this.view = new BrowserView();
    this.showView();
    this.reloadView();
    this.setViewEventHandlers();

    // NOTE: this.view.setAutoResize() を使わなかった理由があったはずだけど忘れた...

    // ウィンドウの設定
    this.window.loadFile("./build/index.html").then();
    this.setWindowEventHandlers();

    // 開発者ツール
    // this.window.webContents.openDevTools();
    this.view.webContents.openDevTools();

    // メニューバーを無効
    Menu.setApplicationMenu(null);

    // 多重起動を防止
    if (!app.requestSingleInstanceLock()) {
      app.quit();
    }
  };

  /**
   * ウィンドウのイベントハンドラを設定
   */
  private setWindowEventHandlers = () => {
    // リサイズ操作にビューのサイズを追従させる
    this.window.on("will-resize", (_e, bounds) => {
      this.resizeView(bounds);
    });

    // 最小化解除時にビューにフォーカスを当てる
    this.window.on("restore", () => {
      this.focusView();
    });

    // ウィンドウにフォーカスが当たったらビューにフォーカスを当てる
    this.window.on("focus", () => {
      this.focusView();
    });
  };

  /**
   * ビューのイベントハンドラを設定
   */
  private setViewEventHandlers = () => {
    const openUrl = (url: string) => {
      // 正しいURLなら標準ブラウザで表示
      if (isUrl(url)) {
        shell.openExternal(url);
        return;
      }

      this.showMessageDialog({
        type: "error",
        buttons: ["了解"],
        defaultId: 0,
        title: "エラー",
        message: "ポップアップをブロックしました",
        detail:
          "画面が変わらない場合、上部のリロードボタンから再読み込みを行ってください"
      });
    };

    // 許可されているリンクなら遷移を許可、それ以外は標準ブラウザで表示
    this.view.webContents.on("will-navigate", (e, url) => {
      if (isAllowedUrl(url)) return;

      openUrl(url);
      e.preventDefault();
    });

    this.view.webContents.setWindowOpenHandler(({url}) => {
      if (isAllowedUrl(url)) return {action: "allow"};

      openUrl(url);
      return {action: "deny"};
    });
  };

  /**
   * ビューにフォーカスを当てる
   */
  public focusView = () => {
    this.view.webContents.focus();
    this.window.flashFrame(false);

    /**
     * NOTE: ここでリサイズし直すことで、Windows環境でのスナップ操作時に
     * ウィンドウとビューのサイズが合わなくなることを暫定的に防止。
     * もし、スナップ操作時に何らかのイベントが発生するようになったらこんなことしなくていい…
     * （また、ダブルクリックでの拡縮には無力）
     */
    this.resizeView();
  };

  /**
   * ビューを表示
   */
  public showView = () => {
    this.window.setBrowserView(this.view);
    this.resizeView();
  };

  /**
   * ビューを非表示
   */
  public hideView = () => {
    this.window.removeBrowserView(this.view);
  };

  /**
   * 閉じる
   */
  public close = () => {
    this.window.close();
  };

  /**
   * 最小化
   */
  public minimize = () => {
    this.window.minimize();
  };

  /**
   * 最大化切り替え
   */
  public maximize = () => {
    const nextState = !this.window.isFullScreen();
    this.window.setFullScreen(nextState);

    // ビューをリサイズ
    // NOTE: 反映までに遅延があるので少し遅れて実行する
    setTimeout(() => this.resizeView(), 50);
  };

  /**
   * 最前面に固定切り替え
   */
  public pinned = () => {
    const nextState = !this.isPinned();
    this.window.setAlwaysOnTop(nextState, "screen-saver");
  };

  /**
   * 最前面に固定されているか
   * @returns 状態
   */
  public isPinned = (): boolean => {
    return this.window.isAlwaysOnTop();
  };

  /**
   * ウィンドウを縮小
   */
  public zoomOut = () => {
    this.zoomLevel--;
    this.resizeWindow();
  }

  /**
   * ウィンドウを拡大
   */
  public zoomIn = () => {
    this.zoomLevel++;
    this.resizeWindow();
  }

  /**
   * コミュ並列観覧モードの切替
   */
  public cycleSubScreenMode() {
    this.subScreenMode += 1;
    if (this.subScreenMode == 3) this.subScreenMode = 0;
    console.log(this.subScreenMode)
    this.resizeWindow();
  }

  /**
   * ミュート切り替え
   */
  public muted = () => {
    const nextState = !this.view.webContents.isAudioMuted();
    this.view.webContents.setAudioMuted(nextState);
  };

  /**
   * 再読み込み
   */
  public reloadView = () => {
    this.view.webContents.loadURL("https://shinycolors.enza.fun").then();
  };

  /**
   * スクリーンショットを撮影
   * @returns 生の画像データ
   */
  public capture = (): Promise<Electron.NativeImage> | undefined => {
    return this.view?.webContents.capturePage();
  };

  /**
   * メッセージダイアログを表示
   * @param options オプション
   * @returns 結果
   */
  public showMessageDialog = (
    options: Electron.MessageBoxSyncOptions
  ): number => {
    return dialog.showMessageBoxSync(this.window, options);
  };

  /**
   * ファイルダイアログを表示
   * @param options オプション
   * @returns 結果
   */
  public showFileDialog = (
    options: Electron.OpenDialogSyncOptions
  ): string[] | undefined => {
    return dialog.showOpenDialogSync(this.window, options);
  };

}
