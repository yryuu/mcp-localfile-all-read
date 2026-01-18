# セキュリティとパス制限の仕組み

## 環境変数によるルートパス設定

### 現在の実装

```typescript
// src/index.ts (15-19行目)
const ROOT_PATH = process.env.MCP_ROOT_PATH || process.cwd();
const rootPath = resolve(ROOT_PATH);
```

**仕組み:**
1. 環境変数`MCP_ROOT_PATH`が設定されていればそれを使用
2. 設定されていなければ`process.cwd()`（カレントディレクトリ）を使用
3. `resolve()`で絶対パスに正規化

### Claude Desktop設定での指定

```json
{
  "mcpServers": {
    "localfile-reader": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "MCP_ROOT_PATH": "/Users/yourname/Documents"
      }
    }
  }
}
```

**この設定により:**
- サーバー起動時に`MCP_ROOT_PATH`環境変数が設定される
- `/Users/yourname/Documents`がルートディレクトリになる
- それより上位のディレクトリにはアクセスできない

## パス制限の仕組み

### セキュリティチェック関数

```typescript
// src/index.ts (162-174行目)
function resolvePath(relativePath: string): string {
    // 1. 絶対パスか相対パスかを判定
    const resolved = isAbsolute(relativePath)
        ? relativePath
        : resolve(rootPath, relativePath);

    // 2. セキュリティチェック: ルート外へのアクセスを防止
    if (!resolved.startsWith(rootPath)) {
        throw new Error('Access denied: Path is outside root directory');
    }

    return resolved;
}
```

### 動作の詳細

#### ケース1: 通常の相対パス

```
rootPath = "/Users/yourname/Documents"
relativePath = "work/report.pdf"

↓ resolve(rootPath, relativePath)

resolved = "/Users/yourname/Documents/work/report.pdf"

↓ resolved.startsWith(rootPath)?

"/Users/yourname/Documents/work/report.pdf".startsWith("/Users/yourname/Documents")
= true ✅ アクセス許可
```

#### ケース2: 親ディレクトリへの移動（..）

```
rootPath = "/Users/yourname/Documents"
relativePath = "../Desktop/secret.txt"

↓ resolve(rootPath, relativePath)

resolved = "/Users/yourname/Desktop/secret.txt"

↓ resolved.startsWith(rootPath)?

"/Users/yourname/Desktop/secret.txt".startsWith("/Users/yourname/Documents")
= false ❌ アクセス拒否
```

#### ケース3: 絶対パスの指定

```
rootPath = "/Users/yourname/Documents"
relativePath = "/etc/passwd"

↓ isAbsolute(relativePath) = true

resolved = "/etc/passwd"

↓ resolved.startsWith(rootPath)?

"/etc/passwd".startsWith("/Users/yourname/Documents")
= false ❌ アクセス拒否
```

#### ケース4: シンボリックリンクによる回避試行

```
rootPath = "/Users/yourname/Documents"
relativePath = "link-to-root"  # /へのシンボリックリンク

↓ resolve(rootPath, relativePath)

resolved = "/Users/yourname/Documents/link-to-root"
# resolveはシンボリックリンクを解決しない

↓ resolved.startsWith(rootPath)?

"/Users/yourname/Documents/link-to-root".startsWith("/Users/yourname/Documents")
= true ✅ アクセス許可（シンボリックリンク先は読み込み時に解決される）
```

**注意:** シンボリックリンクは現在の実装では完全には防げません。

## セキュリティの強化案

### 1. シンボリックリンクの解決

より厳格なセキュリティが必要な場合：

```typescript
import { realpath } from 'fs/promises';

async function resolvePath(relativePath: string): Promise<string> {
    const resolved = isAbsolute(relativePath)
        ? relativePath
        : resolve(rootPath, relativePath);

    // シンボリックリンクを実際のパスに解決
    const realPath = await realpath(resolved);

    // 実際のパスがルート内にあるか確認
    if (!realPath.startsWith(rootPath)) {
        throw new Error('Access denied: Path is outside root directory');
    }

    return realPath;
}
```

### 2. 正規化されたパスの比較

Windows対応を強化：

```typescript
import { normalize, sep } from 'path';

function resolvePath(relativePath: string): string {
    const resolved = isAbsolute(relativePath)
        ? relativePath
        : resolve(rootPath, relativePath);

    // パスを正規化（大文字小文字、区切り文字を統一）
    const normalizedResolved = normalize(resolved).toLowerCase();
    const normalizedRoot = normalize(rootPath).toLowerCase();

    if (!normalizedResolved.startsWith(normalizedRoot)) {
        throw new Error('Access denied: Path is outside root directory');
    }

    return resolved;
}
```

## 実際の使用例

### 例1: Documentsフォルダのみアクセス許可

```json
{
  "env": {
    "MCP_ROOT_PATH": "/Users/yourname/Documents"
  }
}
```

**許可されるパス:**
- `/Users/yourname/Documents/report.pdf` ✅
- `/Users/yourname/Documents/work/data.xlsx` ✅
- `./file.txt` → `/Users/yourname/Documents/file.txt` ✅

**拒否されるパス:**
- `/Users/yourname/Desktop/file.txt` ❌
- `../Desktop/file.txt` ❌
- `/etc/passwd` ❌

### 例2: プロジェクトフォルダのみアクセス許可

```json
{
  "env": {
    "MCP_ROOT_PATH": "/Users/yourname/projects/myapp"
  }
}
```

**許可されるパス:**
- `/Users/yourname/projects/myapp/src/index.ts` ✅
- `./README.md` → `/Users/yourname/projects/myapp/README.md` ✅

**拒否されるパス:**
- `/Users/yourname/projects/other-app/file.txt` ❌
- `../../other-app/file.txt` ❌

## テスト

### セキュリティテストの作成例

```typescript
// test/test-security.ts
import { resolve } from 'path';

const rootPath = '/Users/test/Documents';

function testResolvePath(relativePath: string) {
    const resolved = isAbsolute(relativePath)
        ? relativePath
        : resolve(rootPath, relativePath);

    if (!resolved.startsWith(rootPath)) {
        console.log(`❌ Blocked: ${relativePath} → ${resolved}`);
        return false;
    }

    console.log(`✅ Allowed: ${relativePath} → ${resolved}`);
    return true;
}

// テストケース
testResolvePath('file.txt');              // ✅
testResolvePath('work/report.pdf');       // ✅
testResolvePath('../Desktop/file.txt');   // ❌
testResolvePath('/etc/passwd');           // ❌
testResolvePath('../../file.txt');        // ❌
```

## まとめ

### 現在のセキュリティ機構

✅ **環境変数によるルート設定**
- `MCP_ROOT_PATH`で柔軟に設定可能
- Claude Desktop設定で簡単に指定

✅ **パス検証**
- `startsWith()`による厳格なチェック
- 相対パス、絶対パス両方に対応

✅ **エラーハンドリング**
- 不正なアクセスは即座にエラー
- 明確なエラーメッセージ

⚠️ **制限事項**
- シンボリックリンクは完全には防げない
- Windows大文字小文字の扱いに注意

### 推奨設定

**最小権限の原則:**
```json
{
  "MCP_ROOT_PATH": "/Users/yourname/Documents/AI-accessible"
}
```

特定のフォルダのみをAIにアクセス可能にすることで、セキュリティを最大化できます。
