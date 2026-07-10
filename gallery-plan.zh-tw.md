# FigDown 範例藝廊 — 規劃

> 推廣策略（R19）：FigDown 靠*有意義的圖*賣，不靠規格書散文。每個
> 範例以 `X.fd` + `X.svg` sidecar 成對入庫（dogfood R14）；藝廊
> index 直接嵌入 SVG——repo 本身就向每位訪客示範「一份來源、兩種
> 讀者」。
>
> English version: [gallery-plan.md](gallery-plan.md)

## E1 — 常見協議標頭（bitfield template）— ✅ 已完成（2026-07-06）

Template 已實作；生產方式是 AI 撰寫 → parser 驗證迴圈。目標集（約 15 個，除註明外皆 `numbering=msb0` RFC 風格）：

Ethernet II · 802.1Q VLAN · ARP · IPv4 · IPv6 · TCP · UDP · ICMP ·
ICMPv6 · GRE（已有）· VXLAN · MPLS label stack · DNS message ·
DHCP message · QUIC long header

驗收：位元組級對照 RFC 正確；單屏內渲染完成。

## E2 — 協議協商過程（sequence template）— 需先設計

TCP 三向交握與拆線 · TLS 1.3 完整/恢復握手 · DHCP DORA · DNS 遞迴
解析 · ARP 請求/回覆 · BGP 建立 · OSPF 鄰接（Hello→Full）·
802.1X/EAP · QUIC 1-RTT

前置：`sequence` template（在*我們的*語料只佔 0.6%，但對本藝廊
瞄準的網路/教學受眾是重心）。設計規則（R18）：借 Mermaid
sequenceDiagram 慣例（`A->>B: SYN`）——Mermaid 最強的正是這裡，
語法必須讓人感覺一模一樣；FigDown 的差異化是穩定性保證與自攜
來源的 SVG 產物。

## E3 — 演算法與資料結構 — 靜態先行、動態後至

先做靜態快照（v0.1 核心 + 型別區塊就能渲染）：陣列/鏈結串列/
堆疊/佇列佈局 · BST 與 heap 形狀（樹 = topology 型）· 鏈結法
雜湊表 · 鄰接串列/矩陣對照 · DP 填表（table template + 儲存格
上色！）· 排序過程逐步圖（一步一個 .fd——頁/幀模型，R1）。

動態版（`page`/`step`）待動態 profile 落地。

## E4 — 數學運算式支援（新需求，R20）

演算法/資料結構圖的標籤需要數學：O(n log n)、Σ、下標（a_i）、
上標（2^k）、分數。R18 主流認定：**`$…$` 包夾的 LaTeX 數學**
（KaTeX/MathJax 慣例；GitHub Markdown 現已原生渲染）。待決設計：
確定性零依賴 renderer 支援*子集*（上下標、希臘字母、常用運算子
以 Unicode 對映）vs. vendor KaTeX（重，但完整）。先做子集，
以 E3 範例實際用到什麼來量測。

## RFC ASCII 驗收集（R23）

RFC ASCII art 是「figures as text」的始祖。精選一批著名 RFC 圖
（封包佈局、訊息階梯、RFC 9293 TCP 狀態機、拓撲草圖）作為驗收集：
清單中每張圖都必須能以 FigDown 表達——並在其上疊加顏色、確定性
與機器可讀語意。

## 生產工作流

1. AI 撰寫（按 template 的撰寫指南）→ PoC parser 迴圈驗證 →
   人工校對。
2. 用確定性 renderer 產出 `X.svg`，成對 commit。
3. `examples/index.md` 嵌入所有 SVG 並連回各自的 `.fd`。
4. 每個範例同時是迴歸測試（golden SVG 快照）。

## 里程碑

- **G1**：examples/ 骨架 + 5 個標頭（Ethernet、IPv4、TCP、UDP、
  VXLAN）+ index 頁。打通管線。
- **G2**：E1 全集 + 3 張靜態 E3 圖（DP 表、BST、雜湊鏈）。
- **G3**：sequence template 設計 → E2 全集。
- **G4**：數學子集（R20）→ 帶註記的 E3 集；動態 profile 出貨後
  做動態 E3。
