# FigDown 遷移紀錄

> 政策（R31）：規格書的版本管理比照**資料庫 schema migration**——
> 收斂之前會經常修改，因此每一次語意變更都必須附上含**機械式改寫
> 規則**的遷移條目。把文件從 vA 升到 vZ = 依序套用兩者之間的每一
> 條目。v1 文件必須能經由 v1→v2→v3→v4→v5 正確轉成 v5 語法。
>
> English version: [MIGRATIONS.md](MIGRATIONS.md)

## 條目格式

```
## <from> → <to>（<日期>，<決議編號>）
Change:  語意上改了什麼
Rule:    機械式改寫規則（regex/演算法）；若含非機械步驟必須明確標注
Example: 改寫前 → 改寫後
```

v0.1 草案期間以日期遞增的 dev 版號（`0.1-dev.N`）記錄；凍結時
squash 為 `0.1`，本紀錄自該點重新起算。

---

## 0.1-dev.0 → 0.1-dev.1（2026-07-02，D4）
Change:  `pin at=` 語意由畫布*比例*（0–1）改為絕對畫布 **px**；
         群組成員其後改為群組局部座標（D6）。
Rule:    **非機械**（需渲染一次舊文件以取得畫布尺寸）：
         `at=fx,fy` → `at=round(fx*W),round(fy*H)`。
Example: `pin mon at=1.0,0.0` → `pin mon at=340,0`

## 0.1-dev.1 → 0.1-dev.2（2026-07-02，D5）
Change:  表格內容由關鍵字列改為**原封 GFM 管線列**；合併跟隨
         markdown-it-multimd-table。
Rule:    `cols A B C` → `| A | B | C |` + `|---|---|---|` 分隔列；
         `row a b c` → `| a | b | c |`；`row ... highlight` → 改為
         `cell <r> highlight`；合併標記 `^`→`^^`（獨占儲存格）、
         `<`→`||`（空段）。
Example: `row 0 "From CPU"` → `| 0 | From CPU |`

## 0.1-dev.2 → 0.1-dev.3（2026-07-02，D7）
Change:  節點 `kind=`（領域名詞）→ `shape=`（純幾何）。
Rule:    對映：decision→diamond · terminator→rounded ·
         datastore→cylinder · switch→rounded · router→rounded ·
         process→（刪除）· host→（刪除）· port→（刪除）·
         cloud→cloud。再 `s/kind=/shape=/`。
Example: `node q "CRC ok?" kind=decision` → `node q "CRC ok?" shape=diamond`

## 0.1-dev.3 → 0.1-dev.4（2026-07-02，D7）
Change:  `trunk` 改名 **`bundle`**（中性統稱）。
Rule:    `s/^trunk /bundle /`（僅行首關鍵字）。
Example: `trunk es1 "LAG" a--s, b--s` → `bundle es1 "LAG" a--s, b--s`

## 0.1-dev.4 → 0.1-dev.5（2026-07-03，R29）
Change:  `line` 成為純標記；著色區移至獨立的 `fill` 指令
         （解耦；可 per-group 或 per-node）。
Rule:    `line "<L>" in=<g> at=<p>% fill=below color=<c>` →
         `line "<L>" in=<g> at=<p>%` **加上**
         `fill in=<g> from=0% to=<p>% color=<c>`
         （fill=above 類推：from=<p>% to=100%）。
Example: 見規則。

## 0.1-dev.5 → 0.1-dev.6（2026-07-03，R30）
Change:  `fill` 範圍改為位置參數。
Rule:    `fill in=<t> from=0% to=<b>%` → `fill <b>% in=<t>`；
         `fill in=<t> from=<a>% to=<b>%`（a>0）→ `fill <a>-<b>% in=<t>`。
Example: `fill in=pool from=0% to=15%` → `fill 15% in=pool`
