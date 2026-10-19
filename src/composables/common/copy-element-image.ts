import { toBlob, getFontEmbedCSS } from 'html-to-image';

type FontFaceRule = {
  css: string,
  // 空の場合は全ての文字が対象
  unicodeRanges: [start: number, end: number][],
};

type FontSource = {
  rules: FontFaceRule[],
  mdiFontFaceCSS: string,
};

let fontSourcePromise: Promise<FontSource> | undefined;

const parseUnicodeRanges = (fontFaceCSS: string): FontFaceRule['unicodeRanges'] => {
  const unicodeRange = fontFaceCSS.match(/unicode-range:\s*([^;}]+)/)?.[1] ?? '';
  return Array.from(unicodeRange.matchAll(/U\+([0-9a-f?]+)(?:-([0-9a-f]+))?/gi), ([, start, end]) =>
    // NOTE: "U+4??"のようなワイルドカードは範囲に展開する
    [
      parseInt(start.replaceAll('?', '0'), 16),
      parseInt(end ?? start.replaceAll('?', 'F'), 16),
    ]
  );
};

// NOTE: html-to-imageはfetchでフォントを埋め込むが、パッケージ版(file://)ではmdiフォントをfetchできない。
// また、fontEmbedCSSを指定すると自動のフォント収集が無効になる。そのためmdiはdata URLで直接埋め込み、他のWebフォントは自動収集の結果と合わせる
const buildFontSource = async (element: HTMLElement): Promise<FontSource> => {
  // NOTE: パッケージサイズが膨らまないよう、使用時に遅延読み込みする
  const { default: mdiFontDataUrl } = await import('@mdi/font/fonts/materialdesignicons-webfont.woff2?inline');
  const webFontCSS = await getFontEmbedCSS(element, { preferredFontFormat: 'woff2' });

  return {
    rules: (webFontCSS.match(/@font-face\s*\{[^}]*\}/g) ?? [])
      .map(css => ({ css, unicodeRanges: parseUnicodeRanges(css) })),
    mdiFontFaceCSS: `
@font-face {
  font-family: "Material Design Icons";
  src: url("${mdiFontDataUrl}") format("woff2");
  font-weight: normal;
  font-style: normal;
}`,
  };
};

// NOTE: フォントの取得は重いため一度だけ行う。結果は最初に渡した要素で使われているフォントで決まるため、
// 他の要素と共通のフォントを使う場合にのみ流用できる
const getCachedFontSource = (element: HTMLElement) => {
  fontSourcePromise ??= buildFontSource(element).catch(e => {
    fontSourcePromise = undefined;
    throw e;
  });
  return fontSourcePromise;
};

// NOTE: Noto Sans JPのように文字範囲ごとに分割されたフォントは全て埋め込むと数MBになるため、要素に表示されている文字に必要なものだけを埋め込む
const getFontEmbedCSSFor = async (element: HTMLElement) => {
  const { rules, mdiFontFaceCSS } = await getCachedFontSource(element);
  const codePoints = Array.from(new Set(element.textContent ?? ''), char => char.codePointAt(0)!);

  const neededRules = rules.filter(({ unicodeRanges }) =>
    unicodeRanges.length <= 0
    || codePoints.some(codePoint => unicodeRanges.some(([start, end]) => start <= codePoint && codePoint <= end))
  );
  return neededRules.map(({ css }) => css).join('\n') + mdiFontFaceCSS;
};

// 除外する要素が占めていた幅(要素の幅 + 親のgap)の合計
const getExcludedWidth = (element: HTMLElement, excludeClass: string) =>
  Array.from(element.querySelectorAll<HTMLElement>(`.${excludeClass}`))
    .reduce((sum, excluded) => {
      const parent = excluded.parentElement;
      const gap = parent ? parseFloat(getComputedStyle(parent).columnGap) || 0 : 0;
      return sum + excluded.getBoundingClientRect().width + gap;
    }, 0);

/**
 * 要素を見た目そのままの画像としてクリップボードにコピーする
 * @param excludeClass このクラスを持つ要素は画像から除外する。要素の右端に並んでいる前提で、除外した幅の分だけ画像の幅を縮める
 */
export const copyElementImage = async (element: HTMLElement, excludeClass: string) => {
  // NOTE: 画像化時にレイアウトがpx固定で複製されるため、除外しても余白が残る。複製したルート要素ごと幅を縮めて詰める
  const width = Math.ceil(element.getBoundingClientRect().width - getExcludedWidth(element, excludeClass));

  const blobPromise = getFontEmbedCSSFor(element)
    .then(fontEmbedCSS => toBlob(element, {
      fontEmbedCSS,
      width,
      filter: node => !(node instanceof HTMLElement && node.classList.contains(excludeClass)),
    }))
    .then(blob => {
      if (!blob) {
        throw new Error('画像の生成に失敗しました');
      }
      return blob;
    });
  // NOTE: writeが先に失敗した場合に、blobPromiseの拒否が未処理にならないようにする
  blobPromise.catch(() => {});

  // NOTE: 画像生成の完了を待たずにwriteを呼ぶ。生成中に別ウィンドウへフォーカスが移ると、完了後のwriteは失敗するため
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blobPromise })]);
};
