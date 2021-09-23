"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cac_1 = __importDefault(require("cac"));
const fs_1 = __importDefault(require("fs"));
const upath_1 = __importDefault(require("upath"));
const process_1 = __importDefault(require("process"));
const url_1 = __importDefault(require("url"));
const jsdom_1 = require("jsdom");
const json5_1 = __importDefault(require("json5"));
const tmp_1 = __importDefault(require("tmp"));
const OwnedToC_1 = __importDefault(require("./OwnedToC"));
const sass_1 = __importDefault(require("sass"));
const Epub = require('epub-gen');
const VERSION = '0.0.2';
/**
 * WebPubの設定
 */
class WebPubConf {
    /**
     * コンストラクタ
     */
    constructor() {
    }
    /**
     * ファイルを読み込んでWebPubConfオブジェクトを返す
     * @param {string} webpubDir WebPubディレクトリのパス
     * @return {WebPubConf} WebPubConfオブジェクト
     */
    static fromFile(webpubDir) {
        const conf = new WebPubConf();
        conf.parsePublicationJson(webpubDir);
        return conf;
    }
    /**
     * JSONファイルを読み込んでオブジェクト化する
     * @param {string} dir JSONファイルのあるディレクトリのパス
     * @param {string} filename JSONファイルのファイル名
     * @return {PublicationJSON} WebPubオブジェクト
     * @private
     */
    loadJSON(dir, filename) {
        const publicationPath = upath_1.default.join(dir, filename);
        console.log('publication.json:', publicationPath);
        if (!fs_1.default.existsSync(publicationPath)) {
            throw new Error('WebPub設定ファイルが存在しません :' + publicationPath);
        }
        const data = fs_1.default.readFileSync(publicationPath);
        const publication = json5_1.default.parse(data.toString());
        return publication;
    }
    /**
     * JSONファイルを読み込んで値をプロパティにセットする
     * @param {string} dir WebPubフォルダ
     * @param {string} filename ファイル名(publication.json)
     */
    parsePublicationJson(dir, filename = 'publication.json') {
        const publication = this.loadJSON(dir, filename);
        this._author = publication.author;
        this._publisher = publication.publisher;
        this.context = publication.context;
        this.type = publication.type;
        this.conformsTo = publication.conformsTo;
        this.inLanguage = publication.inLanguage;
        this.dateModified = publication.dateModified;
        this.name = publication.name;
        this._title = publication.title;
        this.readingOrder = publication.readingOrder;
        this.resources = publication.resources;
        this.links = publication.links;
    }
    /**
     * 全体のタイトル
     * publication.jsonにtitleプロパティが存在しなければ最初の原稿のtitleプロパティ
     * @return {string} タイトル
     */
    get title() {
        if (this._title) {
            return this._title;
        }
        else {
            const ro = this.readingOrder;
            return (ro && ro[0] && ro[0].title) ?? '';
        }
    }
    /**
     * 著者
     * publication.jsonにtitleプロパティが存在しなければ最初の原稿のauthorプロパティ
     * TODO: 全ての原稿の著者の配列にしても良いか?
     * @return {string} 著者
     */
    get author() {
        if (this._author) {
            return this._author;
        }
        else {
            const ro = this.readingOrder;
            return (ro && ro[0] && ro[0].author) ?? '';
        }
    }
    /**
     * 出版社
     * TODO: vivliostyle-cliのvivliostyle.conf.jsでは項目が無いが、publication.jsonにはある
     * @return {string} 出版社
     */
    get publisher() {
        if (this._publisher) {
            return this._publisher;
        }
        else {
            return '';
        }
    }
    /**
     * カバー画像
     * @return {string|null} カバー画像のURL
     */
    get cover() {
        // TODO: カバー画像対応
        return null;
    }
}
/**
 * 変換器
 */
class WebPub2Epub {
    /**
     * コンストラクタ
     */
    constructor() {
        this.cwd = '';
        this.webpubDir = '';
        this.webpubConf = null;
        this.cwd = process_1.default.cwd();
    }
    /**
     * WebPubディレクトリの絶対パスを返す
     * @param {string | undefined} webpub WebPubディレクトリ(相対パスまたは絶対パス)
     * @return {string} WebPubディレクトリの絶対パス
     * @private
     */
    normalizeWebpubDir(webpub) {
        if (webpub != undefined && !upath_1.default.isAbsolute(webpub)) {
            webpub = upath_1.default.join(this.cwd, webpub);
        }
        if (webpub == undefined || webpub.length == 0) {
            webpub = this.cwd;
        }
        if (!fs_1.default.existsSync(webpub)) {
            throw new Error('指定されたWebPubディレクトリが存在しません: ' + webpub);
        }
        console.log('webpub dir:', webpub);
        return webpub;
    }
    /**
     * EPUB出力ファイルパス
     * @param {object} cliOptions CLI引数
     * @return {string} EPUBを出力するファイルの絶対パス
     * @private
     */
    normalizeOutputPath(cliOptions) {
        if (cliOptions.output) {
            if (upath_1.default.isAbsolute(cliOptions.output)) {
                return cliOptions.output;
            }
            else {
                return upath_1.default.join(this.cwd, cliOptions.output);
            }
        }
        else {
            return upath_1.default.join(this.cwd, 'output.epub');
        }
    }
    /**
     * WebPubディレクトリを変換してEPUBファイルを出力する
     * @param {string} webpub WebPubディレクトリのパス
     * @param {any} cliOptions コマンドラインオプション
     */
    async export(webpub, cliOptions) {
        this.webpubDir = this.normalizeWebpubDir(webpub);
        this.webpubConf = WebPubConf.fromFile(this.webpubDir);
        if (this.webpubConf === null) {
            throw new Error('本文が存在しません');
        }
        const outputFile = this.normalizeOutputPath(cliOptions);
        console.log('output filepath', outputFile);
        const { contents, css, tocEntry } = await this.webPubEntry2content(this.webpubConf, '');
        console.log('tocHtml', tocEntry);
        const customHtmlTocTemplatePath = tocEntry ?? undefined;
        const pageProgressionDirection = cliOptions.rtl ? 'rtl' : 'ltr';
        const epubOptions = {
            title: this.webpubConf.title,
            author: this.webpubConf.author,
            publisher: this.webpubConf.publisher,
            cover: this.webpubConf.cover,
            css: css,
            content: contents,
            version: 3,
            customHtmlTocTemplatePath,
            pageProgressionDirection, // optional 右綴じ(default):ltr 左綴じ:rtl
            // TODO: 以下の項目も指定できるようにする
            // fonts: ['/path/to/font.ttf'],
            // lang: 'en',
            // tocTitle: 'Table Of Contents',
            // appendChapterTitles: false,
            // customOpfTemplatePath: ,
            // customNcxTocTemplatePath: ,
        };
        // console.log(epubOptions);
        new Epub(epubOptions, outputFile);
        // テンポラリファイルを作っていたら削除
        tmp_1.default.setGracefulCleanup();
    }
    /**
     * 画像のsrcを絶対パスに変換する
     * epub-genでは相対パスに対応していないため
     * @param {any} dom DOMオブジェクト
     * @return {any} DOMオブジェクト
     * @private
     */
    absoluteImageSource(dom) {
        const images = dom.window.document.querySelectorAll('img');
        for (const image of images) {
            // jsdomによって絶対パスに変換済みのsrcをepub-genのためにsrc属性の値として設定する
            image.src = image.src;
        }
        return dom;
    }
    /**
     * 原稿内のcssへのlinkからCSSの内容を結合して返す
     * TODO: 原稿毎に異なるCSSが指定されている場合の処理
     * @param {string} bodyClass body要素に設定するクラス名
     * @param {JSDOM} dom DOMオブジェクト
     * @param {string} css CSS文字列
     * @return {string} CSS文字列
     * @private
     */
    mergeLinkedStyle(bodyClass, dom) {
        let css = '';
        const document = dom.window.document;
        const body = document.querySelector('body');
        if (!body) {
            throw new Error('body要素が見つかりません');
        }
        body.setAttribute('id', bodyClass);
        // console.log('body', document.body.getAttribute('id'));
        const cssList = document.querySelectorAll('link[rel=stylesheet]');
        for (const link of cssList) {
            // @ts-ignore
            const href = link.href; // link.getAttribute('href');
            console.log('link href : ', href);
            if (!href) {
                continue;
            }
            const cssPath = url_1.default.fileURLToPath(href);
            if (!fs_1.default.existsSync(cssPath)) {
                throw new Error('CSSファイルが存在しません : ' + cssPath);
            }
            const src = fs_1.default.readFileSync(cssPath).toString();
            css += '\n' + src;
        }
        css = `html#${bodyClass} { ${css} }\n\n`;
        return css;
    }
    /**
     * publication.json内のreadingOrderプロパティをepub-genのcontentに変換して返す
     * @param {WebPubConf} pub WebPubの設定オブジェクト
     * @param {string} css CSS文字列
     * @return {Promise<any>}
     * @private
     */
    async webPubEntry2content(pub, css) {
        const contents = [];
        let tocEntry = null;
        if (pub.readingOrder) {
            let no = 0;
            for (const entry of pub.readingOrder) {
                console.log('Entry url : ', entry.url);
                const entryPath = upath_1.default.join(this.webpubDir, entry.url);
                if (!fs_1.default.existsSync(entryPath)) {
                    throw new Error('原稿ファイルが存在しません : ' + entryPath);
                }
                const dom = await jsdom_1.JSDOM.fromFile(entryPath);
                const id = 'EPUB_' + this.contentFilename(entry, no);
                css += this.mergeLinkedStyle(id, dom);
                this.absoluteImageSource(dom);
                const data = dom.serialize();
                if (entry.rel === 'contents') {
                    // 自前ToCファイル
                    console.log('toc : ', entryPath);
                    this.toc = await OwnedToC_1.default.fromFile(entryPath);
                    continue;
                }
                // console.log('filename', this.contentFilename(entry, no));
                const content = {
                    title: entry.title,
                    author: pub.author,
                    data: data, // required
                    // excludeFromToc: false, // optional
                    // beforeToc: undefined, // optional
                    // filename: undefined // optional
                };
                if (this.toc && entry.url) {
                    this.toc.replaceHref(entry.url, this.contentFilename(entry, no) + '.xhtml');
                }
                contents.push(content);
                no++;
            }
        }
        if (this.toc) {
            const tocFile = tmp_1.default.fileSync();
            tocEntry = tocFile.name;
            this.toc.write(tocEntry);
        }
        // fs.writeFileSync('test.scss', css);
        const rendered = sass_1.default.renderSync({ data: css });
        // console.log(rendered);
        css = rendered.css.toString();
        // SCSSで処理した結果発生する html#id html { } のようなセレクタを修正する
        css = css.replace(/(html#\S+)\s+html/g, '$1');
        return { contents, css, tocEntry };
    }
    /**
     * epub-gen 内部で使用されるコンテンツのファイル名
     * 出力されるEPUBのToCではこのファイル名をhrefで参照する
     * @param {any} entry WebPubのコンテンツ
     * @param {number} no ToCのインデックス(0始まり)
     * @return {string} 拡張子を含まないファイル名
     * @private
     */
    contentFilename(entry, no) {
        if (entry.title) {
            const title = entry.title.toLowerCase().replaceAll(' ', '-').replaceAll(/[^0-9A-Za-z-_:.]+/gu, '');
            console.log('title:', title);
            return `${no}_${title}`;
        }
        else {
            return `${no}_no-title`;
        }
    }
}
/**
 * コマンドライン処理
 */
module.exports = () => {
    const cli = (0, cac_1.default)();
    cli
        .command('[webpub]', 'Source webpub directory')
        .option('-o, --output <filepath>', 'output filepath', { default: 'output.epub' })
        .option('--rtl', 'page progression direction right to left', { default: false })
        .option('--ltr', 'page progression direction left to right', { default: true })
        .action((webpub, options) => {
        const converter = new WebPub2Epub();
        converter.export(webpub, options)
            .then()
            .catch((err) => {
            console.error(err);
        });
    });
    cli.version(VERSION);
    cli.parse();
};
