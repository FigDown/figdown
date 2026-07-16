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

## 0.1-dev.6 → 0.1-dev.7（2026-07-10，review A-4/F-2）
Change:  表格儲存格定址——第 `0` 列（最底層表頭）退役；表頭層
         改以 `h1..hN` 定址、**由上往下**。資料列定址（分隔列
         以下 1 起算）不變。
Rule:    設 N = 該表格的表頭層數：
         `cell 0,<c> …` → `cell hN,<c> …`（0 過去指*最底*層）；
         其他表頭層過去無法定址——不存在其他改寫。
Example: （兩層表頭）`cell 0,1 color=#eee` → `cell h2,1 color=#eee`

## 0.1-dev.7 → 0.1-dev.8（2026-07-10，review B-3）
Change:  `zone`（排版層提示，僅接受、從未作用）自語言移除；
         關鍵字不再註冊。
Rule:    刪除所有符合 `^\s*zone\b` 的行。無語意損失——該指令
         從未定義任何渲染行為。
Example: `zone left ingress` →（刪行）

## 0.1-dev.9 → 0.1-dev.10（2026-07-10，D9）
Change:  新增語意類：`class <id> "<意義>" [color=] [stroke=]
         [text=] [style=]` ＋ node/group/edge/field/cell 上的
         `class=<id>`；legend 條自動衍生。
Rule:    **純新增**——既有文件零改寫。建議（**非機械**，需作者
         知道意義）：顏色用於分類處，把重複的 `color=#X` 改為
         一行 `class` ＋ `class=` 引用。
Example: `edge a -> b color=#dc2626`（已知意義：primary-VLAN
         流向）→ `class vidp "VID_P" color=#dc2626` ＋
         `edge a -> b class=vidp`

## 0.1-dev.8 → 0.1-dev.9（2026-07-10，R34/R35）
Change:  edge 標籤改為**行內**、位於三個有意義的位置（尾/中/頭）：
         `edge A [t] -[m]-> [h] B`。`[mid]` 標籤把運算子拆成兩半
         （`-`|`<-` + `-`|`->`）；`<-` 加入運算子集。`label=`／
         `taillabel=`／`headlabel=` 退役。
Rule:    逐 edge 行：`taillabel="T"` → 來源 id 之後放 `[T]`；
         `headlabel="H"` → 目標 id 之前放 `[H]`；`label="M"` →
         把運算子繞著 `[M]` 拆開：`--`→`-[M]-`、`->`→`-[M]->`、
         `<-`→`<-[M]-`、`<->`→`<-[M]->`。標籤文字含引號、反斜線
         或不平衡中括號時，改用引號形式 `["…"]`（標準字串跳脫）。
Example: `edge a -- b label="eBGP" taillabel="p1"` →
         `edge a [p1] -[eBGP]- b`

## 0.1-dev.10 → 0.1-dev.11（2026-07-16，DISCREPANCIES D2–D14）
Change:  嚴格性批次——一致性測試稽核出的引擎-規格偏差，一律以
         規格為準解決（封閉文法：打錯字永不默默通過）。以下原本
         被默默接受/忽略者，現在都是行錯誤：
         - 每個指令上「已註冊但不適用」的選項鍵（如
           `node … unit=32`、`bitfield … at=50%`），包括
           `group … in=`（嵌套僅一層：node in=group）；
         - 每個指令上的未知選項鍵（`foo=bar`）；
         - `pin`、`size`、`layer`、`plot`、`bitfield`/`table`/`wave`
           宣告、`cell` 與 classic `field` 形式上的多餘位置參數；
         - 重複的 `bundle` id；
         - 非數值的 `layer z=` 與 `size w=`/`h=`；
         - `size` 百分比（v0.1 尺寸僅有 px）；
         - `line at=<n>` 缺 `%` 符號；
         - 第一列資料列出現 `^^`（rowspan 不得跨越表頭分隔列）；
         - 無效顏色值——顏色必須是 `#rgb`/`#rrggbb` 或 CSS 色名
           （147 個關鍵字，小寫，另加 `transparent`）。
         另有兩處解碼變更：引號形式 `title` 的跳脫改為與其他字串
         一致、由左至右一次掃過（`"a\\nb"` 是反斜線＋字母 `n`，
         不是換行）；表格儲存格開頭的反斜線除 `\|`、`\^^` 兩個
         跳脫外一律保留為字面文字。
Rule:    多數**無需改寫**——原本解析乾淨且語意如實的文件不受影
         響；每一行新報錯的內容都是先前被默默吞掉的作者筆誤——
         依驗證器逐行報告刪除或修正即可。兩處解碼變更的機械式
         改寫：（1）引號 title：用舊順序（先 `\n`、後 `\\`）解
         碼，再以標準跳脫重新編碼——實務上，倚賴舊行為呈現
         「反斜線＋換行」的 `\\n` 改寫為 `\\\n`；（2）表格儲存
         格：若當初就想要被剝掉的效果，刪除非 `\|`/`\^^` 的開頭
         反斜線。
Example: `title "a\\nb"`（舊呈現：`a\`＋換行＋`b`）→
         `title "a\\\nb"`；儲存格 `\x raw`（舊呈現：`x raw`）→
         `x raw`；`group inner "I" in=outer` → `group inner "I"`
         （`in=` 原本即被默默丟棄——沒有任何嵌套損失）。
