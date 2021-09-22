import {JSDOM} from 'jsdom';
import fs from 'fs';
import serialize from 'w3c-xmlserializer';

/**
 * 独自ToC
 */
export default class OwnedToC {
    private dom:JSDOM|undefined;

    /**
     * 独自ToCファイルを読み込んでオブジェクトを生成
     * @param {string} entryPath 独自ToCファイルのパス
     * @return {OwnedToC} OwnedToCオブジェクト
     */
    public static async fromFile(entryPath:string):Promise<OwnedToC> {
      if ( ! fs.existsSync(entryPath) ) {
        throw new Error('目次ファイルが存在しません');
      }
      const toc = new OwnedToC();
      toc.dom = await JSDOM.fromFile(entryPath);
      return toc;
    }

    /**
     * XHTMLシリアライズ
     * @return {string} シリアライズされた文字列
     */
    public serialize():string {
      if ( ! this.dom ) {
        return '';
      }
      const lang = 'ja';
      const docElm = this.dom.window.document.documentElement;
      const htmlAttrs = docElm.getAttributeNames();
      console.log('document', htmlAttrs);
      if ( htmlAttrs.indexOf('xmlns') !== -1 ) {
        // ファイル書き出しの際にw3c-xmlserializerによって付与されるため削除
        docElm.removeAttribute('xmlns');
      }
      if ( htmlAttrs.indexOf('xmlns:epub') == -1 ) {
        docElm.setAttribute('xmlns:epub', 'http://www.idpf.org/2007/ops');
      }
      if ( htmlAttrs.indexOf('xmlns:lang') == -1 ) {
        docElm.setAttribute('xmlns:lang', lang);
      }
      if ( htmlAttrs.indexOf('lang') == -1 ) {
        docElm.setAttribute('lang', lang);
      }
      this.setNavAttribute();
      const dtd = '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html>';
      return dtd+serialize(this.dom.window.document);
    }

    /**
     * 書き出し
     * @param {string} filePath ファイルパス
     */
    public write(filePath:string) {
      if ( ! this.dom ) {
        return;
      }
      // xhtmlとしてシリアライズしてテンポラリファイルに書き出す
      fs.writeFileSync(filePath, this.serialize());
    }

    /**
     * ToC内のリンク先をEPUB内部ファイル名に置換
     * @param {string} url  元ファイルパス
     * @param {string} filename 内部ファイル名
     */
    public replaceHref(url: string, filename: string) {
      if ( ! this.dom ) {
        return;
      }
      const elm = this.dom.window.document.querySelector(`a[href="${url}"]`);
      if (elm) {
        elm.setAttribute('href', filename);
      }
    }

    /**
     * nav要素にepub:type="toc"属性を設定する
     * @private
     */
    private setNavAttribute() {
      const nav = this.dom?.window.document.querySelector('nav');
      if (nav) {
        nav.setAttribute('epub:type', 'toc');
      }
    }
}
