# FigDown 語法 — 草案 v0.0（討論稿）

> 狀態：**標準前的草圖**，供討論，2026-07-02。依據
> [requirements-notes.zh-tw.md](requirements-notes.zh-tw.md)（R0–R15、
> D1–D3）推導。此處沒有任何內容是定案。圖型優先順序依已完成的圖型
> 普查（774 份文件、1.2 萬張圖）定案——見
> [census.zh-tw.md](census.zh-tw.md)：下方 v0.1 範圍約覆蓋語料中
> 可分類圖形的 95%。
>
> English version: [syntax-draft.md](syntax-draft.md)

## 0. 語法必須滿足的設計約束

由需求記錄推得，語法被以下條件框定：

1. **封閉、逐行的文法**——每行以已知關鍵字開頭；未知行即錯誤、附
   1-based 行號（支撐 AI 寫→驗→修迴圈）。（R7，ProtoFlow 傳承）
2. **可機械渲染**——由純程式（無 LLM）確定性地把文字轉成 SVG。（D1）
3. **剛性/彈性屬性模型**——屬性要嘛被明確宣告（剛性約束，renderer
   必須遵守），要嘛缺席（renderer 自動適應、外溢最小化）。（R8、R10）
4. **預設值 = 統計上的最常見情況**——多數圖完全不需要補充宣告。（R13）
5. **token 精簡的可教學性**——核心必須塞得進約 100 行的 AI 撰寫指南。
   凡是 AI 已熟悉的慣例（Mermaid、D2、DOT、WaveDrom）能借就借。
   （R7、R11）
6. **靜態優先**——動態（頁/步驟序列）保留關鍵字，但不在 v0 範圍。
   （R1、R2）

## 1. 文件骨架

FigDown 文件是 UTF-8 純文字，一行一指令。

```figdown
figdown 0.1 block               # 版本標頭 + TEMPLATE，必須是第一行
title "L3 Forwarding Datapath"  # 選用
# 註解以 '#' 開頭；空行忽略
...指令...
```

**Template（R16）。** 標頭宣告文件的 template——它實例化的圖型：
`block`｜`topology`｜`flowchart`｜`bitfield`｜`table`｜`wave`
（初始集合 = 普查的桶，按優先順序）。所有 template 共享這一套核心
文法；template 決定關鍵字詞彙表（有哪些 `kind`、`node` 是什麼意思）
與預設值（流向、邊的有向性、單位尺寸）——各自對準該圖型自己的
普查統計。教 AI 寫某個 template 只需要核心 + 該 template 的詞彙表。
新 template 必須有語料佐證（R11：不得增生）。

詞法規則：

- 指令 = `關鍵字 位置參數… key=value 選項…`
- 含空白的字串用雙引號；單詞不需引號。
- ID 格式 `[A-Za-z_][A-Za-z0-9_-]*`，文件內唯一。
- 顏色用 CSS hex（`#0d9488`）或 CSS 顏色名。
- `#` 只有在行首或前面是空白時才開始註解
  （因此 `color=#0d9488` 永遠不會被誤認為註解）。
- 一行一指令。不接受續行。永不加入運算式、迴圈、巨集。（框架公理）

## 2. 核心場景模型（涵蓋方塊架構、拓撲、流程圖）

普查顯示這三類其實是同一家族：**方塊、包含、連線**——差別只在節點
kind 與線條樣式。因此共用同一核心模型（「為何不能是原語+樣式」
審查原則）。

### 2.1 節點

```figdown
node parser "Packet Parser"
node l3 "L3 Lookup" kind=process color=#0d9488
node q1 "CRC ok?" kind=decision
node sw1 "ToR Switch" kind=switch
```

- `kind` 從各 profile 的封閉集合中選擇形狀/圖示
  （預設 `box`｜`decision`｜`terminator`｜`datastore`｜`switch`｜
  `router`｜`host`｜`port`｜……依普查定案）。
- 未知 `kind` = 行錯誤（封閉詞彙）。

### 2.2 包含（群組/嵌套）

```figdown
group ingress "Ingress Pipeline"
node parser "Parser" in=ingress
node l2 "L2 Lookup" in=ingress
group vtep1 "VTEP-1"; node vm1 "VM" in=vtep1   # 允許一層嵌套
```

扁平的 `in=` 引用讓文法維持逐行（沒有縮排語意、沒有 `end` 區塊）。
OQ-S1：是否另外提供縮排區塊形式作為語法糖。

### 2.3 連線

```figdown
edge parser -> l2
edge l2 -> l3 label="on miss" style=dashed
edge sw1 -- sw2 label="100G"        # 無向連結
edge a <-> b                        # 雙向
```

`->` `--` `<->` 沿用 Mermaid/D2 慣例（AI 先驗知識，R11）。

### 2.4 圖層（R5）

```figdown
layer overlay "LSP paths" z=2
edge r1 -> r2 layer=overlay color=#dc2626
```

圖層是作者可用的組織單位；圖層之間以 `z` 排序，同層內文件順序＝
繪製順序——**行號越大越晚繪製、越靠近使用者（top）**，行序本身
就是同層內的隱含 z。預設圖層為 `base`（z=0）。

## 3. 排版控制——三層級（R5、R8）

本節全部**選用**；一項都不寫時，renderer 確定性地全自動排版。

```figdown
flow right                      # 第 2 層：整體方向（right|down|left|up）
rank l2 l3                      # 第 2 層：這些節點同列
zone left ingress               # 第 2 層：群組的區域提示
pin l3 at=420,80                # 第 3 層：絕對位置（畫布 px）
size l3 w=120 h=60              # 第 3 層：明確尺寸（px 或 %）
```

規範性規則：

- **剛性**（R8）：`pin`/`size`/任何明確屬性都是硬約束；自動排版
  必須**繞著**被釘住的元素安排，永不覆蓋。
- **穩定性**（D1）：同來源 → 同 SVG（位元級）。局部修改只能改變
  對應的局部區域。renderer 必須實作尊重釘點的增量排版；參考工作流
  允許編輯器把算出的位置**物化**回 `pin` 行，凍結作者認可的佈局。
- **尺寸適應**（R10）：有明確 `size` → 內容遷就框（字級可微降）；
  無明確尺寸 → 框最小幅度長大、不推動全局。
- **OQ-S2 已定案（2026-07-02）：`at=` 採絕對畫布 px。**
  畫布比例在 PoC 實測後否決：自動排版的範圍一變，所有比例釘點
  跟著漂移——恰好違反 pin 存在的目的（穩定性）。推論
  （**pin-on-first-touch**）：參考編輯器在使用者第一次拖曳時，
  把*所有*節點位置物化成 `pin` 行；此後佈局完全手動、演算法退場。
  edge 永遠由節點邊框衍生——自動適應、不可釘。

## 4. 型別區塊（普查主導圖型）

有三個圖型家族不是「方塊+連線」，各自擁有專屬的封閉子文法。每個
區塊由關鍵字開頭、延伸到下一個頂層指令為止（黏滯範圍，如 ProtoFlow
的 step——不用 `end` 關鍵字）。以下優先順序依已完成的普查定案。

### 4.1 `bitfield` — 封包標頭/暫存器欄位（普查第 2，加權 23.7%）

借鑑：RFC 封包 ASCII 圖語意、WaveDrom bitfield、Mermaid packet-beta。

```figdown
bitfield gre "GRE Header" unit=32
field C 1
field R 1
field K 1
field Reserved 9
field Ver 3
field "Protocol Type" 16 color=#bfdbfe note="rGRE_INT"
field Checksum 16 optional
field Offset 16 optional
wrap                       # 欄位在 unit 中途結束時的顯式換列
```

- `unit=32`——每列位元數（預設 32，普查中的最常見情況）。
- 寬度以位元計；renderer 計算位元索引並繪製刻度尺。
- `numbering=lsb0|msb0`——位元編號慣例。`lsb0`（預設）：bit 0 為
  最低位，尺標由左至右 N-1…0（硬體暫存器風格——依 R16「預設值按
  template 桶統計」，這是本語料 bitfield 桶的主流慣例）。`msb0`：
  bit 0 為最高位，尺標 0…N-1（IETF RFC 風格）。欄位擺放順序不受
  影響——一律按宣告順序由左至右填入，只有尺標數字改變。
- `optional` 渲染為慣例的虛線框（依語料風格）。

### 4.2 `table` — 配置/狀態表、記憶體映射（普查第 3，加權 9.6%）

```figdown
table fib "FIB Table"
head Route  <       Forwarding <  # 選用的額外表頭層（可重複、允許合併標記）
head Prefix NextHop Port          # 第一個 head 定義欄數
row 10.0.0.0/8  R2   p1
row 0.0.0.0/0   R3   p2 highlight
row "^"         "^"  p3           # 引號中的 ^ 是字面字元，不是合併
row 224.0.0.0/4 ^    <            # ^ 與上方儲存格合併（rowspan）
                                  # < 與左方儲存格合併（colspan）
cell 2,3 color=#fee2e2            # 儲存格級標註；第 0 列 = 表頭，欄 1 起算
```

- 心智模型是 Markdown 表格，補上 GFM 做不到的：**儲存格合併與
  儲存格級顏色**——並且圖片化。
- 儲存格以空白分隔；含空白（或要寫字面 `^`/`<`）時用引號。
- 合併標記：未加引號的 `^` 向上合併（rowspan）；未加引號的 `<`
  向左合併（colspan）。分別不得出現在第一列/第一欄（行錯誤）。
- `cell <row>,<col> color=…` 對單一儲存格附掛標註——「標註附著於
  定址」，讓 `row` 行保持乾淨（`mark`/`leg` 的先例）。
- `head` 可重複以構成多層表頭；`cols` 是單層簡寫（`head` 之後再用
  `cols` 為行錯誤）。`cell` 的列定址：`0` = 最底層表頭，資料列
  1 起算。
- **特徵集已以普查 `table-matrix` 桶 212 張樣本驗收（R17，
  2026-07-02）**：cellcolor 58.5%、merged 41.5%、headercol 41.0%、
  multiheader 34.9% 為 must-have（皆已入草案）；multitable 20.8%
  （已涵蓋——一份文件多個 table 區塊）、colwidth 20.3%（OQ-S3）、
  symbol 11.8%（已涵蓋——儲存格值可用 Unicode）、rowhl 12.3%
  （已涵蓋——`highlight`）。依證據砍掉（v0.1）：混合對齊（1.4%）
  與旋轉文字（0.5%）。partialborder 17.0% 與 memmap 14.2% 列
  v0.2 候選。
- OQ-S3：欄寬/對齊覆寫——傾向 `colw 30% auto auto`
  （語料出現率 20.3% 佐證）。
- 表格可附掛場景節點（`table fib ... attach=r1`）——封包走訪場景
  （usecases 4）需要；延到 v0.2。

### 4.3 `wave` — 時序/波形（普查第 5，加權 7.2%）

直接借用 WaveDrom 成熟的逐訊號字元軌道（R11：不重新發明）：

```figdown
wave por "Power-on reset sequencing"
signal clk    p.......
signal rst_n  0...1...
signal data   x..=3=5x  labels="cfg,val"
gap 4                       # 在第 4 tick 處的視覺斷點
```

一字元 = 一 tick：`p` 時脈、`0/1` 準位、`x` 未定、`=` 資料格、
`.` 延續。軌道字母表：採 WaveDrom 的，子集待定。

### 4.4 優先順序備註

`block-architecture`（普查第 1，加權 24.3%）**不需要型別區塊**——它
就是核心場景模型（§2）加上各種 `kind`；flowchart（8.3%，第 4）與
topology（5.0%）也收攏進同一模型。普查定案的算術：核心場景（37.6%）
+ bitfield（23.7%）+ table（9.6%）+ wave（7.2%）= **非模板圖出現
次數的 78%，約等於可分類圖形的 95%**（[census.zh-tw.md](census.zh-tw.md)）。

## 5. 展現屬性（R5）

任何元素上皆為選用：`color=`（填色）、`stroke=`、`text=`（文字色）、
`style=solid|dashed|dotted`、`w=`/`h=`、`layer=`。
其餘（字型、間距、箭頭、走線）屬於 renderer/主題，不屬於語言。
語意配色 profile（如 ProtoFlow 的 plane→顏色）日後可以 profile 形式
疊加；文件場景維持顏色自由。（化解 R5 的張力）

## 6. 動態——保留、不規範（R1、R2）

`page`/`step` 為保留關鍵字。草圖（非規範性）：

```figdown
page "After ARP resolution"
set r1.fib row="10.1.0.0/16 R4 p2"    # 對靜態場景的黏滯增量
pulse r1                                # 瞬時高亮
```

動態 = 靜態場景 + 有序的 page 增量序列（黏滯/瞬時之分同 ProtoFlow）。
待靜態核心出貨後再議。

## 7. 嵌入與產物（R14、D1）

- Markdown 圍欄塊：` ```figdown … ``` `；sidecar 檔：`X.fd`。
- 生成產物：`X.svg`，以普通圖片引用嵌入 .md。
- renderer **必須**在 SVG 內嵌入：完整來源文字
  （`<metadata id="figdown-source">`）與來源的 SHA-256——產物因此
  自攜真相、可偵測過期。
- 同名配對（`X.fd` ⇔ `X.svg`）為規範性要求。

## 8. 錯誤模型

- 未知關鍵字/格式錯誤的行 → `Line N: <message>`，解析繼續（錯誤
  恢復模式），一次回報全部錯誤。
- 未知 `kind`、重複 ID、懸空的 edge 端點、`in=` 循環、bitfield 寬度
  溢出、table 列欄不符 → 一律行錯誤。
- 有錯誤的文件不渲染任何輸出（不做 partial/best-effort——確定性
  優先於方便）。

## 9. 語法未決問題

- OQ-S1：`group`/型別區塊的縮排語法糖？
- ~~OQ-S2：`pin at=` 的單位~~——已定案：絕對畫布 px（§3）。
- OQ-S3：表格欄寬/對齊語法。
- OQ-S4：`edge` 標籤位置微調（ProtoFlow `nudge` 的傳承）？
- OQ-S5：多圖文件——一個 `.fd` = 一張圖（目前草案），或允許多張？
- OQ-S6：模型重疊處與 D2 語法的關係（OQ1）。

## 10. 可教學性檢查（R7）

完整核心 = 16 個關鍵字：`figdown title node group edge layer flow
rank zone pin size bitfield field wrap table cols row wave signal gap`
（另保留 `page set pulse`）。目標：完整 AI 撰寫指南 ≤120 行。未來
任何新增若使關鍵字超過約 20 個，必須通過「通用規則優先」審查
（R11）才能進入。
