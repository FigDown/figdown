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

1. **封閉、逐行的文法**——每個非空、非註解行都以已註冊的行首
   token 開頭（一個關鍵字，或表格列的 `|`）；未知行即錯誤、附
   1-based 行號（支撐 AI 寫→驗→修迴圈）。（R7）
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

**Template 僅提供預設值（R16，經 D8 收窄）。** 標頭宣告文件的
template：`block`｜`topology`｜`flowchart`｜`bitfield`｜`table`｜
`wave`。template 只選定**預設值與驗證 profile**——預設流向
（`block`→right、`flowchart`→down）、預設邊的有向性
（`topology`→無向）、預設單位——各自對準該圖型的普查統計。
template **不得**改變標準指令的核心語意：`node` 永遠是節點、
`edge` 永遠是關係。新 template 必須同時具備語料佐證**與**語意
不可表達性（R28）。

**版本相容性。** 標頭攜帶線上文法版本與 template。未知主版本
**必須**拒絕；未知次版本**應**以寬鬆模式解析（§10）；未知
template 在嚴格模式下**必須**拒絕。

詞法規則：

- 指令 = `關鍵字 位置參數… key=value 選項…`
- 含空白的字串用雙引號；單詞不需引號。
- ID 格式 `[A-Za-z_][A-Za-z0-9_-]*`，文件內唯一。
- 顏色用 CSS hex（`#0d9488`）或 CSS 顏色名。
- `#` 只有在行首或前面是空白時才開始註解
  （因此 `color=#0d9488` 永遠不會被誤認為註解）。
- 引號字串內的跳脫：`\n` 換行、`\"` 字面引號、`\\` 字面反斜線。
  其他任何跳脫皆為行錯誤。選項值也可用引號：`note="on miss"`。
  （管線列另有 `\|` 與 `\^^`，§4.2。）
- `title` 吃掉整行剩餘內容：`title TCP Header` 與
  `title "TCP Header"` 等價（多詞標題永不被默默截斷）。
- 關鍵字、選項鍵、列舉值、ID 與引用皆**區分大小寫**；所有標準
  關鍵字與選項鍵為小寫 ASCII。
- 指令行含有其文法不接受的位置參數時**必須**拒絕（打錯字永不
  默默通過）。`;` 沒有分隔指令的意義。
- 產物內嵌的 SHA-256 以來源的原始 UTF-8 位元組序列計算；處理器
  **不得**在雜湊前做任何正規化。
- 一行一指令。不接受續行。永不加入運算式、迴圈、巨集。（框架公理）

## 2. 核心場景模型（涵蓋方塊架構、拓撲、流程圖）

普查顯示這三類其實是同一家族：**方塊、包含、連線**——差別只在節點
形狀與線條樣式。因此共用同一核心模型（「為何不能是原語+樣式」
審查原則）。

### 2.1 節點

```figdown
node parser "Packet Parser"
node l3 "L3 Lookup" color=#0d9488
node q1 "CRC ok?" shape=diamond
node sw1 "ToR Switch" shape=rounded
```

- `shape=` 為**純幾何**（D7）：`box`（預設）｜`rounded`｜`circle`｜
  `ellipse`｜`cloud`｜`diamond`｜`cylinder`。語言刻意**不綁任何領域
  名詞**（router/host/gateway……會無限增生）——裝置*是什麼*由標籤
  文字自己說（R22：語意在文字裡）。未知 shape = 行錯誤。
- 節點接受 `style=dashed|dotted`（如廠商圖中的 bridge-domain 虛線框）。

### 2.2 包含（群組/嵌套）

```figdown
group ingress "Ingress Pipeline"
node parser "Parser" in=ingress
node l2 "L2 Lookup" in=ingress
group vtep1 "VTEP-1"
node vm1 "VM" in=vtep1               # 允許一層嵌套
```

扁平的 `in=` 引用讓文法維持逐行（沒有縮排語意、沒有 `end` 區塊）。
群組接受 `gap=<px>`——成員間距（展現層，R5）；`gap=0` 使成員
貼齊，呈現經典的「一框多分隔線」外觀。OQ-S1（縮排區塊語法糖）
**否決**：那會是第二套包含語法（R28/R30）。

### 2.3 連線

```figdown
edge parser -> l2
edge l2 -[on miss]-> acl style=dashed
edge sw1 [e1/1] -- [e1/2] sw2          # 端點（埠）標籤
edge peer1 <-[3-way handshake]-> peer2
edge ack <- syn                        # 陳述順序 = 作者的焦點
```

運算子 `--` `->` `<-` `<->`——恰為 D2 的集合（Mermaid/D2 慣例，
AI 先驗知識，R11/R35）。`A <- B` 畫出來與 `B -> A` 相同；這個
拼法存在，是因為作者的陳述順序本身就是人類編碼語意的一部分。

**標籤行內書寫、位於三個有意義的位置**（R34）：靠尾、線上、
靠頭——各自寫在它於圖面出現的位置（R22：文字是圖的一維編碼）。
`[mid]` 標籤把運算子拆成兩半（左半 `-` 或 `<-`、右半 `-` 或
`->`），鏡射 Mermaid 的 `A -- text --> B`。主流語言沒有任何一個
提供超過三個位置（[prior-art.zh-tw.md](prior-art.zh-tw.md) §1）。
典型用途：介面標記（`e1/22.2`）、基數（`1`/`N`）、端點角色。

中括號內容規則：

- 內部平衡的中括號原樣巢狀：`[flags[3:0]]` 完整顯示
  `flags[3:0]`。
- 不平衡的中括號、`\n`、字面引號，改用引號形式 `["..."]`——
  套用標準字串跳脫（Mermaid 的「形狀內引號」慣例）。
- 空的 `[]` 為行錯誤。`label=`／`taillabel=`／`headlabel=` 已
  退役（migration 0.1-dev.9）。

### 2.4 圖層（R5）

```figdown
layer overlay "LSP paths" z=2
edge r1 -> r2 layer=overlay color=#dc2626
```

圖層是作者可用的組織單位；圖層之間以 `z` 排序，同層內文件順序＝
繪製順序——**行號越大越晚繪製、越靠近使用者（top）**，行序本身
就是同層內的隱含 z。預設圖層為 `base`（z=0）。

### 2.5 語意註記：`bundle`（topology 詞彙）

```figdown
bundle es1 "ES-1 / LAG-1" bd24a--srv, bd24b--srv color=#0ea5e9
```

宣告所列鏈路構成**一個邏輯捆綁**——中性的統稱（LAG、Ethernet
Segment、port-channel、跨機箱 trunk……由標籤說明是哪一種）。
renderer **自動推導**慣例的虛線橢圓圈住成員鏈路——不涉及任何
座標，節點拖到哪、圈圈跟到哪。成員必須引用既存的 edge（否則行
錯誤），且成員引用 `A--B` 必須解析到**唯一**一條 edge——同端點
的平行邊不在 v0.1 範圍內，引用它們是錯誤。這是「語意優先」規則
（R24）：作者說出*意義*，繪圖慣例歸引擎。

### 2.6 導引線與著色帶：`line`、`fill`（通用標記）

```figdown
line "Max cap"                in=buf at=80%
line "Reserved {port, queue}" in=buf at=15%
fill 15% in=buf color=#a3c93a
```

- `line` 是**純標記**：橫跨目標框、位於其高度某百分比（底部 =
  0%）的導引線。無 id——沒有東西引用線。涵蓋門檻、水位、cap、
  未來的圖表標記（R28：這一個指令取代了原擬的整個 template）。
- `fill` 是**區間帶**，以位置參數書寫：`fill 15%` = 0–15%
  （常例只需一個數字）；`fill 15-35%` = 一個 token 寫完的顯式
  範圍。可疊加、可作用於群組**或**單一節點。
  `dir=up|down|left|right` 決定量測軸與其 0% 起始邊（預設
  `up`：0% 在底部——水位慣例；`right` 則呈現進度條式橫帶）。
  line 與 fill 是解耦的概念。
- **Scope 跟隨語意（R29）**：語意是全域時附掛於*群組*（「一份
  門檻配置、所有欄位共同參考」——即上例）；語意確實逐元素時
  附掛於*節點*（`fill 15-35% in=g2`——如某欄的佔用水位）。
  寫作者選擇能陳述其意圖的 scope；renderer 對兩者一視同仁。

## 3. 排版控制——三層級（R5、R8）

本節全部**選用**；一項都不寫時，renderer 確定性地全自動排版。

```figdown
flow right                      # 第 2 層：整體方向（right|down|left|up）
rank l2 l3                      # 第 2 層：這些節點同列
pin l3 at=420,80                # 第 3 層：位置（px，相對於元素的
                                #          定位上下文）
size l3 w=120 h=60              # 第 3 層：明確尺寸（px 或 %）
```

規範性規則：

- **剛性**（R8）：`pin`/`size`/任何明確屬性都是硬約束；自動排版
  必須**繞著**被釘住的元素安排，永不覆蓋。
- **確定性與穩定性（D1，分層一致性）**：符合規範的 parser 對同一
  來源**必須**產生相同的語意模型；符合規範的 renderer **必須**
  確定性（同來源＋同 renderer 版本 → 位元級相同的 SVG）；不同
  renderer 之間**應**視覺等價（跨實作的位元級一致**不**要求——
  日後可由 Canonical SVG Rendering Profile 提供 opt-in）。局部
  修改只能改變對應的局部區域。
- **尺寸適應**（R10）：有明確 `size` → 內容遷就框（字級可微降）；
  無明確尺寸 → 框最小幅度長大、不推動全局。
- **兩層釘點（D6）**：被釘的**群組**以畫布 px 錨定其局部原點；
  被釘的**成員**採群組局部座標（相對該原點）。因此移動群組是
  一行修改，群組內的編輯永不干擾其他群組。未分組的釘點為畫布 px。
- **語意完備不變量（R25）**：把文件中所有 `pin` 與 `size` 行刪除
  後，必須仍可解析、仍可在自動排版下渲染、且表達一字不差的結構
  與關係。編輯器慣例上把物化的佈局收進尾部的 `# layout` 區，讓
  結構先被讀到。
- **OQ-S2 已定案：`at=` 為相對於元素定位上下文的 px**——未分組
  的節點與群組相對於畫布；群組成員相對於該群組的局部座標系
  （D6）。畫布比例在實測後否決（畫布一長大，所有比例釘點跟著
  漂移）。edge 永遠由節點邊框衍生——自動適應、不可釘。
- *資訊性（編輯器政策，非線上格式）*：編輯器**可以**把算出的
  位置物化成 `pin` 行（參考編輯器在使用者第一次拖曳時如此——
  「pin-on-first-touch」），且**應**把生成的佈局收在尾部
  `# layout` 區。

## 4. 型別區塊（普查主導圖型）

有三個圖型家族不是「方塊+連線」，各自擁有專屬的封閉子文法。每個
區塊由關鍵字開頭、延伸到下一個頂層指令為止（黏滯範圍——不用
`end` 關鍵字）。以下優先順序依已完成的普查定案。

### 4.1 `bitfield` — 封包標頭/暫存器欄位（普查第 2，加權 23.7%）

借鑑：RFC 封包 ASCII 圖語意、WaveDrom bitfield、Mermaid packet-beta。

```figdown
bitfield gre "GRE Header" unit=32
field C:1, R:1, K:1              # 緊湊形式：逗號分隔的 name:width
field Reserved 9                 # （C bit-field 慣例；名稱可含空白——
field Ver 3                      #   "Protocol Type:16" 不需要引號）
field "Protocol Type" 16 color=#bfdbfe note="rGRE_INT"
field Checksum 16 optional
field Offset 16 optional
wrap                       # 欄位在 unit 中途結束時的顯式換列
```

- `unit=32`——每列位元數（預設 32，普查中的最常見情況）。
- 寬度以位元計；renderer 計算位元索引並繪製刻度尺。
- 寬度為位元數，或 `*` = **變長欄位**：填滿本列剩餘空間；若 `*`
  正好出現在列邊界，佔滿完整一列（RFC 圖中 Payload/Data 尾欄的
  正確形狀——不再需要假的固定寬度，也不會留下半空的列）。
- 兩種欄位形式。傳統：`field <名> <寬|*> [optional] [color=] [note=]`。
  緊湊（C bit-field 慣例，適合旗標串）：`field a:1, b:1, Long
  Name:16`——逗號分隔項目、最後一個冒號之前都是名稱（可含空白、
  免引號）、不接受逐欄選項；項目**必須**以逗號分隔（漏打逗號會
  被攔下而非誤解析）。傳統與緊湊兩種形式語意等價；同一 `field`
  行只用其中一種形式，永不混用。
- `numbering=lsb0|msb0`——位元編號慣例。`lsb0`（預設）：bit 0 為
  最低位，尺標由左至右 N-1…0（硬體暫存器風格——依 R16「預設值按
  template 桶統計」，這是本語料 bitfield 桶的主流慣例）。`msb0`：
  bit 0 為最高位，尺標 0…N-1（IETF RFC 風格）。欄位擺放順序不受
  影響——一律按宣告順序由左至右填入，只有尺標數字改變。
- `optional` 渲染為慣例的虛線框（依語料風格）。

### 4.2 `table` — 配置/狀態表、記憶體映射（普查第 3，加權 9.6%）

```figdown
table fib "FIB Table"
| Route          || Forwarding    ||
| Prefix | Next Hop | Port | VRF   |
|--------|:--------:|------|-------|
| 10.0.0.0/8  | R2  | p1  | default |
| 10.1.0.0/16 | R4  | p2  | default |
| ^^          | R3  | p2  | default |
colw auto 90 auto 25%              # 選用欄寬（auto | px | %）
cell 2 highlight                   # 整列高亮（資料列 1 起算）
cell 3,2 color=#dbeafe             # 儲存格級標註
cell h1,1 color=#eeede6            # 表頭層定址為 h1..hN，由上往下
```

- **表格內容原封使用 GFM 管線語法**（D5，落實 R18：GFM 表格是
  使用率最高的文字表格格式——現有 Markdown 表格貼上即用；LLM
  生成它幾乎零幻覺）。`|` 是註冊的行首 token，封閉文法不破。
- `|---|` 分隔列必須存在（GFM 的招牌）；`:` 冒號給出各欄對齊
  （左/中/右；資料預設靠左、表頭置中）。分隔列之前的列都是表頭
  層——多列 = 多層表頭。
- **合併跟隨 markdown-it-multimd-table**（採用度最高的 MD 合併
  擴充，因為核心 GFM 沒有 spans）：`||`（兩管線間空無一物）＝
  左格向右延伸（colspan）；儲存格內容恰為 `^^` ＝ 與上格合併
  （rowspan）。`\|` 為字面管線、`\^^` 為字面字元。分別不得出現
  在第一欄/第一列（行錯誤）。
- 管線列內不辨識註解（儲存格文字為原文）。
- GFM 之外的 FigDown 能力維持關鍵字行：`cell <r>,<c> color=…`
  （儲存格標註）、`cell <r> highlight`（整列高亮）、`colw`
  （每欄一個寬度：`auto`｜`<px>`｜自然總寬的 `<n>%`；數量不符
  為行錯誤）——標註附著於定址，讓表格列保持可直接貼上的乾淨。
  定址：表頭層為 `h1..hN`、由上往下；資料列為分隔列以下的
  `1..`。標註若指向被 `^^`/`||` 合併掉的儲存格**必須**拒絕——
  請標註錨點儲存格。
- **特徵集已以普查 `table-matrix` 桶 212 張樣本驗收（R17，
  2026-07-02）**：cellcolor 58.5%、merged 41.5%、headercol 41.0%、
  multiheader 34.9% 為 must-have（皆已入草案）；multitable 20.8%
  （已涵蓋——一份文件多個 table 區塊）、colwidth 20.3%（OQ-S3）、
  symbol 11.8%（已涵蓋——儲存格值可用 Unicode）、rowhl 12.3%
  （已涵蓋——`highlight`）。依證據砍掉（v0.1）：混合對齊（1.4%）
  與旋轉文字（0.5%）。partialborder 17.0% 與 memmap 14.2% 列
  v0.2 候選。
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

一字元 = 一 tick。v0.1 的軌道字母表**封閉且完整**：`0` 低準位 ·
`1` 高準位 · `p` 正緣時脈 · `n` 負緣時脈 · `x` 未定 · `=` 資料格
（以 `labels=` 命名）· `.` 延續前值 · `0-9` 字面資料值。任何其他
字元為行錯誤；其餘 WaveDrom 字元保留給未來版本。注意 `gap` 的
兩種含義：`gap <tick>` 是 wave 區塊的子指令（視覺時間斷點）；
`gap=<px>` 是群組的排版選項——兩個作用域永不重疊。

### 4.4 `plot` — 由表格數據作圖（**實驗性**，v0.1 非規範）

```figdown
plot hm level=40        # hm 為 table id：列→X、欄→Y、儲存格→Z
```

表格就是數據（R28——不設第二套資料語法）；`plot` 把它映射成
圖表。首個 kind：`bars3d`，確定性等角投影（固定遮擋順序、不需
真 3D），選用的半透明 `level` 門檻平面——即 §2.6 導引線的三維
親戚。chart 家族在普查中屬少數（約 1%），因此 `plot` 以**實驗性**
功能出貨：實作**可以**支援；它不屬於 v0.1 一致性表面。但它示範
的原則具規範精神：未來的圖表功能**應**重用 table 區塊作為資料源。

### 4.5 優先順序備註

`block-architecture`（普查第 1，加權 24.3%）**不需要型別區塊**——它
就是核心場景模型（§2）；flowchart（8.3%，第 4）與 topology（5.0%）
也收攏進同一模型。普查定案的算術：核心場景（37.6%）
+ bitfield（23.7%）+ table（9.6%）+ wave（7.2%）= **非模板圖出現
次數的 78%，約等於可分類圖形的 95%**（[census.zh-tw.md](census.zh-tw.md)）。

## 5. 展現屬性（R5）

任何元素上皆為選用：`color=`（填色）、`stroke=`、`text=`（文字色）、
`style=solid|dashed|dotted`、`layer=`；群組另有 `gap=`。
尺寸專屬於 `size` 指令——`node` 行上的 `w=`/`h=` 是錯誤（一種
機制，不設兩種）。其餘（字型、間距、箭頭、走線）屬於
renderer/主題，不屬於語言。

規範性邊界（「展現可忽略」不變量，R25 的延伸）：移除所有純展現
屬性（`color`、`stroke`、`text`、`style`、`gap`、`z`）與佈局指令
（`pin`、`size`）**不得**改變文件的語意結構；語意消費者**可以**
忽略它們。因此**顏色與樣式不得是語意的唯一載體**——若顏色/虛線
代表狀態、角色、平面或分類，該語意**應**同時出現在文字或語意
註記中。語意配色 profile 日後可疊加；文件場景維持顏色自由。
（化解 R5 的張力）

## 6. 動態——保留、不規範（R1、R2）

`page`/`step` 為保留關鍵字。草圖（非規範性）：

```figdown
page "After ARP resolution"
set r1.fib row="10.1.0.0/16 R4 p2"    # 對靜態場景的黏滯增量
pulse r1                                # 瞬時高亮
```

動態 = 靜態場景 + 有序的 page 增量序列（分黏滯與瞬時兩類）。
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
- 未知 `shape`、重複 ID、懸空的 edge 端點、`in=` 循環、bitfield
  寬度溢出、table 列欄不符 → 一律行錯誤。
- 有錯誤的文件不渲染任何輸出（不做 partial/best-effort——確定性
  優先於方便）。

## 9. 語法未決問題

- ~~OQ-S1：縮排區塊語法糖~~——**否決**（第二套包含語法；R28）。
- ~~OQ-S2：`pin at=` 的單位~~——已定案：相對於定位上下文的 px（§3）。
- ~~OQ-S3：欄寬~~——已定案：`colw` 進入 v0.1（§4.2）；混合逐欄
  對齊維持出局（普查 1.4%）。
- ~~OQ-S4：edge 標籤位置微調~~——**v0.1 否決**（純展現；會招來
  像素級手調）。使用者裁示 2026-07-10：現在保守收斂；若日後真實
  圖形有需求可以再補——R31 之下「新增」是便宜的，且三位置模型
  （§2.3）已把「*哪個位置*」作為語意承載。
- ~~OQ-S5：多圖文件~~——已定案：一個 `.fd` 產出一個 `.svg` 產物；
  文件**可以**含多個頂層區塊，按文件順序合成。
- ~~OQ-S6：與 D2 的關係~~——資訊性附錄：
  [prior-art.zh-tw.md](prior-art.zh-tw.md) §3。
- ~~OQ-S7：edge 標籤~~——**已定案（2026-07-10）**：行內標籤、
  三個有意義的位置，`edge A [tail] <-[mid]-> [head] B`（§2.3）；
  `<-` 加入運算子集；`label=`／`taillabel=`／`headlabel=` 退役
  （migration 0.1-dev.9）。調查：
  [prior-art.zh-tw.md](prior-art.zh-tw.md) §1。

## 10. 關鍵字註冊表、一致性模式、擴充

**註冊表（v0.1）。** 頂層關鍵字（16 個）：
`figdown title node group edge layer flow rank bundle line fill pin
size bitfield table wave`——加上表格列行首 token `|`。
型別區塊子關鍵字（6 個）：`field wrap cell colw signal gap`。
動態 profile 保留：`page step set pulse`。
實驗性（v0.1 一致性表面之外）：`plot`。
每個註冊集合（關鍵字、選項鍵、shape/style 列舉、edge 運算子、
numbering 值、wave 軌道字元、合併標記）皆封閉；新增遵循變更政策
（R28 關卡）並以 migration 條目落地。

**一致性模式（嚴格/寬鬆）。**
- *嚴格*（撰寫情境，AI 寫→驗→修）：未知關鍵字、未知選項、格式
  錯誤的行、不支援的註冊值 → 行錯誤；有錯誤的文件**不得**渲染。
- *寬鬆*（存量文件、檢視器）：未知的 `x-` 擴充行**可以**忽略並
  警告；核心語法錯誤仍然失敗。

**擴充命名空間。** 以 `x-` 開頭的關鍵字與選項鍵保留給實驗性/廠商
擴充；標準關鍵字**不得**以 `x-` 開頭。嚴格模式除非明確啟用，
否則拒絕未知的 `x-` 行。

**可教學性檢查（R7）。** 目標：完整 AI 撰寫指南 ≤120 行（見
AGENT-GUIDE.zh-tw.md §5）。任何使頂層關鍵字超過約 20 個的新增，
必須通過 R28 關卡。

## 11. 文法速寫（ABNF，凍結前為資訊性）

```abnf
document       = header *line
header         = "figdown" SP version [SP template] eol
line           = directive-line / table-row / comment-line / blank-line
directive-line = keyword *(SP argument) [SP comment] eol
argument       = qstring / option / bare-token
option         = option-key "=" option-value
keyword        = lower-alpha *(lower-alpha / DIGIT / "-")
id             = (ALPHA / "_") *(ALPHA / DIGIT / "_" / "-")
qstring        = DQUOTE *(qchar / escape) DQUOTE
escape         = "\" ("n" / DQUOTE / "\")
table-row      = "|" cell-content *("|" cell-content) "|" eol
comment-line   = *WSP "#" *VCHAR eol
```

規範重點不在這份 ABNF 本身，而在於：文法**必須**可以不參考
參考實作（PoC）而被機械式實作。
