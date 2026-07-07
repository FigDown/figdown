# 結構模式庫

> 十四個去識別化的結構骨架，蒸餾自真實 774 份文件語料的圖型普查：
> 每個主要圖型家族由 agents 閱讀真實樣本、僅以通用佔位標籤重新
> 表達**結構本身**——無內容、無術語、無指紋。當作起手模板用：
> 換掉標籤、保留形狀。
>
> English version: [index.md](index.md)

## 方塊與架構
- [block-a](block-a.fd) — 平行通道匯入收集器
  ![block-a](block-a.svg)
- [block-b](block-b.fd) — 容器分層與跨層虛線回饋
  ![block-b](block-b.svg)

## 暫存器/封包位元佈局
- [bitfield-a](bitfield-a.fd) — 單一控制字：旗標串 + 寬欄位 + 保留位（lsb0）
  ![bitfield-a](bitfield-a.svg)
- [bitfield-b](bitfield-b.fd) — 多字組描述子與變長尾欄
  ![bitfield-b](bitfield-b.svg)

## 表格
- [table-a](table-a.fd) — 雙層合併表頭 + rowspan 標籤欄
  ![table-a](table-a.svg)
- [table-b](table-b.fd) — rowspan/colspan 合併 + 儲存格上色 + 整列高亮
  ![table-b](table-b.svg)

## 流程圖
- [flowchart-a](flowchart-a.fd) — 兩個連續決策、分支匯合
  ![flowchart-a](flowchart-a.svg)
- [flowchart-b](flowchart-b.fd) — 重試迴圈
  ![flowchart-b](flowchart-b.svg)

## 時序/波形
- [wave-a](wave-a.fd) — 時脈化的 request/acknowledge 交握
  ![wave-a](wave-a.svg)
- [wave-b](wave-b.fd) — valid + 具名資料匯流排區段
  ![wave-b](wave-b.svg)

## 拓撲
- [topology-a](topology-a.fd) — 雙層全網狀、埠標籤
  ![topology-a](topology-a.svg)
- [topology-b](topology-b.fd) — 鏈狀 + 冗餘配對 + 鏈路捆綁
  ![topology-b](topology-b.svg)

## 狀態機
- [state-a](state-a.fd) — 循環 + retry/abort 回邊
  ![state-a](state-a.svg)
- [state-b](state-b.fd) — 輪輻：多狀態匯回 reset
  ![state-b](state-b.svg)
