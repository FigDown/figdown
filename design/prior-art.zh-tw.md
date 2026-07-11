# FigDown 先行標準與慣例調查（資訊性）

> 狀態：**資訊性**，2026-07-10。方法依 R18：FigDown 採納任何慣例
> 之前，先調查主流 text-to-diagram 語言的做法，**以採用度加權**——
> 首要動機是防幻覺（LLM 已經認得主流拼法），次要是人類熟悉度。
> 以下語法主張均已對照各語言官方文件核實，非憑記憶。
>
> English version: [prior-art.md](prior-art.md)

全文採用的採用度權重（約略，按 Markdown 生態滲透與安裝基數）：
**Mermaid ≫ PlantUML > Graphviz/DOT > D2 > DBML/WaveDrom（領域專用）**。

## 1. Edge 標籤——三位置模型（餵給 OQ-S7）

### 1.1 主流做法

| 語言 | 線中標籤 | 端點標籤（靠近起點/終點） |
|---|---|---|
| Mermaid flowchart | `A -->|text| B` **或** `A -- text --> B`（運算子繞著標籤拆開） | 無 |
| Mermaid ER | 關係後接 `: label` | 基數烙進運算子的鴉爪 ASCII（`PROPERTY ||--|{ ROOM : contains`） |
| PlantUML | `A --> B : label` | **行內引號字串貼著端點**：`Class1 "1" *-- "many" Class2 : contains` |
| Graphviz DOT | `label=` | `taillabel=`／`headlabel=` 屬性（另有 `labeldistance`/`labelangle` 像素微調） |
| D2 | `A -> B: label` | `source-arrowhead.label`／`target-arrowhead.label`（建議簡短；無自動擺位最佳化） |

### 1.2 調查結論

1. **三位置模型是共識。** 每個被調查的語言都收斂在一條邊最多三個
   有意義的標籤位置：靠尾、線上、靠頭。Graphviz 直接命名
   （`taillabel`/`label`/`headlabel`）；PlantUML 與 D2 有對應拼法；
   Mermaid flowchart 只覆蓋中間。沒有任何語言提供超過三個位置。
2. **行內擺放有強先例。** PlantUML 把端點標籤*行內、貼著端點名*
   ——文字順序鏡射圖面。Mermaid 的第二種線中標籤形式把運算子繞著
   標籤拆開（`A -- text --> B`）——標籤在文字裡就「躺在線上」，
   與圖面一致。
3. **像素級擺位微調是例外而非慣例。** 只有 Graphviz 提供
   `labeldistance`/`labelangle`；Mermaid、PlantUML、D2 都沒有。
   這支持 OQ-S4（px 偏移提示）維持否決：主流把「*哪個位置*」視為
   語意、「*確切在哪*」交給 renderer。

### 1.3 對 FigDown 的含義（**已採納** 2026-07-10——以 migration 0.1-dev.9 落地）

使用者需求（R34）：連線兩端常需要說明角色/意義，且一條線**最多
三個有意義的位置**。提案拼法——標籤行內出現在它於圖面所占的
位置（R22：文字是圖的一維編碼）：

```figdown
edge customer [1] -[places]-> [N] order
edge peer1 [initiator] <-[3-way handshake]-> [responder] peer2
edge a -[只有線上標籤]- b
```

- 三個位置的中括號標籤皆為選用。
- 運算子繞著線中標籤拆成兩半：左半 `-` 或 `<-`，右半 `-` 或
  `->`；無標籤的完整運算子維持 `--` `->` `<-` `<->`。這鏡射
  Mermaid 的 `A -- text --> B` 拆運算子慣例。
- 分隔符選 `[...]` 而非 PlantUML 的引號或 Mermaid 的管線：引號在
  FigDown 詞法裡已是通用字串 token，`|` 是表格列的行首 token——
  中括號是我們封閉文法裡唯一無歧義的選擇。（PlantUML 證明的是
  「行內端點標籤」屬於主流；分隔符本身跨語言並無共識可循。）
- `label=`／`taillabel=`／`headlabel=` 於同版退役
  （R28：一種機制），附機械式遷移：
  `edge A -> B label="x" taillabel="t" headlabel="h"` →
  `edge A [t] -[x]-> [h] B`。
- `<-` 進入註冊表（R35；D2 先例——其運算子集恰為 `--` `->` `<-`
  `<->`）。寫 `Left <- Right` 不該被迫改寫成 `Right -> Left`。
- 中括號內容（2026-07-10 裁定）：內部平衡的中括號原樣巢狀
  （`[flags[3:0]]` 直接可用）；不平衡括號／`\n`／字面引號改用
  引號形式 `["..."]`、套用標準字串跳脫——Mermaid「形狀內引號」
  先例（`id1["text with [brackets]"]`）；空 `[]` 為行錯誤。

## 2. ERD 慣例（餵給 R36）

### 2.1 主流做法

| 語言 | 實體+屬性 | 鍵標註 | 關係+基數 |
|---|---|---|---|
| Mermaid ER | 屬性區塊：`CUSTOMER { int id PK, string name, string email UK }` | 逐屬性 `PK` `FK` `UK` | 鴉爪運算子：`\|o` 零或一、`\|\|` 恰一、`}o` 零或多、`}\|` 一或多；`--` 識別、`..` 非識別；`:` 後接標籤 |
| D2 | `shape: sql_table` + 型別欄位；`constraint: primary_key` | constraints | 一般連線；箭頭形狀含鴉爪變體（`cf-one`、`cf-many`） |
| PlantUML | `entity` 區塊（IE 記法） | 欄位標記 | 端點引號基數 + `: label` |
| DBML | `Table users { id int [pk] }` | `[pk]` 等 | `Ref: orders.user_id > users.id`——FK 引用到**欄位層級** |

### 2.2 調查結論

1. 共同語意核心很小：實體 = 有標題的型別屬性記錄（含鍵標註）；
   關係 = 兩端各一個基數、加一個動詞標籤的連線。
2. 基數有兩種表達：**烙進運算子**的鴉爪 ASCII（Mermaid ER），或
   **端點標籤**（PlantUML）。鴉爪運算子緊湊，但正是 FigDown 避免
   的 ASCII-art 詞彙（要教 8 個以上的雙字元符號；對非 DB 讀者
   可讀性低）。端點標籤零新詞彙就承載相同語意。
3. 只有 DBML 把 FK 的**欄位對欄位**引用做成機器可讀。Mermaid ER
   的 `FK` 只是逐屬性標註；它參與哪條關係仍是隱含的。

### 2.3 建議（兩層，依使用者裁示 R36）

- **第一層——現在，blocks 優先**：ERD 今天就能以核心構件表達：
  一實體一 `node`（標籤首行 = 名稱、後續行 = 屬性、`PK`/`FK` 為
  純文字）、一關係一 `edge`、基數用端點標籤（§1.3 落地後；現行
  為 `taillabel=`/`headlabel=`）。以 pattern 形式入藝廊；**零新
  詞彙**。
- **第二層——v0.2 候選，過 R28 關卡**：語意化的 `entity` 型別
  區塊（Mermaid ER 形狀：型別屬性 + PK/FK/UK 標註）能讓屬性與
  鍵角色機器可讀。關卡：語料證據（普查裡沒有 ERD 桶）**且**證明
  第一層確實遺失 agent 需要的語意。若採納，屬性文法跟隨 Mermaid
  erDiagram（採用度最高）；基數以端點標籤表達，不採鴉爪運算子。

## 3. 與 D2 的關係（OQ1——依 OQ-S6 的資訊性附錄）

**D2 是什麼。** Terrastruct 公司的現代開源圖語言（MPL-2.0），與
Mermaid 同類但語言設計更完整（嵌套、樣式系統、多排版引擎）。其
旗艦排版引擎 TALA 為**專有**（閉源、僅免費額度）；開放引擎為
dagre/ELK。

**OQ1 實際在問什麼。** 「站在 D2 上」可以指三件不同的事，答案
各異：

- **(a) D2 作為基底語言**——FigDown 文件是合法 D2（或其超集/
  profile）。**建議關閉此選項。** 理由：D2 在 Markdown 讀取端
  滲透近零（GitHub/GitLab 無原生渲染——2026-07-02 已查證），
  沒有生態可繼承；D2 文法是開放的（未知語法不是行錯誤），與
  我們的封閉文法公理不相容；且 D2 不承諾排版穩定性（R8）——
  其 dagre/ELK 全域重排正是 FigDown 存在要避免的行為。
- **(b) 借語言設計**——已在做（§1.3 的 `-- -> <- <->` 運算子
  家族與 D2 完全一致；`key=value` 選項；調查習慣本身）。
- **(c) D2 作為 renderer 後端／互通目標**——`figdown → d2`
  匯出器能讓使用者一次性借用 D2 的視覺打磨（接受 D2 輸出無穩定
  性保證）。這是唯一還活著的子問題，且不屬於 v0.1。

**建議**：OQ1 以「不作為基底語言」結案，剩餘部分改列為 v0.2 的
匯出器/互通問題。

**裁示（2026-07-10）**：採納——OQ1 依建議結案。

## 4. Legend 機制（餵給 OQ-S8）

### 4.1 主流做法

| 語言 | Legend | 機器可讀的綁定？ |
|---|---|---|
| PlantUML | 原生 `legend [left\|right\|top\|bottom\|center] … endlegend` | 無——自由文字框；條目與元素零連結 |
| D2 | `vars.d2-legend`：宣告帶標籤與樣式的樣本 shape/connection，legend 渲染這些樣本 | 無——條目是帶樣式的*假元素*；真實元素未與之連結 |
| Mermaid | **無**（長年 feature request；使用者以假 subgraph 湊 legend） | `classDef name fill:…` + `class n1,n2 name`／`:::` 把**具名樣式類**綁上元素——但無意義文字、無 legend |
| Graphviz | 無（替代：HTML-like label 表格／樣本 cluster） | 無 |

### 4.2 調查結論

1. 每個生態都需要 legend（PlantUML、D2 都出了；Mermaid 使用者
   一直在要），但**沒有任何被調查語言把「意義」機器可讀地綁到
   「一類元素」上**——PlantUML 是自由文字、D2 的條目是脫離真實
   元素的假樣本。
2. Mermaid 的 `classDef`/`class` 是「命名」這一半按採用度加權的
   prior art：具名類綁上元素、樣式宣告一次。它缺意義標籤與
   衍生 legend。
3. FigDown §5 規則（「顏色不得為語意唯一載體」）目前沒有語言內
   機制——作者只能在散文或逐邊標籤重複意義。這正是下游回饋
   撞到的缺口（一張圖三種流向色）。

### 4.3 候選設計（**提案**——待語料頻率＋裁決）

把意義與樣式綁到**具名類**、legend 由此衍生——語意優先的形狀
（R24：說出意義，繪圖慣例歸引擎）：

```figdown
class vidp "VID_P (primary VLAN)"   color=#dc2626
class vidc "VID_C (community VLAN)" color=#2563eb
edge p1 -> p2 class=vidp
edge p2 -> p3 class=vidc
```

- 一行 `class` = 意義文字＋展現預設，宣告一次（Mermaid
  `classDef` 傳承；R5 的 HTML+CSS 類比在此變成字面事實）。
  任何元素以 `class=` 套用。
- Legend 條**自動衍生**——有 class 就畫，如 `bundle` 的圈；
  無座標、無假元素。
- R37 紅利：agent 直接在 edge 上讀到 `class=vidp`——不用拿
  hex 色值去對照旁表。
- §5 的「展現可忽略」不變量自然細化：從 `class` 行剝除
  `color=`/`style=` 不損失語意；類的*名字與意義*留下。
- v0.1 現行替代（已認可）：小型 `table` 配儲存格色標即為
  legend（每條目兩行；笨重但完整）。
- 過 R28 關卡前：~~補一次語料掃描統計 legend 出現率~~（已完成
  ——§4.4），並裁決 `class` 實務上是否取代逐元素 `color=`。

### 4.4 語料頻率（2026-07-10 實測）

方法：自普查語料分層隨機抽樣 **310 張唯一圖片**（seed 20260710；
block 60、bitfield/flowchart/table/topology 各 40、waveform 30、
state 25、chart 21、sequence 14——後三桶全量），由八個獨立 AI
視覺判讀依固定判準評定（*legend* 必須有專屬圖例區；標題/說明
文字不算）。

| 桶 | n | 顯式 legend | 語意色**無**圖例 | 顏色承載語意（合計） |
|---|---:|---:|---:|---:|
| block-architecture | 60 | 2% | 50% | 52% |
| packet-bitfield | 40 | 0% | 65% | 65% |
| flowchart | 40 | 5% | 60% | 65% |
| table-matrix | 40 | 2% | 42% | 45% |
| timing-waveform | 30 | 3% | 57% | 60% |
| topology | 40 | 18% | 60% | 78% |
| state | 25 | 20% | 24% | 44% |
| chart | 21 | 0% | 76% | 76% |
| sequence | 14 | 7% | 79% | 86% |
| **整體（未加權）** | 310 | **5.8%** | **55.2%** | **61.0%** |
| **整體（普查加權）** | — | **3.1%** | **56.0%** | **59.1%** |

**解讀。** 顯式 legend 很少（≈3–6%）——作為*繪圖功能*，legend
過不了 R28 的頻率關。但這次調查暴露了真正的數字：**56% 的語料
圖以顏色/線型承載分類語意、卻沒有任何地方陳述對映**——全靠
讀者自行推斷。點陣圖時代人類還應付得來；FigDown 轉寫後，agent
讀到 `color=#dc2626` 什麼都還原不出（R37 的盲區在語料尺度上
現形）。因此證據支持的是 `class` **作為那 56% 的語意載體**，
而非 legend 渲染器：逐元素的類別歸屬今天無法表達，除非到處
重複標籤文字（而節點填色常常根本沒有標籤位置）。自動衍生的
legend 條是順帶紅利，同時把那 3% 也一起覆蓋。
