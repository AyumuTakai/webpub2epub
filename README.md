# webpub2epub - WebPub to EPUB converter

vivliostyle-cliで出力したWebPub形式のデータをEPUB形式の電子文書に変換する

## インストール

    yarn global add https://github.com/AyumuTakai/webpub2epub.git

## 使いかた

    webpub2epub -o 出力ファイル(output.epub) -p publication.jsonのパス WebPubディレクトリ

または

    w2e -o 出力ファイル名 -p publication.jsonのパス WebPubディレクトリ

### オプション

* '-o 出力ファイルのパス' : デフォルト output.epub
* '-p publication.jsonのパス' : デフォルト カレントディレクトリ/publication.json
* '--ltr' : ページめくりの方向を左から右へ(左綴じ/横書き/デフォルト)
* '--rtl' : ページめくりの方向を右から左へ(右綴じ/縦書き)
* '--help' : ヘルプ表示

## 既知の問題

* 目次にスタイルが適用されない
* EPUB3.0相当? なので対応していないHTMLタグが多い(XHTML1.1の範囲なら大丈夫かも?)
* テストが無い

## License

(The MIT License)

Copyright (c) 2021 Ayumu Takai ;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
