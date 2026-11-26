// page-flip 2.0.7 không kèm file kiểu → khai báo phần đang dùng.
declare module 'page-flip' {
  export type FlipState = 'user_fold' | 'fold_corner' | 'flipping' | 'read';

  export interface FlipSetting {
    startPage: number;
    size: 'fixed' | 'stretch';
    width: number;
    height: number;
    drawShadow: boolean;
    flippingTime: number;
    usePortrait: boolean;
    autoSize: boolean;
    maxShadowOpacity: number;
    showCover: boolean;
    mobileScrollSupport: boolean;
    useMouseEvents: boolean;
    showPageCorners: boolean;
  }

  export class PageFlip {
    constructor(block: HTMLElement, setting: Partial<FlipSetting>);
    loadFromHTML(items: HTMLElement[]): void;
    on(event: 'flip', cb: (e: { data: number }) => void): this;
    on(event: 'changeState', cb: (e: { data: FlipState }) => void): this;
    flipNext(corner?: 'top' | 'bottom'): void;
    flipPrev(corner?: 'top' | 'bottom'): void;
    getCurrentPageIndex(): number;
    getState(): FlipState;
    /** Xoá luôn phần tử gốc khỏi DOM. */
    destroy(): void;
  }
}
