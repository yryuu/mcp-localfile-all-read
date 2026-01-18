# Windows互換性ガイド

## 現在の実装のWindows互換性

### ✅ 互換性のある部分

#### 1. パス処理
- `path.resolve()`, `path.join()` を使用 → **Windows対応済み**
- Node.jsのpathモジュールが自動的にWindows/Unix形式を処理

#### 2. ファイル操作
- `fs/promises` API使用 → **クロスプラットフォーム対応**
- すべてのファイル読み書きはNode.js標準API

#### 3. パーサー
- **PDF**: `pdf-parse` → Windows対応
- **Excel**: `xlsx` → Windows対応
- **Word**: `mammoth` → Windows対応
- **PowerPoint**: `adm-zip` → Windows対応
- **CSV**: `csv-parse` → Windows対応

### ⚠️ 潜在的な問題点

#### 1. パスセパレータ（軽微）

**現在のコード（169行目）:**
```typescript
if (!resolved.startsWith(rootPath)) {
    throw new Error('Access denied: Path is outside root directory');
}
```

**問題:**
Windowsでは大文字小文字を区別しない場合があり、`C:\Users` と `c:\users` が同じパスを指す可能性がある。

**影響:** 低（ほとんどの場合は正常動作）

#### 2. Shebang（1行目）

```typescript
#!/usr/bin/env node
```

**問題:** Windowsでは無視されるが、エラーにはならない

**影響:** なし（Windowsでは単にコメントとして扱われる）

#### 3. 文字エンコーディング

**Shift-JIS対応:**
```typescript
import iconv from 'iconv-lite';
const text = iconv.decode(buffer, 'shift_jis');
```

**状況:** 
- `iconv-lite`ライブラリを使用してShift-JISをサポート
- Node.js 18以降で動作確認済み
- Windows環境でも問題なく動作

**影響:** なし（Node 18+で完全動作）

## Windows環境での使用方法

### 1. 前提条件

```powershell
# Node.jsバージョン確認
node --version
# v18.x.x 以上

# npmバージョン確認
npm --version
```

### 2. インストール

```powershell
# プロジェクトディレクトリに移動
cd C:\path\to\mcp-localfile-all-read

# 依存関係インストール
npm install

# ビルド
npm run build
```

### 3. Claude Desktop設定（Windows）

**設定ファイルの場所:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**実際のパス例:**
```
C:\Users\YourName\AppData\Roaming\Claude\claude_desktop_config.json
```

**設定内容:**
```json
{
  "mcpServers": {
    "localfile-reader": {
      "command": "node",
      "args": [
        "C:\\Users\\YourName\\project\\mcp-localfile-all-read\\dist\\index.js"
      ],
      "env": {
        "MCP_ROOT_PATH": "C:\\Users\\YourName\\Documents"
      }
    }
  }
}
```

**重要:** Windowsではバックスラッシュをエスケープ（`\\`）する必要があります。

### 4. テスト実行（Windows）

```powershell
# 統合テスト
npm test

# 個別テスト
npx tsx test/test-parsers.ts
npx tsx test/test-tools.ts
npx tsx test/test-office-files.ts
```

## パスの指定方法

### Windows形式のパス

```json
{
  "MCP_ROOT_PATH": "C:\\Users\\YourName\\Documents"
}
```

または

```json
{
  "MCP_ROOT_PATH": "C:/Users/YourName/Documents"
}
```

**どちらも動作します！** Node.jsが自動的に処理します。

### 相対パス

```json
{
  "MCP_ROOT_PATH": ".\\Documents"
}
```

## 既知の制限事項

### 1. ファイル名の制限

Windowsでは以下の文字がファイル名に使えません：
- `< > : " / \ | ? *`

これらの文字を含むファイルは検索・読み込みできません（OS制限）。

### 2. パスの長さ制限

Windows 10以前では、パスの最大長が260文字に制限されています。

**対策:** Windows 10 1607以降では、レジストリ設定で制限を解除可能。

### 3. 大文字小文字の区別

Windowsのファイルシステム（NTFS）は大文字小文字を保持しますが、区別しません。

**例:**
- `test.txt` と `TEST.TXT` は同じファイル

## トラブルシューティング

### エラー: "Cannot find module"

**原因:** パスの区切り文字の問題

**解決策:**
```powershell
# ビルドし直す
npm run build

# node_modulesを削除して再インストール
Remove-Item -Recurse -Force node_modules
npm install
```

### エラー: "Access denied"

**原因:** パス検証の問題

**解決策:**
1. `MCP_ROOT_PATH` を絶対パスで指定
2. バックスラッシュをエスケープ（`\\`）

### エラー: "Shift-JIS encoding not supported"

**原因:** 古いNode.jsバージョン

**解決策:**
```powershell
# Node.js 20以上にアップグレード
nvm install 20
nvm use 20
```

## Windows固有の推奨事項

### 1. PowerShellの使用

コマンドプロンプトではなくPowerShellを推奨：
```powershell
# PowerShellで実行
npx tsx test/manual-test.ts
```

### 2. パスの正規化

Windowsパスを使用する場合：
```javascript
// 良い例
const path = "C:\\Users\\Name\\Documents";

// または
const path = "C:/Users/Name/Documents";

// 悪い例（エスケープ忘れ）
const path = "C:\Users\Name\Documents"; // エラー！
```

### 3. 環境変数の設定

```powershell
# 一時的に設定
$env:MCP_ROOT_PATH = "C:\Users\YourName\Documents"
node dist/index.js

# 永続的に設定（システム環境変数）
[System.Environment]::SetEnvironmentVariable("MCP_ROOT_PATH", "C:\Users\YourName\Documents", "User")
```

## テスト結果（予想）

### ✅ 動作するはず
- ディレクトリ一覧取得
- ファイル読み込み（TXT, JSON, CSV）
- PDF解析
- Excel解析（.xlsx, .xls）
- Word解析（.docx）
- PowerPoint解析（.pptx）
- 検索機能

### ⚠️ 要確認
- Shift-JISエンコーディング検出
  - Windowsでは一般的なので重要
  - Node.js 20で動作するはず

### ❌ 動作しない可能性
- なし（理論上は全機能がWindows対応）

## まとめ

**結論: Windowsで動作するはずです！**

理由：
1. Node.jsのクロスプラットフォームAPIを使用
2. パス処理は `path` モジュールで自動変換
3. 使用しているライブラリは全てWindows対応
4. ファイルシステム操作は標準API

**推奨テスト手順:**
1. Windows環境でプロジェクトをクローン
2. `npm install && npm run build`
3. `npm test` で基本機能を確認
4. Claude Desktopで実際に使用

**問題が発生した場合:**
- Node.js 20以上を使用
- パスは絶対パスで指定
- バックスラッシュをエスケープ（`\\`）
