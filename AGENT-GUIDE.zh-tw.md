# FigDown Agent 指南（v0.1 草案）

> 對象：被要求以 FigDown 建立或維護 Markdown 文件中圖片的
> **AI agents**。本檔自足——新的 session 指到這裡即可開工。完整
> 規範見 [syntax-draft.zh-tw.md](syntax-draft.zh-tw.md)；版本變更見
> [MIGRATIONS.zh-tw.md](MIGRATIONS.zh-tw.md)。
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

## 5. 核心語法速查

```figdown
figdown 0.1 <template>      # 必要首行；template ∈
                            # block|topology|flowchart|bitfield|table|wave
title "..."                 # 選用；引號內 "\n" = 換行

# 核心場景（block / topology / flowchart）
node a "Label" [shape=rounded|circle|ellipse|cloud|diamond|cylinder]
               [color=#hex] [style=dashed] [in=<group>]
group g "Label" [gap=0]     # 容器；gap=0 使成員貼齊
edge a -> b [label="..."] [taillabel="p1"] [headlabel="p2"] [style=dashed]
edge a -- b                 # 無向；a <-> b 雙向
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
wrap

# table（原封 GFM；^^ rowspan、|| colspan、\| 字面管線）
table t "Title"
| A | B |
|---|:-:|
| 1 | 2 |
cell 1,2 color=#hex          # 第 0 列 = 最底層表頭
cell 1 highlight
plot t level=40              # 由表格數值繪製 X-Y-Z 長條

# wave（WaveDrom 式軌道；p 時脈、0/1、x 未定、= 資料、. 延續）
wave w "Title"
signal clk pppppppp
signal d   x.==..x. labels="A,B"
```

文法是封閉的：任何未知行/關鍵字/選項都是帶行號的錯誤。不要發明
語法——若覺得缺什麼，用上述構件組合表達，或回報維護者。

## 6. 版本

標頭釘住版本（`figdown 0.1`）。規格演進時，每次變更在
[MIGRATIONS.zh-tw.md](MIGRATIONS.zh-tw.md) 附機械式改寫規則；升級
文件 = 依序套用條目。永不在同一檔案默默混用不同世代的語法。
