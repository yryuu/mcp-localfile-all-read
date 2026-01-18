# file_pattern の正しい使い方

## 問題の原因

Claude Desktopから以下のように呼び出されました：

```json
{
  "path": ".",
  "pattern": "ヒアリングシート",
  "file_pattern": "*",
  "case_sensitive": false
}
```

**問題:** `file_pattern: "*"` は正規表現として解釈されるため、**マッチするファイルが0件**になります。

## なぜマッチしないのか

`file_pattern`は正規表現として処理されます：

```typescript
// search.ts (45行目)
const fileRegex = new RegExp(options.filePattern);
if (!fileRegex.test(entry)) {
    continue;  // マッチしないファイルはスキップ
}
```

**正規表現での`*`の意味:**
- `*` = 「直前の文字が0回以上繰り返す」
- `file_pattern: "*"` = 「直前の文字が0回以上」→ 意味のないパターン
- 結果: ほとんどのファイル名にマッチしない

## 解決策

### 解決策1: file_patternを指定しない（推奨）

全てのファイルを検索する場合は、`file_pattern`を省略してください：

```json
{
  "path": ".",
  "pattern": "ヒアリングシート"
}
```

**結果:** 全てのファイルが検索対象になります ✅

### 解決策2: 正しい正規表現を使用

全てのファイルを明示的に指定する場合：

```json
{
  "path": ".",
  "pattern": "ヒアリングシート",
  "file_pattern": ".*"
}
```

**`.*`の意味:**
- `.` = 任意の1文字
- `*` = 直前の文字（任意の1文字）が0回以上
- `.*` = 任意の文字列
- 結果: 全てのファイル名にマッチ ✅

### 解決策3: 特定の拡張子のみ検索

.txtファイルのみ検索する場合：

```json
{
  "path": ".",
  "pattern": "ヒアリングシート",
  "file_pattern": ".*\\.txt$"
}
```

**正規表現の説明:**
- `.*` = 任意の文字列
- `\\.` = `.`（エスケープが必要）
- `txt` = 文字列"txt"
- `$` = 文字列の終端
- 結果: `.txt`で終わるファイルのみマッチ ✅

## file_pattern の例

| file_pattern | マッチするファイル | 説明 |
|-------------|-----------------|------|
| （省略） | 全てのファイル | 推奨 |
| `.*` | 全てのファイル | 明示的 |
| `.*\.txt$` | `file.txt`, `test.txt` | .txtファイルのみ |
| `.*\.xlsx?$` | `data.xls`, `data.xlsx` | Excelファイル |
| `.*\.(js\|ts)$` | `app.js`, `app.ts` | JSまたはTS |
| `^test.*` | `test.txt`, `test-data.csv` | testで始まる |
| `*` | ❌ ほぼマッチしない | 間違い |
| `*.txt` | ❌ 期待通りに動かない | 間違い |

## 検証テスト

```bash
# テストを実行
npx tsx test/test-file-pattern.ts
```

**結果:**
```
❌ 問題: file_pattern: "*"
マッチ数: 0

✅ 解決策1: file_patternを指定しない
マッチ数: 6

✅ 解決策2: file_pattern: ".*"
マッチ数: 6

✅ 解決策3: file_pattern: ".*\.txt$"
マッチ数: 4
```

## Claude Desktopでの使用

Claude Desktopに以下のように指示してください：

**❌ 間違い:**
> "ヒアリングシート"という文字列を全てのファイルから検索して

→ Claude が `file_pattern: "*"` を指定してしまう可能性

**✅ 正しい:**
> "ヒアリングシート"という文字列を検索して（file_patternは指定しないで）

または

> search_contentツールを使って、patternに"ヒアリングシート"を指定して検索して。file_patternは省略してください。

## まとめ

**問題:**
- `file_pattern: "*"` は正規表現として解釈される
- `*`は「直前の文字の0回以上の繰り返し」という意味
- ファイル名にマッチしない

**解決策:**
1. `file_pattern`を省略する（最も簡単）
2. `file_pattern: ".*"` を使用（全てのファイル）
3. `file_pattern: ".*\\.txt$"` を使用（特定の拡張子）

**推奨:**
全てのファイルを検索する場合は、`file_pattern`パラメータを完全に省略してください。
