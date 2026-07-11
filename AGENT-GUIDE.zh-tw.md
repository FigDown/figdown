# FigDown Agent 指南（v0.1 草案）

> 對象：被要求以 FigDown 建立或維護 Markdown 文件中圖片的
> **AI agents**。本檔自足——新的 session 指到這裡即可開工。完整
> 規範見 [syntax-draft.zh-tw.md](spec/syntax-draft.zh-tw.md)；版本變更見
> [MIGRATIONS.zh-tw.md](spec/MIGRATIONS.zh-tw.md)。
>
> English version: [AGENT-GUIDE.md](AGENT-GUIDE.md)

## 1. 模型

一張圖以一個 `.fd` 文字檔存在——**唯一真相來源**。可類比為裝在
同一個小檔案裡的 HTML+CSS：結構與關係（節點、連線、群組、表格、
欄位）是內容；`pin`/`size`/`color` 行是展現參數，唯一職責是讓渲染
結果**穩定**（同來源 → 位元級同 SVG；小修改 → 小視覺變化）。SVG
是給人眼的確定性投影，且內嵌自身來源與其 SHA-256
（`<metadata id="figdown-source">`）。

## 2. 閱讀規則（如何理解一張圖）

- 要了解圖的**意義**，讀它的 `.fd`——絕不 OCR SVG。
- Markdown 文件中，每張圖是內嵌 SVG 加一行指向其 `.fd` 的註腳
  （見 §3）。循該路徑取檔。
- 若 `.fd` 遺失，從 SVG 內嵌 metadata 還原來源；若內嵌 SHA-256 與
  還原文字不符，代表 SVG 在生成後被改過——以 `.fd` 為真相並重新
  生成。
- **意義只由語法推導，永不由繪圖幾何推斷**（R37）。各區塊規則：
  - *bitfield*：第 *k* 個欄位的位元 offset = 前面所有宣告寬度的
    總和；**沒有隱含填充**（真實 padding 一律是顯式欄位）；
    `wrap` 只是繪圖換列——其後的空白格不是位元；`numbering=`
    只改尺標標籤；`optional` 欄位之後的 offset 只在其存在時成立。
  - *table*：邏輯網格 = 管線列 + `^^`／`||` 合併（錨定左上）；
    `colw`、顏色、對齊永不改變網格。
  - *wave*：第 *t* 個 tick = 軌道第 *t* 個字元，`.` 延續前值；
    tick 跨 `gap` 保持連續。

## 3. Markdown 文件的嵌入慣例（現階段）

在 `.fd` 尚未被 MD viewer 原生渲染（如 mermaid 那樣）之前，本專案
的建議用法：

```markdown
![Ingress datapath](figures/ingress.svg)

<sub>source: [figures/ingress.fd](figures/ingress.fd)</sub>
```

- 只嵌入 **SVG**；絕不把 `.fd` 內容貼進 `.md`。
- 一律加上 `source:` 註腳指向 `.fd` 路徑——那個檔案才是圖的來源
  與 AI 可讀的意義。
- `X.fd` 與 `X.svg` 同名並列存放。

## 4. 維護工作流

1. 編輯 `.fd`（永不編輯 SVG）。
2. 重建：`node tools/build-svg.js <file.fd>`——同時驗證與渲染。
   錯誤格式為 `Line N: message`；修正後重跑直到 OK。
3. `.fd` 與 `.svg` 一起 commit。

編輯時的穩定性規則：
- 明確值（`pin`、`size`、`color`）是剛性約束——renderer 繞著它們
  安排其餘。只動你真正要改的東西。
- 編輯器物化的佈局收在尾部 `# --- layout ... ---` 區；其上的結構
  自身即完整（刪光 `pin`/`size` 行必須留下相同結構——此為規格
  不變量）。
- 以正確的 scope 陳述語意：所有欄位共用的配置是一筆群組級
  `line`/`fill`；逐元素的事實掛在節點上。畫面可能相同——文字上
  的差異才是知識。

## 5. 轉寫既有圖（來源為 spec/圖片原稿）

轉寫是**語意重建，不是描摹**：先還原原圖*在說什麼*，再用
FigDown 陳述那個意義——永不為了幾何而抄幾何。

- **逐列驗算位元總寬。** 每個 bitfield 列都把宣告寬度加總、對照
  原圖尺標——多列 encoding-variant 圖最容易默默漂移。
- **絕不腦補。** 原圖模糊或不可讀時，不得發明欄位、位元或連線
  ——以 `#` 註解標記不確定點並交人工覆核。
- **記錄出處。** 在 `.fd` 開頭以 `#` 註解記下原圖檔名、內容雜湊、
  spec 章節錨——轉寫保持可稽核。
- **逐節點註記**：空間鄰近本身承載語意時，用一個貼著目標的小型
  `style=dashed` 節點＋點線 edge；若是密集表格式資料，集中一張
  `table` 才是更好的轉寫。依語意選擇（R29）——兩者皆為正解。
- **條件式編碼**（同段位元依模式重新解釋）：現行慣例是欄位上
  `note="valid when …"` ＋人工覆核標記（一級構件由 OQ-S9 追蹤）。
- **複合原圖**（一張圖兩個概念區）：拆成一概念一 `.fd`，由
  Markdown 文件負責並排。
- template 永不限制表達力：有向、帶色的 edge 在 `topology` 下與
  `block` 下完全相同。

## 6. 核心語法速查

```figdown
figdown 0.1 <template>      # 必要首行；template ∈
                            # block|topology|flowchart|bitfield|table|wave
title "..."                 # 選用，吃掉整行剩餘內容；
                            # 引號內跳脫僅限 \n \" \\

# 核心場景（block / topology / flowchart）
node a "Label" [shape=rounded|circle|ellipse|cloud|diamond|cylinder]
               [color=#hex] [style=dashed] [in=<group>]
group g "Label" [gap=0]     # 容器；gap=0 使成員貼齊
edge a -> b [style=dashed] [color=#hex]  # 運算子：-> <- -- <->
edge a -[label]-> b         # 線上標籤把運算子拆開
edge a [p1] -- [p2] b       # 端點標籤（埠/基數/角色）
                            # [flags[3:0]] 可巢狀；\n 或不平衡括號
                            # 用 ["..."]（套用字串跳脫）
flow right|down             # 佈局方向
rank a b c                  # 同列/同欄
pin a at=x,y                # 絕對 px；群組成員為群組局部座標
size a w=120 h=60
line "Cap" in=g at=80%      # 橫跨群組的門檻標記線
fill 15% in=g color=#hex    # 著色帶；fill 15-35% = 顯式範圍；
                            # dir=up|down|left|right（預設 up）
bundle b1 "LAG" a--c, b--c  # 鏈路捆綁：虛線圈自動繪製

# bitfield（預設 lsb0 暫存器風格；RFC 風格用 numbering=msb0）
bitfield x "Title" unit=32 [numbering=msb0]
field Name 16 [optional] [color=#hex] [note="..."]
field a:1, b:2, Long Name:16     # 緊湊形式；寬度 * = 填滿本列
field Marker 128                 # 寬於 unit → 自動跨列
                                 # （這是「一個」欄位——永不手動拆開）
wrap                             # 只用於顯式的列中換列

# table（原封 GFM；^^ rowspan、|| colspan、\| 字面管線）
table t "Title"
| A | B |
|---|:-:|
| 1 | 2 |
colw auto 25%                # 選用欄寬（auto | px | %）
cell 1,2 color=#hex          # 資料列 1 起算；表頭層 h1..hN 由上往下
cell h1,1 color=#hex         # 勿標註被合併掉的格——標註錨點格
cell 1 highlight
plot t level=40              # 實驗性：由表格數值繪製 X-Y-Z 長條

# wave（WaveDrom 式軌道；p 時脈、0/1、x 未定、= 資料、. 延續）
wave w "Title"
signal clk pppppppp
signal d   x.==..x. labels="A,B"
```

文法是封閉的：任何未知行/關鍵字/選項都是帶行號的錯誤。不要發明
語法——若覺得缺什麼，用上述構件組合表達，或回報維護者。
標頭的 template 只挑選*預設值*——永不限制哪些指令可用。`flow`
是文件層級。id（`node a`、`bitfield x`、`table t`）必填、只為
被引用而存在。

## 7. 版本

標頭釘住版本（`figdown 0.1`）。規格演進時，每次變更在
[MIGRATIONS.zh-tw.md](spec/MIGRATIONS.zh-tw.md) 附機械式改寫規則；升級
文件 = 依序套用條目。永不在同一檔案默默混用不同世代的語法。
