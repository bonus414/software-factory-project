declare const textFormat: unique symbol;

export type Markdown = string & { readonly [textFormat]: "Markdown" };
export type PlainText = string & { readonly [textFormat]: "PlainText" };

// These mark format, not trust: Markdown still requires safe rendering.
export function markdown(text: string): Markdown {
  return text as Markdown;
}

export function plainText(text: string): PlainText {
  return text as PlainText;
}
