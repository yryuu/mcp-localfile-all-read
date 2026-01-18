# search_content トラブルシューティングガイド

## 検証結果

✅ **深いフォルダの検索は正常に動作します**

テスト結果:
```
検索パターン: "DEEP_SEARCH_TEST"
マッチ数: 1
ファイル: test-data/deep/folder/structure/deep-test.txt
```

## 検索が見つからない場合の原因と対処法

### 1. recursiveオプションが無効になっている

**症状:** 深いフォルダのファイルが見つからない

**原因:** `recursive`オプションが`false`に設定されている

**確認方法:**
```typescript
// MCPツールの呼び出し
{
  "path": ".",
  "pattern": "検索文字列",
  // recursive オプションは指定しない（デフォルトでtrue）
}
```

**解決策:** `recursive`オプションを指定しないか、明示的に`true`にする

### 2. ファイルが読み込めない

**症状:** ファイルは存在するが検索結果に出ない

**原因:**
- ファイルがバイナリ形式
- ファイルのエンコーディングが読み込めない
- ファイルの権限がない

**確認方法:**
```bash
# ファイルの種類を確認
file test-data/deep/folder/structure/file.txt

# ファイルの権限を確認
ls -la test-data/deep/folder/structure/file.txt
```

**解決策:**
- テキストファイルであることを確認
- 読み込み権限があることを確認

### 3. パターンマッチングの問題

**症状:** 検索文字列は含まれているはずなのに見つからない

**原因:**
- 大文字小文字の違い
- 正規表現の特殊文字
- 空白文字の違い

**例:**

| 検索パターン | ファイル内容 | マッチ | 理由 |
|------------|------------|--------|------|
| `TODO` | `TODO: fix` | ✅ | 完全一致 |
| `TODO` | `todo: fix` | ✅ | デフォルトは大文字小文字区別なし |
| `TODO` | `todo: fix` (case_sensitive=true) | ❌ | 大文字小文字が違う |
| `test.txt` | `test.txt` | ❌ | `.`が正規表現の特殊文字 |
| `test\.txt` | `test.txt` | ✅ | エスケープ済み |

**解決策:**
```typescript
// 大文字小文字を区別する場合
{
  "pattern": "TODO",
  "case_sensitive": true
}

// 特殊文字を含む場合はエスケープ
{
  "pattern": "test\\.txt"  // . をエスケープ
}
```

### 4. ファイルパターンの指定ミス

**症状:** 特定の拡張子のファイルだけ検索したいが見つからない

**原因:** `file_pattern`の正規表現が間違っている

**例:**

| file_pattern | ファイル名 | マッチ |
|-------------|-----------|--------|
| `*.txt` | `file.txt` | ❌ | `*`は正規表現では任意の文字 |
| `.*\.txt$` | `file.txt` | ✅ | 正しい正規表現 |
| `.txt` | `file.txt` | ✅ | 部分一致 |

**解決策:**
```typescript
// .txtファイルのみ検索
{
  "pattern": "検索文字列",
  "file_pattern": ".*\\.txt$"
}

// .jsまたは.tsファイルを検索
{
  "pattern": "検索文字列",
  "file_pattern": ".*\\.(js|ts)$"
}
```

### 5. パスの指定ミス

**症状:** 検索対象のディレクトリが間違っている

**原因:** 相対パスの指定が間違っている

**例:**
```typescript
// ルートディレクトリから検索
{
  "path": "."
}

// 特定のサブディレクトリから検索
{
  "path": "subfolder"
}

// 間違い: 絶対パスは使えない（セキュリティ制限）
{
  "path": "/Users/name/Documents"  // ❌
}
```

**解決策:**
- `path`は常に相対パスで指定
- ルート全体を検索する場合は`"."`を使用

### 6. エラーが無視されている

**症状:** 一部のファイルが検索されない

**原因:** 
```typescript
// search.ts (68-70行目)
try {
    const content = await readFileWithEncoding(fullPath);
    // ...
} catch {
    // Skip files that can't be read as text
}
```

ファイル読み込みエラーは無視される仕様

**対象となるファイル:**
- バイナリファイル
- 権限のないファイル
- 破損したファイル

**解決策:**
- ファイルがテキスト形式であることを確認
- ファイルの権限を確認

## デバッグ方法

### 1. テストファイルを作成

```bash
# 深いフォルダ構造を作成
mkdir -p test-data/deep/folder/structure

# テストファイルを作成
echo "SEARCH_TEST_KEYWORD" > test-data/deep/folder/structure/test.txt
```

### 2. 検索を実行

```typescript
{
  "path": ".",
  "pattern": "SEARCH_TEST_KEYWORD"
}
```

### 3. 結果を確認

- **見つかった場合:** 検索機能は正常
- **見つからない場合:** 上記の原因を確認

### 4. ログを確認

MCPサーバーのログを確認：
```bash
# サーバー起動時のログ
MCP File Reader Server starting with root path: /path/to/root
```

## よくある質問

### Q: 隠しファイル（.で始まるファイル）は検索されますか？

A: はい、検索されます。`.gitignore`なども検索対象です。

### Q: シンボリックリンクは検索されますか？

A: はい、シンボリックリンク先のファイルも検索されます。

### Q: 検索速度が遅い場合は？

A: 以下を試してください：
- `file_pattern`で拡張子を絞る
- 検索対象のディレクトリを限定する
- 大きなバイナリファイルが多い場合は除外

### Q: 日本語の検索はできますか？

A: はい、UTF-8およびShift-JISエンコーディングに対応しています。

## 実際のテスト例

```bash
# テストスクリプトを実行
npx tsx test/test-deep-search.ts
```

**期待される出力:**
```
=== 深いフォルダの検索テスト ===

検索ディレクトリ: /path/to/test-data
検索パターン: "DEEP_SEARCH_TEST"

マッチ数: 1

✅ 見つかりました!
   ファイル: test-data/deep/folder/structure/deep-test.txt
   行番号: 2
   内容: 検索テスト用のキーワード: DEEP_SEARCH_TEST
```

## まとめ

✅ **検索機能は正常に動作します**
- 深いフォルダも再帰的に検索
- デフォルトで`recursive: true`

⚠️ **よくある問題**
1. ファイルパターンの正規表現ミス
2. 大文字小文字の違い
3. バイナリファイルは検索されない
4. 権限のないファイルはスキップされる

🔍 **デバッグのヒント**
- まずシンプルなテストファイルで確認
- ファイルの存在と権限を確認
- 正規表現のエスケープに注意
