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

### 1.3 對 FigDown 的含義（**提案**——尚未凍結）

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
- 若採納，`label=`／`taillabel=`／`headlabel=` 於同版退役
  （R28：一種機制），附機械式遷移：
  `edge A -> B label="x" taillabel="t" headlabel="h"` →
  `edge A [t] -[x]-> [h] B`。
- `<-` 進入註冊表（R35；D2 先例——其運算子集恰為 `--` `->` `<-`
  `<->`）。寫 `Left <- Right` 不該被迫改寫成 `Right -> Left`。
- 凍結前待補細節：`[...]` 內的跳脫規則（字面 `]`）、空 `[]` 是否
  為錯誤。

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
