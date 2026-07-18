// figdown.mjs — FigDown embeddable library (0.1-dev.12)
// GENERATED FILE, DO NOT EDIT. Built from editor/figdown.html.
// Regenerate with: node tools/make-lib.js
'use strict';
var VERSION = "0.1-dev.12";

// ---- engine (extracted verbatim from editor/figdown.html) ----
var __engine = (function () {
const SHAPES = ['box','rounded','circle','ellipse','cloud','diamond','cylinder'];
// Colors are CSS hex (#rgb / #rrggbb) or CSS named colors (spec §1) — the
// 147 CSS/SVG color keywords (lowercase) plus `transparent`. Anything else
// is a line error (closed grammar, 0.1-dev.11).
const CSS_COLORS=new Set(('aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond '+
 'blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan '+
 'darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange '+
 'darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet '+
 'deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite '+
 'gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush '+
 'lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey '+
 'lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow '+
 'lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen '+
 'mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin '+
 'navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise '+
 'palevioletred papayawhip peachpuff peru pink plum powderblue purple red rosybrown royalblue saddlebrown '+
 'salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen '+
 'steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen transparent')
 .split(' '));
const isColor=v=>/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)||CSS_COLORS.has(v);

function tokenize(line){
  // split by whitespace, honoring double quotes
  const toks=[]; let i=0;
  while(i<line.length){
    while(i<line.length && /\s/.test(line[i])) i++;
    if(i>=line.length) break;
    if(line[i]==='"'){
      let j=i+1, s='';
      while(j<line.length && line[j]!=='"'){
        if(line[j]==='\\'){
          const e=line[j+1];
          if(e==='n'){ s+='\n'; j+=2; continue; }
          if(e==='"'){ s+='"'; j+=2; continue; }
          if(e==='\\'){ s+='\\'; j+=2; continue; }
          return {error:'unknown escape "\\'+(e||'')+'" (allowed: \\n \\" \\\\)'};
        }
        s+=line[j]; j++;
      }
      if(j>=line.length) return {error:'unterminated string'};
      toks.push({v:s,q:true}); i=j+1;
    } else {
      let j=i, s='';
      while(j<line.length && !/\s/.test(line[j])){
        if(line[j]==='"'){                        // key="value with spaces"
          j++;
          while(j<line.length && line[j]!=='"'){
            if(line[j]==='\\'){
              const e=line[j+1];
              if(e==='n'){ s+='\n'; j+=2; continue; }
              if(e==='"'){ s+='"'; j+=2; continue; }
              if(e==='\\'){ s+='\\'; j+=2; continue; }
              return {error:'unknown escape "\\'+(e||'')+'" (allowed: \\n \\" \\\\)'};
            }
            s+=line[j]; j++;
          }
          if(j>=line.length) return {error:'unterminated string'};
          j++; continue;
        }
        s+=line[j]; j++;
      }
      toks.push({v:s,q:false}); i=j;
    }
  }
  return {toks};
}
// Option keys are a CLOSED set (two levels, 0.1-dev.11):
//  - a key listed in OPT_KEYS is parsed as an option; whether it is
//    *applicable* is checked per directive against DIRECTIVE_OPTS
//    (a registered-but-inapplicable key is a line error, D3);
//  - a key=value token with an unregistered key is an "unknown option"
//    line error (D12) — except inside wave `signal` lanes, where bare
//    tokens may contain '=' and stay positional (laneMode).
const OPT_KEYS=new Set(['kind','shape','color','stroke','text','in','layer','label',
  'style','z','at','w','h','unit','note','labels','numbering','fill','from','to','gap','dir','level',
  'taillabel','headlabel','class']);
// Applicable option keys per directive. Keys with dedicated diagnostics
// (node kind/w/h, edge label/taillabel/headlabel, line fill, fill from/to)
// are listed so their specific error messages fire. `edge` is consumed by
// parseEdgeLine; `title` takes its rest-of-line verbatim (no options).
const DIRECTIVE_OPTS={
  figdown:[],
  node:['shape','color','stroke','text','style','class','in','layer','kind','w','h'],
  group:['color','gap','class'],
  edge:['style','class','color','layer','label','taillabel','headlabel'],
  layer:['z'], flow:[], rank:[],
  bundle:['color'],
  line:['in','at','color','fill'],
  fill:['in','dir','color','from','to'],
  pin:['at'], size:['w','h'],
  'class':['color','stroke','text','style'],
  bitfield:['unit','numbering'], table:[], wave:[],
  plot:['kind','level'],
  field:['color','class','note'], wrap:[],
  cell:['color','class'], colw:[],
  signal:['labels'], gap:[]
};
function splitOpts(toks, laneMode){
  const pos=[], opts={}, unk=[];
  for(const t of toks){
    const m = !t.q && /^([A-Za-z_][A-Za-z0-9_-]*)=([\s\S]*)$/.exec(t.v);
    if(m && OPT_KEYS.has(m[1])) opts[m[1]]=m[2];
    else if(m && !laneMode) unk.push(m[1]);
    else pos.push(t.v);
  }
  return {pos,opts,unk};
}
const ID_RE=/^[A-Za-z_][A-Za-z0-9_-]*$/;

function parse(text){
  const errs=[];
  const doc={title:'',nodes:[],groups:[],edges:[],layers:[{id:'base',label:'',z:0}],
             flow:'right',ranks:[],pins:{},sizes:{},blocks:[],trunks:[],glines:[],fills:[],
             classes:[]};
  const nodeIds=new Set(), groupIds=new Set(), layerIds=new Set(['base']), classIds=new Set(),
        bundleIds=new Set();
  let cur=null;             // current typed block (bitfield/table/wave)
  let sawHeader=false, firstContent=true;
  const lines=text.split('\n');
  const err=(n,m)=>errs.push('Line '+n+': '+m);

  // R34/R35: edge <id> [tail] <op> [head] <id> — a [mid] label splits the
  // operator into halves: -[x]-  -[x]->  <-[x]-  <-[x]->. Bracket content:
  // balanced brackets nest verbatim ([flags[3:0]] just works); ["..."] takes
  // the standard quoted-string escapes for unbalanced brackets / \n.
  function parseEdgeLine(s,n){
    let i=4; // past 'edge'
    const ws=()=>{ while(i<s.length&&/\s/.test(s[i])) i++; };
    const readId=()=>{ const m=/^[A-Za-z_][A-Za-z0-9_-]*/.exec(s.slice(i));
      if(!m) return null; i+=m[0].length; return m[0]; };
    const readLbl=()=>{               // called at '['
      i++;
      if(s[i]==='"'){                 // ["..."] — quoted content
        i++; let v='';
        while(i<s.length&&s[i]!=='"'){
          if(s[i]==='\\'){ const e=s[i+1];
            if(e==='n'){ v+='\n'; i+=2; continue; }
            if(e==='"'){ v+='"'; i+=2; continue; }
            if(e==='\\'){ v+='\\'; i+=2; continue; }
            return {error:'unknown escape "\\'+(e||'')+'" (allowed: \\n \\" \\\\)'}; }
          v+=s[i]; i++;
        }
        if(i>=s.length) return {error:'unterminated string in [label]'};
        i++;
        if(s[i]!==']') return {error:'expected ] after quoted label'};
        i++;
        if(!v) return {error:'empty [label]'};
        return {v};
      }
      let depth=1,v='';
      while(i<s.length){
        const c=s[i];
        if(c==='[') depth++;
        else if(c===']'){ depth--; if(!depth){ i++;
          v=v.trim();
          if(!v) return {error:'empty [label]'};
          return {v}; } }
        v+=c; i++;
      }
      return {error:'unterminated [label] — for unbalanced brackets use ["..."]'};
    };
    ws(); const a=readId();
    if(!a){ err(n,'edge needs <id> ->|<-|--|<-> <id>'); return; }
    ws(); let tail=null;
    if(s[i]==='['){ const r=readLbl(); if(r.error){ err(n,r.error); return; } tail=r.v; }
    ws();
    let lh=null;
    if(s.startsWith('<-',i)){ lh='<-'; i+=2; }
    else if(s[i]==='-'){ lh='-'; i++; }
    else { err(n,'edge needs an operator: -> <- -- <-> (a [mid] label splits it: -[x]->)'); return; }
    let mid=null, op=null;
    if(s[i]==='['){
      const r=readLbl(); if(r.error){ err(n,r.error); return; } mid=r.v;
      if(s.startsWith('->',i)){ op=lh==='<-'?'<->':'->'; i+=2; }
      else if(s[i]==='-'){ op=lh==='<-'?'<-':'--'; i++; }
      else { err(n,'expected - or -> to close the operator after [label]'); return; }
    } else if(lh==='<-'){
      if(s[i]==='>'){ op='<->'; i++; } else op='<-';
    } else {
      if(s[i]==='-'){ op='--'; i++; }
      else if(s[i]==='>'){ op='->'; i++; }
      else { err(n,'edge needs an operator: -> <- -- <->'); return; }
    }
    ws(); let head=null;
    if(s[i]==='['){ const r=readLbl(); if(r.error){ err(n,r.error); return; } head=r.v; }
    ws(); const b=readId();
    if(!b){ err(n,'edge needs a target id after the operator'); return; }
    const tk2=tokenize(s.slice(i).trim());
    if(tk2.error){ err(n,tk2.error); return; }
    const {pos:p2,opts:o2,unk:u2}=splitOpts(tk2.toks);
    if(u2.length){ err(n,'unknown option "'+u2[0]+'="'); return; }
    if(p2.length){ err(n,'unexpected argument "'+p2[0]+'"'); return; }
    for(const k in o2)
      if(!DIRECTIVE_OPTS.edge.includes(k)){ err(n,'edge does not take '+k+'='); return; }
    for(const k of ['label','taillabel','headlabel'])
      if(o2[k]!==undefined){ err(n,k+'= is retired — write the label inline: edge A [tail] -[mid]-> [head] B (MIGRATIONS 0.1-dev.9)'); return; }
    if(o2.color!==undefined && !isColor(o2.color)){ err(n,'unknown color "'+o2.color+'" (#hex or CSS color name)'); return; }
    if(o2.style!==undefined && !['solid','dashed','dotted'].includes(o2.style)){ err(n,'style must be solid|dashed|dotted'); return; }
    doc.edges.push({a,b,op,tail,mid,head,style:o2.style,cls:o2['class'],
                    color:o2.color,layer:o2.layer||'base',line:n});
  }

  for(let li=0; li<lines.length; li++){
    const n=li+1;
    let raw=lines[li];
    // pipe rows are raw GFM content: no comment stripping inside them
    if(!raw.trimStart().startsWith('|')){
      const hi=findComment(raw); if(hi>=0) raw=raw.slice(0,hi);
    }
    if(!raw.trim()) continue;

    // GFM pipe row (table content)
    if(raw.trim().startsWith('|')){
      if(!cur||cur.type!=='table'){ err(n,'pipe row outside a table block'); continue; }
      const s=raw.trim();
      if(!s.endsWith('|')){ err(n,'pipe row must end with |'); continue; }
      const inner=s.slice(1,-1);
      const segs=[]; let acc='';
      for(let i=0;i<inner.length;i++){
        if(inner[i]==='\\'&&inner[i+1]==='|'){ acc+='|'; i++; }
        else if(inner[i]==='|'){ segs.push(acc); acc=''; }
        else acc+=inner[i];
      }
      segs.push(acc);
      const isSep=segs.every(x=>/^\s*:?-+:?\s*$/.test(x)) && segs.length>0;  // GFM: 1+ hyphens
      if(isSep){
        if(cur.sep){ err(n,'duplicate separator row'); continue; }
        if(!cur.heads.length){ err(n,'separator row before any header row'); continue; }
        if(segs.length!==cur.cols.length){ err(n,'separator has '+segs.length+' columns, expected '+cur.cols.length); continue; }
        cur.sep=true;
        cur.aligns=segs.map(x=>{ x=x.trim();
          const l=x.startsWith(':'), r=x.endsWith(':');
          return l&&r?'center':(r?'right':(l?'left':null)); });
        continue;
      }
      // content row: raw empty segment = colspan-left (multimd "||");
      // cell exactly ^^ = rowspan-up (multimd). The only cell escapes are
      // \| (handled during segmentation) and \^^ (literal caret pair) —
      // any other leading backslash is literal cell text (D10).
      const cells=segs.map(x=>{
        if(x.length===0) return {v:'', m:'left'};
        const t=x.trim();
        if(t==='^^') return {v:'', m:'up'};
        return {v:t.startsWith('\\^^')?t.slice(1):t, m:null};
      });
      if(cells[0].m==='left'){ err(n,'colspan cannot start in the first column'); continue; }
      if(cur.heads.length===0 && cells.some(c=>c.m==='up')){ err(n,'"^^" cannot appear in the first row'); continue; }
      if(!cur.sep){
        if(cur.heads.length && cells.length!==cur.cols.length){ err(n,'header row has '+cells.length+' cells, expected '+cur.cols.length); continue; }
        cur.heads.push(cells);
        if(cur.heads.length===1) cur.cols=cells.map(c=>c.v);
      } else {
        if(cells.length!==cur.cols.length){ err(n,'row has '+cells.length+' cells, expected '+cur.cols.length); continue; }
        // rowspan cannot cross the thead/tbody boundary (multimd prior
        // art): "^^" in the first data row is a line error (D9).
        if(!cur.rows.length && cells.some(c=>c.m==='up')){ err(n,'"^^" cannot appear in the first data row (rowspan does not cross the header separator)'); continue; }
        cur.rows.push({cells,hl:false,line:n});
      }
      continue;
    }
    // edge lines carry inline [labels] with free text — dedicated scanner,
    // not the generic tokenizer
    if(/^edge(\s|$)/.test(raw.trim())){
      if(firstContent){ firstContent=false; err(n,'first line must be "figdown 0.1 [template]"'); }
      cur=null;
      parseEdgeLine(raw.trim(),n);
      continue;
    }
    const tk=tokenize(raw.trim());
    if(tk.error){ err(n,tk.error); continue; }
    const lead=(tk.toks.length&&!tk.toks[0].q)?tk.toks[0].v:'';
    const {pos,opts,unk}=splitOpts(tk.toks, lead==='signal');
    const kw=pos[0];
    // D3/D12/D14 (0.1-dev.11): uniform per-directive option checks —
    // unknown keys, registered-but-inapplicable keys, invalid colors.
    // Directives not in DIRECTIVE_OPTS (title's rest-of-line, unknown
    // keywords) are handled by their own paths.
    const badOpts=(k)=>{
      const allowed=DIRECTIVE_OPTS[k];
      if(!allowed) return false;
      let bad=false;
      for(const u of unk){ err(n,'unknown option "'+u+'="'); bad=true; }
      for(const o in opts){
        if(allowed.includes(o)) continue;
        if(k==='group'&&o==='in') err(n,'group does not take in= — nesting is one level (node in=group) in v0.1');
        else err(n,k+' does not take '+o+'=');
        bad=true;
      }
      for(const o of ['color','stroke','text'])
        if(opts[o]!==undefined && allowed.includes(o) && !isColor(opts[o])){
          err(n,'unknown color "'+opts[o]+'" (#hex or CSS color name)'); bad=true; }
      return bad;
    };

    if(firstContent){
      firstContent=false;
      if(kw==='figdown'){
        sawHeader=true;
        if(pos[1]!=='0.1') err(n,'unsupported version "'+(pos[1]||'')+'" (expected 0.1)');
        if(pos[2]!==undefined){
          const TEMPLATES=['block','topology','flowchart','bitfield','table','wave'];
          if(!TEMPLATES.includes(pos[2])) err(n,'unknown template "'+pos[2]+'" (block|topology|flowchart|bitfield|table|wave)');
          else{ doc.template=pos[2];
            // template defaults (D8/R13): flowchart figures flow down —
            // the census-dominant direction; an explicit flow line overrides
            if(pos[2]==='flowchart') doc.flow='down'; }
        }
        badOpts('figdown');
        continue;
      } else { err(n,'first line must be "figdown 0.1 [template]"'); }
    } else if(kw==='figdown'){ err(n,'duplicate version header'); continue; }

    // typed-block children
    if(cur && ['field','wrap','cell','colw','signal','gap'].includes(kw)){
      if(badOpts(kw)) continue;
      if(cur.type==='bitfield' && kw==='field'){
        // Compact form (C bit-field convention): field F1:16,F2:8 SYN:1 ...
        // — bare name:width items separated by commas and/or spaces, no
        // per-field options. Classic form: field <name> <width> [options].
        // Classic form: field <name> <width-in-bits|*> [optional] [color=] [note=]
        // '*' = variable-length field: fills the remainder of the current row
        const cname=pos[1], cw=pos[2];
        if(cname!==undefined && (/^\d+$/.test(cw||'')&&+cw>=1 || cw==='*')){
          const fextra=pos.slice(3).find(x=>x!=='optional');
          if(fextra!==undefined){ err(n,'unexpected argument "'+fextra+'"'); continue; }
          cur.fields.push({name:cname,w:cw==='*'?'*':+cw,optional:pos.includes('optional'),color:opts.color,cls:opts['class'],note:opts.note,line:n});
          continue;
        }
        // Compact form (C bit-field convention): field a:1, b:2, Long Name:16
        // Commas separate items; the name is everything before the last colon
        // (spaces allowed, no quotes needed); no per-field options here.
        const rest=raw.trim().replace(/^field\s+/,'');
        if(!rest.includes(':')){ err(n,'field needs <name> <width-in-bits>, or a name:width list'); continue; }
        const items=rest.split(',').map(s=>s.trim()).filter(Boolean);
        let bad=null; const parsed=[];
        for(const it of items){
          const m=/^(.+):(\d+|\*)$/.exec(it);
          if(!m||(m[2]!=='*'&&+m[2]<1)){ bad='bad item "'+it+'" (expected name:width)'; break; }
          let nm=m[1].trim();
          if(/^".*"$/.test(nm)) nm=nm.slice(1,-1);          // quotes tolerated
          if(/:(\d+|\*)(\s|$)/.test(nm)){ bad='"'+it+'" looks like two fields — missing comma?'; break; }
          parsed.push({name:nm,w:m[2]==='*'?'*':+m[2]});
        }
        if(bad){ err(n,bad); continue; }
        for(const it of parsed) cur.fields.push({name:it.name,w:it.w,optional:false,line:n});
      } else if(cur.type==='bitfield' && kw==='wrap'){
        cur.fields.push({wrap:true,line:n});
      } else if(cur.type==='table' && kw==='colw'){
        if(cur.colw){ err(n,'duplicate colw'); continue; }
        const vals=pos.slice(1);
        if(!vals.length){ err(n,'colw needs one width per column (auto | <px> | <n>%)'); continue; }
        let badw=null;
        const parsed=vals.map(v=>{
          if(v==='auto') return {t:'auto'};
          let m=/^(\d+(?:\.\d+)?)px$/.exec(v)||/^(\d+(?:\.\d+)?)$/.exec(v);
          if(m) return {t:'px',v:+m[1]};
          m=/^(\d+(?:\.\d+)?)%$/.exec(v);
          if(m) return {t:'pct',v:+m[1]};
          badw='bad width "'+v+'" (auto | <px> | <n>%)'; return null;
        });
        if(badw){ err(n,badw); continue; }
        cur.colw={vals:parsed,line:n};
      } else if(cur.type==='table' && kw==='cell'){
        // cell h<k>,<c> | <r>,<c> color=…  (h1..hN = header tiers top-down;
        // data rows 1-based below the separator);  cell <r> highlight
        const rc=/^(h?)(\d+)(?:,(\d+))?$/.exec(pos[1]||'');
        const hl=pos.includes('highlight');
        const cextra=pos.slice(2).find(x=>x!=='highlight');
        if(cextra!==undefined){ err(n,'unexpected argument "'+cextra+'"'); continue; }
        if(!rc||(!opts.color&&!opts['class']&&!hl)){ err(n,'cell needs [h]<row>[,<col>] with color=…/class=… or highlight'); continue; }
        if(!rc[1]&&+rc[2]===0){ err(n,'row 0 is retired — address header tiers as h1..hN (top-down)'); continue; }
        if(hl&&rc[3]===undefined){
          if(rc[1]){ err(n,'highlight applies to data rows only'); continue; }
          cur.rowmarks=cur.rowmarks||[];
          cur.rowmarks.push({r:+rc[2],line:n});
        } else if(rc[3]!==undefined&&(opts.color||opts['class'])){
          cur.marks=cur.marks||[];
          cur.marks.push({hdr:!!rc[1],r:+rc[2],c:+rc[3],color:opts.color,cls:opts['class'],line:n});
        } else { err(n,'cell needs [h]<row>,<col> color=…/class=… or <row> highlight'); }
      } else if(cur.type==='wave' && kw==='signal'){
        const name=pos[1], lane=pos[2];
        if(!name||!lane){ err(n,'signal needs <name> <lane>'); continue; }
        if(!/^[01pnx=.\d]+$/.test(lane)){ err(n,'lane may contain only 0 1 p n x = . digits'); continue; }
        cur.signals.push({name,lane,labels:(opts.labels||'').split(',').filter(Boolean)});
      } else if(cur.type==='wave' && kw==='gap'){
        const t=parseInt(pos[1],10);
        if(!isFinite(t)||t<0){ err(n,'gap needs a tick number'); continue; }
        cur.gaps.push(t);
      } else { err(n,'"'+kw+'" not valid inside '+cur.type); }
      continue;
    }
    cur=null; // any other keyword closes the block
    if(badOpts(kw)) continue;

    switch(kw){
      case 'title': {
        // rest-of-line: `title TCP Header` == `title "TCP Header"` (A-1)
        let t=raw.trim().replace(/^title\s*/,'');
        const qm=/^"([\s\S]*)"$/.exec(t);
        if(qm){
          // decode escapes left-to-right in one pass, exactly like the
          // generic tokenizer: \\ consumes first, so "a\\nb" is a\nb
          // (backslash + letter n), never a line break (D2, 0.1-dev.11).
          // Unknown escapes were already rejected by tokenize() above.
          const s0=qm[1]; t='';
          for(let ii=0;ii<s0.length;ii++){
            if(s0[ii]==='\\'){
              const e=s0[ii+1];
              if(e==='n'){ t+='\n'; ii++; continue; }
              if(e==='"'){ t+='"'; ii++; continue; }
              if(e==='\\'){ t+='\\'; ii++; continue; }
            }
            t+=s0[ii];
          }
        }
        doc.title=t; break;
      }
      case 'class': {
        // semantic class (D9): meaning + presentation defaults declared
        // once; elements join via class=<id>; the legend strip derives
        const id=pos[1];
        if(!id||!ID_RE.test(id)){ err(n,'class needs an id'); break; }
        if(classIds.has(id)){ err(n,'duplicate class "'+id+'"'); break; }
        if(!pos[2]){ err(n,'class needs a meaning: class '+id+' "<meaning>"'); break; }
        if(pos.length>3){ err(n,'unexpected argument "'+pos[3]+'"'); break; }
        const cstyle=opts.style;
        if(cstyle!==undefined && !['solid','dashed','dotted'].includes(cstyle)){ err(n,'style must be solid|dashed|dotted'); break; }
        classIds.add(id);
        doc.classes.push({id,label:pos[2],color:opts.color,stroke:opts.stroke,
                          text:opts.text,style:cstyle,line:n});
        break;
      }
      case 'layer': {
        const id=pos[1];
        if(!id||!ID_RE.test(id)){ err(n,'layer needs an id'); break; }
        if(layerIds.has(id)){ err(n,'duplicate layer id "'+id+'"'); break; }
        if(pos.length>3){ err(n,'unexpected argument "'+pos[3]+'"'); break; }
        let z=doc.layers.length;
        if(opts.z!==undefined){
          if(!/^-?\d+$/.test(opts.z)){ err(n,'z must be a number'); break; }
          z=parseInt(opts.z,10);
        }
        layerIds.add(id);
        doc.layers.push({id,label:pos[2]||'',z});
        break;
      }
      case 'node': {
        const id=pos[1];
        if(!id||!ID_RE.test(id)){ err(n,'node needs an id'); break; }
        if(nodeIds.has(id)||groupIds.has(id)){ err(n,'duplicate id "'+id+'"'); break; }
        if(opts.kind!==undefined){ err(n,'kind= has been renamed: use shape= (geometric; the label text carries the device semantics)'); break; }
        if(opts.w!==undefined||opts.h!==undefined){ err(n,'node does not take w=/h= — use a size line'); break; }
        const shape=opts.shape||'box';
        if(!SHAPES.includes(shape)){ err(n,'unknown shape "'+shape+'" ('+SHAPES.join('|')+')'); break; }
        nodeIds.add(id);
        if(pos.length>3){ err(n,'unexpected argument "'+pos[3]+'"'); break; }
        const nstyle=opts.style;
        if(nstyle!==undefined && !['solid','dashed','dotted'].includes(nstyle)){ err(n,'style must be solid|dashed|dotted'); break; }
        doc.nodes.push({id,label:pos[2]||id,shape,color:opts.color,stroke:opts.stroke,
                        style:nstyle,text:opts.text,cls:opts['class'],
                        group:opts['in']||null,layer:opts.layer||'base',line:n});
        break;
      }
      case 'group': {
        const id=pos[1];
        if(!id||!ID_RE.test(id)){ err(n,'group needs an id'); break; }
        if(nodeIds.has(id)||groupIds.has(id)){ err(n,'duplicate id "'+id+'"'); break; }
        if(pos.length>3){ err(n,'unexpected argument "'+pos[3]+'"'); break; }
        groupIds.add(id);
        let ggap;
        if(opts.gap!==undefined){
          ggap=parseFloat(opts.gap);
          if(!isFinite(ggap)||ggap<0){ err(n,'gap must be a non-negative number'); break; }
        }
        doc.groups.push({id,label:pos[2]||id,color:opts.color,gap:ggap,cls:opts['class'],line:n});
        break;
      }
      case 'flow': {
        if(!['right','down','left','up'].includes(pos[1])){ err(n,'flow needs right|down|left|up'); break; }
        if(pos.length>2){ err(n,'unexpected argument "'+pos[2]+'"'); break; }
        doc.flow=pos[1]; break;
      }
      case 'rank': {
        const ids=pos.slice(1);
        if(ids.length<2){ err(n,'rank needs two or more node ids'); break; }
        doc.ranks.push({ids,line:n}); break;
      }
      case 'bundle': {
        // semantic link bundle (LAG / Ethernet Segment): the renderer draws
        // the dashed ellipse around the member links automatically
        const id=pos[1];
        if(!id||!ID_RE.test(id)){ err(n,'bundle needs an id'); break; }
        if(bundleIds.has(id)){ err(n,'duplicate bundle id "'+id+'"'); break; }
        let rest=pos.slice(2), tlabel=id;
        if(tk.toks[2]&&tk.toks[2].q){ tlabel=pos[2]; rest=pos.slice(3); }
        const pairs=[]; let badp=null;
        for(const t of rest){
          const m=/^([A-Za-z_][A-Za-z0-9_-]*)--([A-Za-z_][A-Za-z0-9_-]*),?$/.exec(t);
          if(!m){ badp='bad member "'+t+'" (expected A--B)'; break; }
          pairs.push([m[1],m[2]]);
        }
        if(badp){ err(n,badp); break; }
        if(!pairs.length){ err(n,'bundle needs at least one member link A--B'); break; }
        bundleIds.add(id);
        doc.trunks.push({id,label:tlabel,pairs,color:opts.color,line:n});
        break;
      }
      case 'line': {
        // generic horizontal guide/threshold line across a group's box:
        // line "<label>" in=<group> at=<0..100>% [color=] [fill=below|above]
        const glabel=(tk.toks[1]&&tk.toks[1].q)?pos[1]:null;
        if(glabel===null){ err(n,'line needs a quoted "<label>" first'); break; }
        if(!opts['in']){ err(n,'line needs in=<group-id>'); break; }
        const m=/^(\d+(?:\.\d+)?)%$/.exec(opts.at||'');   // % is mandatory (D8)
        if(!m||+m[1]<0||+m[1]>100){ err(n,'line needs at=<0..100>% (with the % sign)'); break; }
        if(opts.fill!==undefined){ err(n,'line is a pure marker — use the fill directive for zones'); break; }
        doc.glines.push({label:glabel,group:opts['in'],pct:+m[1],color:opts.color,line:n});
        break;
      }
      case 'plot': {
        // chart family: plot <table-id> [kind=bars3d] [level=<value>]
        // rows -> X, columns -> Y, numeric cells -> Z (the table IS the data)
        const tid=pos[1];
        if(!tid||!ID_RE.test(tid)){ err(n,'plot needs a table id'); break; }
        if(pos.length>2){ err(n,'unexpected argument "'+pos[2]+'"'); break; }
        const pkind=opts.kind||'bars3d';
        if(pkind!=='bars3d'){ err(n,'unknown plot kind "'+pkind+'" (bars3d)'); break; }
        let plevel=null;
        if(opts.level!==undefined){
          plevel=parseFloat(opts.level);
          if(!isFinite(plevel)||plevel<0){ err(n,'level must be a non-negative number'); break; }
        }
        doc.blocks.push({type:'plot',id:'plot_'+doc.blocks.length,tid,kind:pkind,level:plevel,line:n});
        break;
      }
      case 'fill': {
        // zone band: fill <pct>% | <a>-<b>%  in=<node|group> [dir=] [color=]
        // "fill 15%" = 0..15; "fill 15-35%" = the range in one token
        if(opts.from!==undefined||opts.to!==undefined){ err(n,'from=/to= retired — write the range positionally: fill 15% or fill 15-35%'); break; }
        if(!opts['in']){ err(n,'fill needs in=<node-or-group-id>'); break; }
        const m=/^(\d+(?:\.\d+)?)%?(?:-(\d+(?:\.\d+)?)%?)?$/.exec(pos[1]||'');
        if(!m){ err(n,'fill needs a range: <pct>% or <a>-<b>%'); break; }
        const from=m[2]!==undefined?+m[1]:0;
        const to=m[2]!==undefined?+m[2]:+m[1];
        if(from<0||to>100||from>=to){ err(n,'fill range needs 0 <= from < to <= 100'); break; }
        const fdir=opts.dir||'up';
        if(!['up','down','left','right'].includes(fdir)){ err(n,'dir must be up|down|left|right'); break; }
        doc.fills.push({target:opts['in'],from,to,dir:fdir,color:opts.color||'#e5e7eb',line:n});
        break;
      }
      case 'pin': {
        const id=pos[1], at=opts.at;
        if(pos.length>2){ err(n,'unexpected argument "'+pos[2]+'"'); break; }
        const m=at&&/^(-?[\d.]+),(-?[\d.]+)$/.exec(at);
        if(!id||!m){ err(n,'pin needs <id> at=<x>,<y>'); break; }
        doc.pins[id]={fx:parseFloat(m[1]),fy:parseFloat(m[2]),line:n};
        break;
      }
      case 'size': {
        const id=pos[1];
        if(pos.length>2){ err(n,'unexpected argument "'+pos[2]+'"'); break; }
        if(!id||(!opts.w&&!opts.h)){ err(n,'size needs <id> w=<px> and/or h=<px>'); break; }
        let badsz=false;
        const dim=(k)=>{                       // px only (D7/D13)
          const v=opts[k]; if(v===undefined||v==='') return null;
          if(/%$/.test(v)){ err(n,'percentage sizes are not in v0.1 — use px'); badsz=true; return null; }
          const f=parseFloat(v);
          if(!isFinite(f)){ err(n,k+' must be a number'); badsz=true; return null; }
          return f;
        };
        const w=dim('w'), h=dim('h');
        if(badsz) break;
        doc.sizes[id]={w,h,line:n};
        break;
      }
      case 'bitfield': {
        const id=pos[1];
        if(!id||!ID_RE.test(id)){ err(n,'bitfield needs an id'); break; }
        if(pos.length>3){ err(n,'unexpected argument "'+pos[3]+'"'); break; }
        cur={type:'bitfield',id,label:pos[2]||id,unit:opts.unit?parseInt(opts.unit,10):32,
             numbering:opts.numbering||'lsb0',fields:[],line:n};
        if(!isFinite(cur.unit)||cur.unit<1){ err(n,'bad unit'); cur.unit=32; }
        if(!['lsb0','msb0'].includes(cur.numbering)) err(n,'numbering must be lsb0 or msb0');
        doc.blocks.push(cur); break;
      }
      case 'table': {
        const id=pos[1];
        if(!id||!ID_RE.test(id)){ err(n,'table needs an id'); break; }
        if(pos.length>3){ err(n,'unexpected argument "'+pos[3]+'"'); break; }
        cur={type:'table',id,label:pos[2]||id,cols:[],heads:[],rows:[],line:n};
        doc.blocks.push(cur); break;
      }
      case 'wave': {
        const id=pos[1];
        if(!id||!ID_RE.test(id)){ err(n,'wave needs an id'); break; }
        if(pos.length>3){ err(n,'unexpected argument "'+pos[3]+'"'); break; }
        cur={type:'wave',id,label:pos[2]||id,signals:[],gaps:[],line:n};
        doc.blocks.push(cur); break;
      }
      case 'page': case 'step': case 'set': case 'pulse':
        err(n,'"'+kw+'" is reserved for the dynamic profile (not in v0.1)'); break;
      case 'field': case 'wrap': case 'cell': case 'colw': case 'signal': case 'gap':
        err(n,'"'+kw+'" is a typed-block child — it needs a bitfield/table/wave block above it'); break;
      default:
        err(n,'unrecognized line (unknown keyword "'+kw+'")');
    }
  }
  if(!sawHeader && text.trim()) { /* already reported on first content line */ }

  // semantic checks
  for(const nd of doc.nodes){
    if(nd.group && !groupIds.has(nd.group)) errs.push('Line '+nd.line+': unknown group "'+nd.group+'"');
    if(nd.layer && !layerIds.has(nd.layer)) errs.push('Line '+nd.line+': unknown layer "'+nd.layer+'"');
  }
  for(const e of doc.edges){
    if(!nodeIds.has(e.a)&&!groupIds.has(e.a)) errs.push('Line '+e.line+': unknown endpoint "'+e.a+'"');
    else if(groupIds.has(e.a)) errs.push('Line '+e.line+': edge endpoint "'+e.a+'" is a group — connect to a member node (group edges are not in v0.1)');
    if(!nodeIds.has(e.b)&&!groupIds.has(e.b)) errs.push('Line '+e.line+': unknown endpoint "'+e.b+'"');
    else if(groupIds.has(e.b)) errs.push('Line '+e.line+': edge endpoint "'+e.b+'" is a group — connect to a member node (group edges are not in v0.1)');
    if(e.layer && !layerIds.has(e.layer)) errs.push('Line '+e.line+': unknown layer "'+e.layer+'"');
  }
  for(const r of doc.ranks) for(const id of r.ids)
    if(!nodeIds.has(id)) errs.push('Line '+r.line+': unknown node "'+id+'" in rank');
  for(const gl of doc.glines)
    if(!groupIds.has(gl.group)) errs.push('Line '+gl.line+': unknown group "'+gl.group+'" for line');
  for(const f of doc.fills)
    if(!groupIds.has(f.target)&&!nodeIds.has(f.target))
      errs.push('Line '+f.line+': unknown target "'+f.target+'" for fill');
  for(const t of doc.trunks) for(const [a,b] of t.pairs){
    if(!nodeIds.has(a)||!nodeIds.has(b)){ errs.push('Line '+t.line+': unknown endpoint in "'+a+'--'+b+'"'); continue; }
    const matches=doc.edges.filter(e=>(e.a===a&&e.b===b)||(e.a===b&&e.b===a)).length;
    if(matches===0)
      errs.push('Line '+t.line+': no edge between "'+a+'" and "'+b+'" for bundle member');
    else if(matches>1)
      errs.push('Line '+t.line+': "'+a+'--'+b+'" is ambiguous ('+matches+' parallel edges); parallel edges are out of scope for v0.1');
  }
  for(const id in doc.pins) if(!nodeIds.has(id)&&!groupIds.has(id))
    errs.push('Line '+doc.pins[id].line+': pin of unknown id "'+id+'"');
  { // class references must resolve (closed grammar)
    const chk=(cls,line)=>{ if(cls!==undefined && !classIds.has(cls))
      errs.push('Line '+line+': unknown class "'+cls+'"'); };
    for(const x of doc.nodes) chk(x.cls,x.line);
    for(const x of doc.groups) chk(x.cls,x.line);
    for(const x of doc.edges) chk(x.cls,x.line);
    for(const b of doc.blocks){
      if(b.fields) for(const f of b.fields) chk(f.cls,f.line);
      if(b.marks)  for(const mk of b.marks) chk(mk.cls,mk.line);
    }
  }
  for(const id in doc.sizes) if(!nodeIds.has(id)&&!groupIds.has(id))
    errs.push('Line '+doc.sizes[id].line+': size of unknown id "'+id+'"');
  for(const b of doc.blocks){
    if(b.type==='table'&&!b.heads.length) errs.push('Line '+b.line+': table has no header row');
    if(b.type==='table'&&b.heads.length&&!b.sep) errs.push('Line '+b.line+': table has no |---| separator row');
    if(b.type==='bitfield'&&!b.fields.some(f=>!f.wrap)) errs.push('Line '+b.line+': bitfield has no fields');
    if(b.type==='wave'&&!b.signals.length) errs.push('Line '+b.line+': wave has no signals');
    if(b.type==='plot'){
      const t=doc.blocks.find(x=>x.type==='table'&&x.id===b.tid);
      if(!t) errs.push('Line '+b.line+': plot references unknown table "'+b.tid+'"');
      else{
        for(const r of t.rows) for(let c=1;c<r.cells.length;c++)
          if(!r.cells[c].m && !/^-?\d+(?:\.\d+)?$/.test(r.cells[c].v))
            { errs.push('Line '+b.line+': plot data must be numeric (row value "'+r.cells[c].v+'")'); break; }
      }
    }
    if(b.type==='table'&&b.colw&&b.colw.vals.length!==b.cols.length)
      errs.push('Line '+b.colw.line+': colw has '+b.colw.vals.length+' widths, expected '+b.cols.length);
    if(b.type==='table'&&b.marks) for(const mk of b.marks){
      const H=b.heads.length;
      const inRange = mk.hdr ? (mk.r>=1&&mk.r<=H) : (mk.r>=1&&mk.r<=b.rows.length);
      if(!inRange||mk.c<1||mk.c>b.cols.length){
        errs.push('Line '+mk.line+': cell '+(mk.hdr?'h':'')+mk.r+','+mk.c+' out of range'); continue;
      }
      // merged-away targets must be rejected: annotations target the anchor
      const cells = mk.hdr ? b.heads[mk.r-1] : b.rows[mk.r-1].cells;
      if(cells[mk.c-1].m)
        errs.push('Line '+mk.line+': cell '+(mk.hdr?'h':'')+mk.r+','+mk.c+' is merged away — annotate the anchor cell');
    }
    if(b.type==='table'&&b.rowmarks) for(const mk of b.rowmarks){
      if(mk.r<1||mk.r>b.rows.length)
        errs.push('Line '+mk.line+': row '+mk.r+' out of range');
    }
  }
  return {doc,errs};
}
function findComment(s){
  // '#' starts a comment only at line start or after whitespace,
  // so hex colors like color=#0d9488 survive.
  let inq=false;
  for(let i=0;i<s.length;i++){
    if(s[i]==='"') inq=!inq;
    else if(s[i]==='#'&&!inq&&(i===0||/\s/.test(s[i-1]))) return i;
  }
  return -1;
}

// ============================================================
// 2. LAYOUT + RENDER (deterministic; no randomness, no Date)
// ============================================================
const FONT=13, CH=7.2, PADX=14, NH=36, GAPX=56, GAPY=44;
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function tw(s){
  const longest=Math.max(...String(s).split('\n').map(l=>l.length));
  return Math.max(30,longest*CH+2*PADX);
}
// multi-line <text>: "\n" in labels becomes centered tspans
function textEl(x,y,fs,anchor,fill,content,extraAttrs){
  // halo text = two layers (white under-stroke + plain top copy) so the
  // halo survives SVG renderers without paint-order support
  if(extraAttrs && extraAttrs.indexOf('paint-order')>=0){
    const rest=extraAttrs.replace(' paint-order="stroke" stroke="#fff" stroke-width="3"','');
    return textEl(x,y,fs,anchor,'#fff',content,rest+' stroke="#fff" stroke-width="3" stroke-linejoin="round"')
         + textEl(x,y,fs,anchor,fill,content,rest);
  }
  const lines=String(content).split('\n');
  const attrs='font-size="'+fs+'" text-anchor="'+anchor+'" fill="'+fill+'"'+(extraAttrs||'');
  if(lines.length===1)
    return '<text x="'+x+'" y="'+y+'" '+attrs+'>'+esc(content)+'</text>';
  const lh=fs*1.3, y0=y-(lines.length-1)*lh/2;
  return '<text x="'+x+'" y="'+y0+'" '+attrs+'>'+
    lines.map((l,i)=>'<tspan x="'+x+'" dy="'+(i?lh:0)+'">'+esc(l)+'</tspan>').join('')+'</text>';
}

function render(doc){
  // resolve class defaults (explicit element attributes win — rigidity, R8)
  const C={}; for(const c of doc.classes||[]) C[c.id]=c;
  const rs=(x,k)=>{ if(x[k]===undefined && x.cls && C[x.cls] && C[x.cls][k]!==undefined) x[k]=C[x.cls][k]; };
  for(const n of doc.nodes){ rs(n,'color'); rs(n,'stroke'); rs(n,'text'); rs(n,'style'); if(n.style===undefined) n.style='solid'; }
  for(const g of doc.groups){ rs(g,'color'); }
  for(const e of doc.edges){ rs(e,'color'); rs(e,'style'); if(e.style===undefined) e.style='solid'; }
  for(const b of doc.blocks){
    if(b.fields) for(const f of b.fields) rs(f,'color');
    if(b.marks)  for(const mk of b.marks) rs(mk,'color');
  }
  const parts=[]; let y=0, maxW=0;
  if(doc.title){ parts.push('<text x="0" y="16" font-size="15" font-weight="600" font-family="var(--sans)">'+esc(doc.title)+'</text>'); y=30;
    maxW=Math.max(maxW, doc.title.length*8.6); }  // canvas must fit the title
  let sceneMeta=null;
  if(doc.nodes.length||doc.edges.length){
    const s=renderScene(doc,y); parts.push(s.svg); y=s.y; maxW=Math.max(maxW,s.w);
    sceneMeta=s.meta;
  }
  for(const b of doc.blocks){
    let s;
    if(b.type==='bitfield') s=renderBitfield(b,y);
    else if(b.type==='table') s=renderTable(b,y);
    else if(b.type==='plot') s=renderPlot(b,y,doc);
    else s=renderWave(b,y);
    parts.push(s.svg); y=s.y+24; maxW=Math.max(maxW,s.w);
  }
  if((doc.classes||[]).length){
    // derived legend strip (D9): declaration order, swatch + meaning
    const es=[]; let lx=0, ly=y+8; const rowH=20, wrapW=Math.max(maxW,420);
    for(const c of doc.classes){
      const tw=String(c.label).length*6.6+30;
      if(lx>0 && lx+tw>wrapW){ lx=0; ly+=rowH; }
      const dash=c.style==='dashed'?' stroke-dasharray="6 4"':(c.style==='dotted'?' stroke-dasharray="2 4"':'');
      es.push('<rect x="'+lx+'" y="'+(ly+3)+'" width="16" height="11" fill="'+(c.color||'#fff')+'" stroke="'+(c.stroke||'#555')+'"'+dash+'/>');
      es.push('<text x="'+(lx+21)+'" y="'+(ly+12.5)+'" font-size="11" fill="#1d1d1b">'+esc(c.label)+'</text>');
      lx+=tw+14; maxW=Math.max(maxW,lx);
    }
    parts.push(es.join(''));
    y=ly+rowH;
  }
  const PADL=18, PADT=6;
  const W=Math.ceil(maxW)+PADL+8, H=Math.ceil(y)+PADT+4;
  return {svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" font-family="system-ui,sans-serif">'
    +'<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
    +'<path d="M0,0 L10,5 L0,10 z" fill="#555"/></marker>'
    +'<pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">'
    +'<line x1="0" y1="0" x2="0" y2="6" stroke="#bbb" stroke-width="2"/></pattern></defs>'
    +'<g transform="translate('+PADL+','+PADT+')">'+parts.join('')+'</g></svg>', w:W, h:H,
    sceneMeta:sceneMeta, pad:{x:PADL,y:PADT}};
}

// ---- scene ----
function renderScene(doc,y0){
  const nodes=doc.nodes.map(n=>({...n}));
  const byId={}; nodes.forEach(n=>byId[n.id]=n);
  // sizes
  for(const n of nodes){
    const nLines=String(n.label).split('\n').length;
    n.w=tw(n.label); n.h=NH+(nLines-1)*16;
    const s=doc.sizes[n.id]; if(s){ if(s.w)n.w=s.w; if(s.h)n.h=s.h; n.rigid=true; }
    if(n.shape==='diamond'){ n.w=Math.max(n.w+20,70); n.h=Math.max(n.h,48); }
    if(n.shape==='circle'){ n.w=n.h=Math.max(n.w,n.h); }
  }
  // ranks: DFS from document-order sources classifies back-edges; a
  // longest-path layering runs on the remaining DAG so sources sit at
  // layer 0. `rank a b c` merges its nodes into ONE vertex for the
  // layering (same layer) without dragging unrelated branches along.
  const pinned=id=>doc.pins[id]!==undefined;
  nodes.forEach((n,i)=>n.di=i);            // document order (sort tiebreak)
  const rep={}; nodes.forEach(n=>rep[n.id]=n.id);   // rank-group union-find
  const find=u=>{ while(rep[u]!==u) u=rep[u]=rep[rep[u]]; return u; };
  for(const r of doc.ranks){
    const ids=r.ids.filter(id=>byId[id]);
    for(let i=1;i<ids.length;i++){ const a=find(ids[0]),b=find(ids[i]); if(a!==b) rep[b]=a; }
  }
  const adj={}; nodes.forEach(n=>{ adj[find(n.id)]=adj[find(n.id)]||[]; });
  const isBack=new Set();                  // edges that close a cycle
  for(const e of doc.edges){
    // undirected/bidirectional edges still order ranks by document direction
    if(!byId[e.a]||!byId[e.b]) continue;
    if(e.a===e.b){ isBack.add(e); continue; }        // self-loop
    const u=find(e.a), v=find(e.b);
    if(u!==v) adj[u].push({v,e});
  }
  const state={};
  const classify=u=>{
    state[u]=1;
    for(const {v,e} of adj[u]){
      if(state[v]===1) isBack.add(e);      // gray hit = back-edge
      else if(!state[v]) classify(v);
    }
    state[u]=2;
  };
  for(const n of nodes){ const u=find(n.id); if(!state[u]) classify(u); }
  const radj={}; nodes.forEach(n=>{ radj[find(n.id)]=radj[find(n.id)]||[]; });
  for(const e of doc.edges){
    if(!byId[e.a]||!byId[e.b]||isBack.has(e)) continue;
    const u=find(e.a), v=find(e.b); if(u!==v) radj[v].push(u);
  }
  const rk={};
  const rankOf=u=>{
    if(rk[u]!==undefined) return rk[u];
    rk[u]=0;                               // DAG: placeholder is never read
    let r=0; for(const p of radj[u]) r=Math.max(r, rankOf(p)+1);
    return rk[u]=r;
  };
  nodes.forEach(n=>n.rank=rankOf(find(n.id)));
  // positions: children spread around their parents' lane (barycenter
  // sweeps down/up/down). Edges that span multiple layers get invisible
  // waypoint slots so they no longer cut through intermediate nodes.
  // ALL nodes participate in auto layout (pinned ones hold their slot so
  // that pinning X never reflows Y); pins override coordinates afterwards.
  const horiz=(doc.flow==='right'||doc.flow==='left');
  const lblPx=s=>Math.max(...String(s).split('\n').map(l=>l.length))*6.5;
  const lay=[...nodes];                    // layout participants
  const chains=new Map();                  // edge -> [A, ...waypoints, B]
  for(const e of doc.edges){
    const A=byId[e.a], B=byId[e.b];
    if(!A||!B||isBack.has(e)) continue;
    if(B.rank-A.rank<=1 || pinned(e.a) || pinned(e.b)) continue;
    const chain=[A];
    for(let r=A.rank+1;r<B.rank;r++){
      const v={virtual:true,rank:r,w:1,h:1,mn:e.mid?lblPx(e.mid):0,di:lay.length};
      lay.push(v); chain.push(v);
    }
    chain.push(B); chains.set(e,chain);
  }
  const preds=new Map(), succs=new Map(); // over layout segments
  const link=(p,c)=>{ if(!preds.has(c)) preds.set(c,[]); preds.get(c).push(p);
                      if(!succs.has(p)) succs.set(p,[]); succs.get(p).push(c); };
  for(const e of doc.edges){
    const A=byId[e.a], B=byId[e.b];
    if(!A||!B||isBack.has(e)||A.rank===B.rank) continue;
    const ch=chains.get(e)||[A,B];
    for(let i=1;i<ch.length;i++) link(ch[i-1],ch[i]);
  }
  const midW={};        // widest mid label on a one-layer edge, per node
  for(const e of doc.edges){
    if(!e.mid) continue;
    const A=byId[e.a], B=byId[e.b];
    if(!A||!B||isBack.has(e)||Math.abs(A.rank-B.rank)!==1) continue;
    midW[e.a]=Math.max(midW[e.a]||0,lblPx(e.mid));
    midW[e.b]=Math.max(midW[e.b]||0,lblPx(e.mid));
  }
  const cs=n=>horiz?n.h:n.w;               // cross-axis size
  const gapOf=(a,b)=>{  // spacing between adjacent lane members
    if(a.group&&a.group===b.group){
      const g=doc.groups.find(x=>x.id===a.group);
      if(g&&g.gap!==undefined) return g.gap;   // explicit group gap is exact
    }
    let base=horiz?GAPY:GAPX;
    if(a.virtual||b.virtual) base=Math.min(base,30);
    if(!horiz){           // beside-labels on vertical edges need width
      const la=a.virtual?a.mn:(midW[a.id]||0);
      if(la) base=Math.max(base,la+23-cs(a)/2);
    }
    return base;
  };
  const ranksArr=[];
  for(const n of lay){ (ranksArr[n.rank]=ranksArr[n.rank]||[]).push(n); }
  const laneSize=[], mainGap=[];
  ranksArr.forEach((lane,i)=>{
    if(!lane) return;
    laneSize[i]=Math.max(...lane.map(n=>horiz?n.w:n.h));
    mainGap[i]=horiz?GAPX:GAPY;
  });
  if(horiz) for(const e of doc.edges){     // labels ride ON horizontal edges:
    if(!e.mid||isBack.has(e)) continue;    // layer pitch grows to fit them
    const A=byId[e.a], B=byId[e.b]; if(!A||!B) continue;
    const r0=Math.min(A.rank,B.rank), r1=Math.max(A.rank,B.rank);
    if(r0===r1) continue;
    const need=(lblPx(e.mid)+24)/(r1-r0);
    for(let i=r0;i<r1;i++) mainGap[i]=Math.max(mainGap[i],need);
  }
  const center=n=>n.cross+cs(n)/2;
  ranksArr.forEach(lane=>{ if(!lane) return; let c=0;    // seed: doc order
    lane.forEach((n,k)=>{ n.cross=c; c+=cs(n)+(k<lane.length-1?gapOf(n,lane[k+1]):0); }); });
  const place=(lane,des)=>{   // order by desired center, resolve overlaps,
    const arr=lane.map(n=>({n,d:des.get(n)}));           // recenter the lane
    arr.sort((p,q)=>p.d-q.d||p.n.di-q.n.di);
    let cEnd=-Infinity;
    arr.forEach((x,i)=>{
      x.n.cross=Math.max(x.d-cs(x.n)/2, cEnd);
      cEnd=x.n.cross+cs(x.n)+(i<arr.length-1?gapOf(x.n,arr[i+1].n):0);
    });
    const err=arr.reduce((s,x)=>s+center(x.n)-x.d,0)/arr.length;
    arr.forEach(x=>{ x.n.cross-=err; });
    lane.length=0; arr.forEach(x=>lane.push(x.n));
  };
  const sweep=dir=>{          // 1 = align to parents, -1 = align to children
    const idx=[]; ranksArr.forEach((l,i)=>l&&idx.push(i));
    const order=dir===1?idx.slice(1):idx.slice(0,-1).reverse();
    for(const i of order){
      const lane=ranksArr[i], des=new Map();
      for(const n of lane){
        const ref=(dir===1?preds:succs).get(n);
        des.set(n, ref&&ref.length ? ref.reduce((s,m)=>s+center(m),0)/ref.length : center(n));
      }
      place(lane,des);
    }
  };
  sweep(1); sweep(-1); sweep(1);
  let minC=Infinity; lay.forEach(n=>{ minC=Math.min(minC,n.cross); });
  if(!isFinite(minC)) minC=0;
  let main=0;
  ranksArr.forEach((lane,i)=>{
    if(!lane) return;
    lane.forEach(n=>{
      // waypoints span the full layer so chain bends happen in the gaps
      if(n.virtual){ if(horiz) n.w=laneSize[i]; else n.h=laneSize[i]; }
      if(horiz){ n.x=main; n.y=y0+20+n.cross-minC; }
      else     { n.y=y0+20+main; n.x=n.cross-minC; }
    });
    main+=laneSize[i]+mainGap[i];
  });
  if(doc.flow==='left'||doc.flow==='up'){
    const M=main; for(const n of lay){
      if(horiz) n.x=M-n.x-n.w; else n.y=y0+20+(M-(n.y-y0-20))-n.h; }
  }
  // Two-level coordinates (D6): a pinned GROUP anchors its local origin in
  // canvas px; a pinned MEMBER is group-local (relative to that origin);
  // ungrouped pins are canvas px. Moving a group = editing one pin line.
  const gOrigin={};
  for(const g of doc.groups){
    const p=doc.pins[g.id];
    if(p){ gOrigin[g.id]={x:p.fx, y:y0+20+p.fy}; }
    else{
      const mem=nodes.filter(n=>n.group===g.id);
      if(mem.length) gOrigin[g.id]={x:Math.min(...mem.map(n=>n.x)),
                                    y:Math.min(...mem.map(n=>n.y))};
    }
  }
  for(const n of nodes){ const p=doc.pins[n.id]; if(!p) continue;
    const o=n.group?gOrigin[n.group]:null;
    if(o){ n.x=o.x+p.fx; n.y=o.y+p.fy; }
    else { n.x=p.fx; n.y=y0+20+p.fy; }
  }
  // back-edge channel plan: slots used to be handed out in paint order, so
  // a far source could take the innermost slot and its long run crossed
  // every other return. Sort channel-bound back-edges so the source NEAREST
  // the channel gets the INNERMOST slot (vertical flow, right channel:
  // larger cx = nearer; horizontal flow, bottom channel: larger cy = nearer;
  // ties: document order). Where the pattern allows it (vertical flow,
  // clear space below the source, clear sky above the target) the loop is
  // drawn as a full concentric ring — drop row, channel, return row and hub
  // entry nested in the same order, entering the hub's top edge on the
  // channel side — so fan-in hubs (N states -> IDLE reset) have no crossings.
  const chPlan=new Map(); let chTop=0, chShift=0;
  {
    const chList=doc.edges.filter(e=>byId[e.a]&&byId[e.b]&&isBack.has(e)&&!pinned(e.a)&&!pinned(e.b));
    const near=e=>{ const A=byId[e.a]; return horiz?A.y+A.h/2:A.x+A.w/2; };
    const order=chList.map((e,i)=>({e,i}));
    order.sort((p,q)=>near(q.e)-near(p.e)||p.i-q.i);
    let cum=0;
    order.forEach(({e},ring)=>{
      const A=byId[e.a], B=byId[e.b], sx=A.x+A.w/2;
      const ringOK=!horiz&&A!==B
        &&!nodes.some(n=>n!==A&&n.x<sx&&n.x+n.w>sx&&n.y+n.h>A.y+A.h)
        &&!nodes.some(n=>n!==B&&n.x<B.x+B.w&&n.x+n.w>B.x&&n.y<B.y);
      chPlan.set(e,{ring,slot:cum,ringOK});
      cum+=(!horiz&&e.mid)?Math.max(22,lblPx(e.mid)+14):22;
    });
    // rings are all-or-nothing per target: a hub whose loops are part ring,
    // part legacy would reintroduce crossings between the two styles
    const byT={};
    order.forEach(({e})=>{ (byT[e.b]=byT[e.b]||[]).push(e); });
    for(const t in byT)
      if(!byT[t].every(e=>chPlan.get(e).ringOK))
        byT[t].forEach(e=>{ chPlan.get(e).ringOK=false; });
    // hub entries fan across the target's top edge, innermost ring nearest
    // the channel, so concentric rings never cross on their way in
    for(const t in byT){
      const g=byT[t].filter(e=>chPlan.get(e).ringOK);
      const B=byId[t], m=g.length;
      g.forEach((e,k)=>{ chPlan.get(e).ex=B.x+B.w*(m-k)/(m+1); });
    }
    // ring return rows run above the top rank; shift the whole scene down
    // when they would spill into the title band. The shift is uniform
    // (relative geometry, incl. pins, is preserved) and meta.top reports
    // the shifted origin so the editor's drag->pin round-trip stays stable.
    const rings=order.filter(({e})=>chPlan.get(e).ringOK);
    if(rings.length){
      let occT=Infinity;
      for(const n of nodes) occT=Math.min(occT, n.y-(n.group?26:0));
      const maxRing=Math.max(...rings.map(({e})=>chPlan.get(e).ring));
      chShift=Math.max(0, y0+20+maxRing*12-occT);
      if(chShift){ for(const n of lay) n.y+=chShift;
                   for(const k in gOrigin) gOrigin[k].y+=chShift; }
      chTop=occT+chShift;
    }
  }
  // anti-parallel straight edges (A->B and B->A) used to coincide: offset
  // each member of a same-pair straight group along the pair's CANONICAL
  // normal (endpoints sorted by id), so opposite directions land on
  // opposite sides; endpoints and labels shift together.
  const apOff=new Map();
  {
    const straight=e=>byId[e.a]&&byId[e.b]&&!(isBack.has(e)&&!pinned(e.a)&&!pinned(e.b))&&!chains.get(e);
    const pk=e=>e.a<e.b?e.a+'\t'+e.b:e.b+'\t'+e.a;
    const pairN={}, seen={};
    for(const e of doc.edges) if(straight(e)){ const k=pk(e); pairN[k]=(pairN[k]||0)+1; }
    for(const e of doc.edges){
      if(!straight(e)) continue;
      const k=pk(e), kk=pairN[k]; if(kk<2) continue;
      const idx=seen[k]||0; seen[k]=idx+1;
      const off=(idx-(kk-1)/2)*7;
      const lo=e.a<e.b?e.a:e.b, hi=e.a<e.b?e.b:e.a;
      const P=byId[lo], Q=byId[hi];
      const dx=(Q.x+Q.w/2)-(P.x+P.w/2), dy=(Q.y+Q.h/2)-(P.y+P.h/2), L=Math.hypot(dx,dy)||1;
      apOff.set(e,[-dy/L*off, dx/L*off]);
    }
  }
  let W=0,Hh=0;
  for(const n of lay){ W=Math.max(W,n.x+n.w); Hh=Math.max(Hh,n.y+n.h-y0-20); }
  if(W===0){W=480;} if(Hh===0){Hh=280;}
  // groups
  const gsvg=[]; const gBox={};
  for(const g of doc.groups){
    const mem=nodes.filter(n=>n.group===g.id);
    if(!mem.length) continue;
    const o=gOrigin[g.id];
    const x0=Math.min(...mem.map(n=>n.x))-14, x1=Math.max(...mem.map(n=>n.x+n.w))+14;
    const yA=Math.min(...mem.map(n=>n.y))-26, yB=Math.max(...mem.map(n=>n.y+n.h))+12;
    gBox[g.id]={x0,x1,yA,yB};
    gsvg.push('<g data-group="'+g.id+'" data-gx="'+o.x+'" data-gy="'+o.y+'" style="cursor:move">'
      +'<rect x="'+x0+'" y="'+yA+'" width="'+(x1-x0)+'" height="'+(yB-yA)+'" rx="10" fill="'+(g.color||'#f6f5ef')+'" stroke="#d6d4cc"/>'
      +'<text x="'+(x0+10)+'" y="'+(yA+16)+'" font-size="11.5" fill="#6f6e69">'+esc(g.label)+'</text></g>');
    W=Math.max(W,x1); Hh=Math.max(Hh,yB-y0-20);
  }
  // zone bands on groups: above the group background, below the nodes.
  // dir picks the measuring axis and its 0% edge: up=bottom, down=top,
  // right=left edge, left=right edge.
  const bandRect=(f,x0,yA,x1,yB)=>{
    const w=x1-x0, h=yB-yA;
    if(f.dir==='up')    return [x0, yB-h*f.to/100, w, h*(f.to-f.from)/100];
    if(f.dir==='down')  return [x0, yA+h*f.from/100, w, h*(f.to-f.from)/100];
    if(f.dir==='right') return [x0+w*f.from/100, yA, w*(f.to-f.from)/100, h];
    return [x1-w*f.to/100, yA, w*(f.to-f.from)/100, h];   // left
  };
  for(const f of doc.fills){
    const B=gBox[f.target]; if(!B) continue;
    const [bx,by,bw,bh]=bandRect(f,B.x0,B.yA,B.x1,B.yB);
    gsvg.push('<rect x="'+bx+'" y="'+by+'" width="'+bw+'" height="'+bh+'" fill="'+f.color+'" opacity="0.9"/>');
  }
  // edges (sorted by layer z, then doc order)
  const zOf=l=>{const L=doc.layers.find(x=>x.id===l);return L?L.z:0;};
  const edges=[...doc.edges].sort((p,q)=>zOf(p.layer)-zOf(q.layer));
  const esvg=[], lblsvg=[];  // labels paint last = closest to the viewer
  // back-edge side channel: beyond the occupied lanes (nodes AND group boxes)
  let occR=0, occB=0;
  for(const n of nodes){ occR=Math.max(occR,n.x+n.w); occB=Math.max(occB,n.y+n.h); }
  for(const k in gBox){ occR=Math.max(occR,gBox[k].x1); occB=Math.max(occB,gBox[k].yB); }
  if(!horiz) chains.forEach((chain,e)=>{      // chain labels stick out right
    if(!e.mid) return;
    const v=chain[1+Math.floor((chain.length-3)/2)];
    occR=Math.max(occR, v.x+v.w/2+9+lblPx(e.mid));
  });
  for(const e of edges){
    const A=byId[e.a], B=byId[e.b]; if(!A||!B) continue;
    const col=e.color||'#555';
    const dash=e.style==='dashed'?' stroke-dasharray="6 4"':(e.style==='dotted'?' stroke-dasharray="2 4"':'');
    const m1=(e.op==='<->'||e.op==='<-')?' marker-start="url(#arr)"':'',
          m2=(e.op==='<->'||e.op==='->')?' marker-end="url(#arr)"':'';
    const halo=' paint-order="stroke" stroke="#fff" stroke-width="3"';
    const seg=(p,q,t,lbl,fs)=>lblsvg.push(textEl(p[0]+(q[0]-p[0])*t, p[1]+(q[1]-p[1])*t-4, fs,'middle','#555',lbl,halo));
    if(isBack.has(e)&&!pinned(e.a)&&!pinned(e.b)){
      // back-edge (retry loop): polyline through a side channel beyond the
      // occupied lanes instead of a straight line hidden under the spine,
      // using the nested slot from the channel plan. Ring-eligible loops
      // wrap over the top and enter the hub's top edge; otherwise, when
      // the sideways run to the channel would cut through a sibling node,
      // the route drops into the inter-layer gap first.
      const lane=r=>(ranksArr[r]||[]).filter(n=>!n.virtual);
      const P=chPlan.get(e), ring=P.ring;
      const pts=[];
      if(horiz){             // channel runs below the lanes
        const chY=occB+28+P.slot;             // labels ride ON the channel
        const colR=r=>Math.max(...lane(r).map(n=>n.x+n.w));
        const blockedV=(y1,y2,xx,skip)=>nodes.some(n=>n!==skip&&n.x<xx&&n.x+n.w>xx&&n.y+n.h>y1&&n.y<y2);
        const sx=A===B?A.x+A.w*0.3:A.x+A.w/2, tx=A===B?B.x+B.w*0.7:B.x+B.w/2;
        if(A!==B&&blockedV(A.y+A.h,chY,sx,A)){
          const gx=colR(A.rank)+10+ring*7;
          pts.push([A.x+A.w,A.y+A.h/2],[gx,A.y+A.h/2],[gx,chY]);
        } else pts.push([sx,A.y+A.h],[sx,chY]);
        if(A!==B&&blockedV(B.y+B.h,chY,tx,B)){
          const gx=colR(B.rank)+10+ring*7;
          pts.push([gx,chY],[gx,B.y+B.h/2],[B.x+B.w,B.y+B.h/2]);
        } else pts.push([tx,chY],[tx,B.y+B.h]);
        if(e.mid){
          const c1=pts.findIndex(p=>p[1]===chY);
          lblsvg.push(textEl((pts[c1][0]+pts[c1+1][0])/2, chY-5, 11,'middle',col,e.mid,halo));
        }
      } else if(P.ringOK){   // concentric ring: under, around, over, in
        const sx=A.x+A.w/2;
        const gy=occB+14+ring*12, chX=occR+28+P.slot, topY=chTop-14-ring*12;
        pts.push([sx,A.y+A.h],[sx,gy],[chX,gy],[chX,topY],[P.ex,topY],[P.ex,B.y]);
        if(e.mid){
          const c1=pts.findIndex(p=>p[0]===chX);
          lblsvg.push(textEl(chX+7,(pts[c1][1]+pts[c1+1][1])/2+4,11,'start',col,e.mid,halo));
          W=Math.max(W, chX+9+lblPx(e.mid));
        }
      } else {               // channel runs right of the lanes
        const chX=occR+28+P.slot;
        const laneB=r=>Math.max(...lane(r).map(n=>n.y+n.h));
        const blockedH=(x1,x2,yy,skip)=>nodes.some(n=>n!==skip&&n.y<yy&&n.y+n.h>yy&&n.x+n.w>x1&&n.x<x2);
        const sy=A===B?A.y+A.h*0.3:A.y+A.h/2, ty=A===B?B.y+B.h*0.7:B.y+B.h/2;
        if(A!==B&&blockedH(A.x+A.w,chX,sy,A)){
          const gy=laneB(A.rank)+10+ring*7;
          pts.push([A.x+A.w/2,A.y+A.h],[A.x+A.w/2,gy],[chX,gy]);
        } else pts.push([A.x+A.w,sy],[chX,sy]);
        if(A!==B&&blockedH(B.x+B.w,chX,ty,B)){
          const gy=laneB(B.rank)+10+ring*7;
          pts.push([chX,gy],[B.x+B.w/2,gy],[B.x+B.w/2,B.y+B.h]);
        } else pts.push([chX,ty],[B.x+B.w,ty]);
        if(e.mid){
          const c1=pts.findIndex(p=>p[0]===chX);
          lblsvg.push(textEl(chX+7,(pts[c1][1]+pts[c1+1][1])/2+4,11,'start',col,e.mid,halo));
          W=Math.max(W, chX+9+lblPx(e.mid));
        }
      }
      // non-incident nodes are obstacles for the channel runs too: a run
      // that would cut through a sibling (e.g. a pinned node parked on the
      // escape lane) detours around it instead of drawing across it. When
      // spanning the following corner point gives a shorter total run than
      // detour + remaining leg (a detour "spike"), the corner is dropped.
      const obsN=nodes.filter(n=>n!==A&&n!==B).map(n=>({x:n.x,y:n.y,w:n.w,h:n.h}));
      const plen=pp=>{let s=0;for(let k=0;k+1<pp.length;k++)s+=Math.hypot(pp[k+1][0]-pp[k][0],pp[k+1][1]-pp[k][1]);return s;};
      for(let i=0;i+1<pts.length;i++){
        const d=routeAround(pts[i],pts[i+1],obsN);
        if(!d) continue;
        let ins=d.slice(1,-1), drop=0;
        if(i+2<pts.length){
          const span=segHitsObs(pts[i],pts[i+2],obsN)
            ?routeAround(pts[i],pts[i+2],obsN):[pts[i],pts[i+2]];
          if(span&&plen(span)<plen(d)+Math.hypot(pts[i+2][0]-pts[i+1][0],pts[i+2][1]-pts[i+1][1])-1e-6){
            ins=span.slice(1,-1); drop=1;
          }
        }
        pts.splice(i+1,drop,...ins);
        i+=ins.length;
      }
      for(const p of pts){ W=Math.max(W,p[0]+4); Hh=Math.max(Hh,p[1]+16-y0-20); }
      esvg.push('<path data-edge="'+e.line+'" d="M'+pts.map(p=>p.join(' ')).join(' L')+'" fill="none" stroke="'+col+'" stroke-width="1.6"'+dash+m1+m2+'/>');
      if(e.tail) seg(pts[0],pts[1],0.5,e.tail,10);
      if(e.head) seg(pts[pts.length-1],pts[pts.length-2],0.5,e.head,10);
      continue;
    }
    const chain=chains.get(e);
    if(chain){
      // multi-layer edge: polyline through its reserved waypoint lane;
      // each waypoint contributes an entry and an exit port so the run
      // through a layer is parallel to it and diagonals stay in the gaps
      const pts=[];
      let px=A.x+A.w/2, py=A.y+A.h/2;
      for(const v of chain.slice(1,-1)){
        const cx=v.x+v.w/2, cy=v.y+v.h/2;
        let p=horiz?[v.x,cy]:[cx,v.y], q=horiz?[v.x+v.w,cy]:[cx,v.y+v.h];
        if(horiz? px>cx : py>cy){ const t=p; p=q; q=t; }
        pts.push(p,q); px=q[0]; py=q[1];
      }
      const p0=borderPoint(A,pts[0][0],pts[0][1]);
      const p1=borderPoint(B,pts[pts.length-1][0],pts[pts.length-1][1]);
      pts.unshift(p0); pts.push(p1);
      esvg.push('<path data-edge="'+e.line+'" d="M'+pts.map(p=>p.join(' ')).join(' L')+'" fill="none" stroke="'+col+'" stroke-width="1.6"'+dash+m1+m2+'/>');
      if(e.mid){
        const v=chain[1+Math.floor((chain.length-3)/2)];  // middle waypoint
        const cx=v.x+v.w/2, cy=v.y+v.h/2;
        // sit in the inter-layer gap: lane centers carry crossing traffic
        if(horiz) lblsvg.push(textEl(cx, cy-5, 11,'middle',col,e.mid,halo));
        else{ lblsvg.push(textEl(cx+7, v.y-4, 11,'start',col,e.mid,halo));
              W=Math.max(W, cx+9+lblPx(e.mid)); }
      }
      if(e.tail) seg(p0,pts[1],0.4,e.tail,10);
      if(e.head) seg(p1,pts[pts.length-2],0.4,e.head,10);
      continue;
    }
    const ax=A.x+A.w/2, ay=A.y+A.h/2, bx=B.x+B.w/2, by=B.y+B.h/2;
    let [x1,yy1]=borderPoint(A,bx,by), [x2,yy2]=borderPoint(B,ax,ay);
    const ap=apOff.get(e);   // anti-parallel fan-out (labels ride along)
    if(ap){ x1+=ap[0]; yy1+=ap[1]; x2+=ap[0]; yy2+=ap[1]; }
    // group boxes and non-incident nodes are routing obstacles: a straight
    // run that pierces a node it does not touch, or a group box it neither
    // starts nor ends inside, detours around the obstacle boundary instead
    // (routeAround). Obstacle-free edges keep the plain line unchanged.
    let route=null;
    if(A!==B){
      const obs=nodes.filter(n=>n!==A&&n!==B).map(n=>({x:n.x,y:n.y,w:n.w,h:n.h}));
      for(const k in gBox){
        const b=gBox[k];
        const inG=(px,py)=>px>b.x0&&px<b.x1&&py>b.yA&&py<b.yB;
        if(!inG(x1,yy1)&&!inG(x2,yy2))
          obs.push({x:b.x0,y:b.yA,w:b.x1-b.x0,h:b.yB-b.yA});
      }
      route=routeAround([x1,yy1],[x2,yy2],obs);
      if(route){           // leave the node facing the first/last bend
        route[0]=borderPoint(A,route[1][0],route[1][1]);
        route[route.length-1]=borderPoint(B,route[route.length-2][0],route[route.length-2][1]);
      }
    }
    if(route){
      esvg.push('<path data-edge="'+e.line+'" d="M'+route.map(p=>p.join(' ')).join(' L')+'" fill="none" stroke="'+col+'" stroke-width="1.6"'+dash+m1+m2+'/>');
      if(e.mid){             // the longest segment carries the mid label
        let bi=0,bl=-1;
        for(let i=0;i+1<route.length;i++){
          const l=Math.hypot(route[i+1][0]-route[i][0],route[i+1][1]-route[i][1]);
          if(l>bl){ bl=l; bi=i; }
        }
        const pP=route[bi], qP=route[bi+1], mx=(pP[0]+qP[0])/2, my=(pP[1]+qP[1])/2;
        if(Math.abs(qP[0]-pP[0])>=Math.abs(qP[1]-pP[1]))
          lblsvg.push(textEl(mx,my-5,11,'middle',col,e.mid,halo));   // above a horizontal run
        else{ lblsvg.push(textEl(mx+7,my+4,11,'start',col,e.mid,halo)); // beside a vertical run
              W=Math.max(W,mx+9+lblPx(e.mid)); }
      }
      if(e.tail) seg(route[0],route[1],0.25,e.tail,10);
      if(e.head) seg(route[route.length-1],route[route.length-2],0.25,e.head,10);
      for(const pP of route){ W=Math.max(W,pP[0]+4); Hh=Math.max(Hh,pP[1]+4-y0-20); }
      continue;
    }
    esvg.push('<line data-edge="'+e.line+'" x1="'+x1+'" y1="'+yy1+'" x2="'+x2+'" y2="'+yy2+'" stroke="'+col+'" stroke-width="1.6"'+dash+m1+m2+'/>');
    if(e.mid){
      const mx=(x1+x2)/2, my=(yy1+yy2)/2;
      if(Math.abs(x2-x1)>=Math.abs(yy2-yy1))
        lblsvg.push(textEl(mx,my-5,11,'middle',col,e.mid,halo));   // above a horizontal edge
      else
        lblsvg.push(textEl(mx+7,my+4,11,'start',col,e.mid,halo));  // beside a vertical edge
    }
    // endpoint labels at the tail/head positions (three-position model, R34)
    if(e.tail)
      lblsvg.push(textEl(x1+(x2-x1)*0.18, yy1+(yy2-yy1)*0.18-4, 10,'middle','#555',e.tail,halo));
    if(e.head)
      lblsvg.push(textEl(x1+(x2-x1)*0.82, yy1+(yy2-yy1)*0.82-4, 10,'middle','#555',e.head,halo));
  }
  // nodes on top (each wrapped in a draggable, identifiable group)
  const nsvg=[];
  for(const n of nodes){
    nsvg.push('<g data-node="'+n.id+'" data-x="'+n.x+'" data-y="'+n.y+'" style="cursor:move">');
    const fill=n.color||'#fff', stroke=n.stroke||'#8a8880', txt=n.text||'#1d1d1b';
    const ndash=n.style==='dashed'?' stroke-dasharray="6 4"':(n.style==='dotted'?' stroke-dasharray="2 4"':'');
    if(n.shape==='diamond'){
      const cx=n.x+n.w/2, cy=n.y+n.h/2;
      nsvg.push('<polygon points="'+cx+','+n.y+' '+(n.x+n.w)+','+cy+' '+cx+','+(n.y+n.h)+' '+n.x+','+cy+'" fill="'+fill+'" stroke="'+stroke+'"'+ndash+'/>');
    } else if(n.shape==='rounded'){
      nsvg.push('<rect x="'+n.x+'" y="'+n.y+'" width="'+n.w+'" height="'+n.h+'" rx="'+Math.min(14,n.h/2)+'" fill="'+fill+'" stroke="'+stroke+'"'+ndash+' stroke-width="1.8"/>');
    } else if(n.shape==='cloud'){
      nsvg.push('<ellipse cx="'+(n.x+n.w/2)+'" cy="'+(n.y+n.h/2)+'" rx="'+(n.w/2+10)+'" ry="'+(n.h/2+8)+'" fill="'+fill+'" stroke="'+stroke+'"'+ndash+'/>');
    } else if(n.shape==='ellipse'||n.shape==='circle'){
      nsvg.push('<ellipse cx="'+(n.x+n.w/2)+'" cy="'+(n.y+n.h/2)+'" rx="'+(n.w/2)+'" ry="'+(n.shape==='circle'?n.w/2:n.h/2)+'" fill="'+fill+'" stroke="'+stroke+'"'+ndash+'/>');
    } else if(n.shape==='cylinder'){
      nsvg.push('<rect x="'+n.x+'" y="'+n.y+'" width="'+n.w+'" height="'+n.h+'" rx="3" fill="'+fill+'" stroke="'+stroke+'"'+ndash+'/>'
        +'<line x1="'+n.x+'" y1="'+(n.y+7)+'" x2="'+(n.x+n.w)+'" y2="'+(n.y+7)+'" stroke="'+stroke+'"/>');
    } else {
      // box = right-angle rectangle (the mainstream default: Mermaid/
      // Graphviz rects, hardware block diagrams); use shape=rounded for corners
      nsvg.push('<rect x="'+n.x+'" y="'+n.y+'" width="'+n.w+'" height="'+n.h+'" fill="'+fill+'" stroke="'+stroke+'"'+ndash+'/>');
    }
    // zone bands on this node (dir: up=bottom-based, down, left, right)
    for(const f of doc.fills){
      if(f.target!==n.id) continue;
      const [bx,by,bw,bh]=bandRect(f,n.x,n.y,n.x+n.w,n.y+n.h);
      nsvg.push('<rect x="'+bx+'" y="'+by+'" width="'+bw+'" height="'+bh+'" fill="'+f.color+'" opacity="0.9"/>');
    }
    // label with shrink-to-fit when size is rigid (R10); multi-line via "\n"
    let fs=FONT;
    const need=Math.max(...String(n.label).split('\n').map(l=>l.length))*CH;
    if(n.rigid && need>n.w-2*8) fs=Math.max(8, FONT*(n.w-16)/need);
    nsvg.push(textEl(n.x+n.w/2, n.y+n.h/2+fs*0.35, fs, 'middle', txt, n.label));
    nsvg.push('</g>');
  }
  // trunk rings (semantic LAG/ES bundles): the ellipse is DERIVED from the
  // member links' midpoints — drag a node and the ring follows
  const tsvg=[];
  for(const t of doc.trunks){
    const mids=[];
    for(const [a,b] of t.pairs){
      const A=byId[a], B=byId[b]; if(!A||!B) continue;
      const [x1,yy1]=borderPoint(A,B.x+B.w/2,B.y+B.h/2);
      const [x2,yy2]=borderPoint(B,A.x+A.w/2,A.y+A.h/2);
      mids.push([(x1+x2)/2,(yy1+yy2)/2]);
    }
    if(!mids.length) continue;
    const cx=mids.reduce((s,m)=>s+m[0],0)/mids.length;
    const cy=mids.reduce((s,m)=>s+m[1],0)/mids.length;
    const rx=Math.max(46, Math.max(...mids.map(m=>Math.abs(m[0]-cx)))+38);
    const ry=Math.max(26, Math.max(...mids.map(m=>Math.abs(m[1]-cy)))+22);
    const col=t.color||'#64748b';
    tsvg.push('<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="transparent" stroke="'+col+'" stroke-dasharray="6 4" stroke-width="1.6"/>');
    tsvg.push(textEl(cx, cy+4, 11.5, 'middle', col, t.label,' paint-order="stroke" stroke="#fff" stroke-width="3"'));
    W=Math.max(W,cx+rx); Hh=Math.max(Hh,cy+ry-y0-20);
  }
  // guide lines + labels (top layer)
  for(const gl of doc.glines){
    const B=gBox[gl.group]; if(!B) continue;
    const ly=B.yB-(B.yB-B.yA)*gl.pct/100;
    const col=gl.color||'#ef4444';
    tsvg.push('<g data-gline="'+gl.line+'" data-gtop="'+B.yA+'" data-gbot="'+B.yB+'" style="cursor:ns-resize">'
      +'<line x1="'+B.x0+'" y1="'+ly+'" x2="'+B.x1+'" y2="'+ly+'" stroke="'+col+'" stroke-width="'+(gl.pct>=100?4:2)+'" stroke-dasharray="7 4"/>'
      +'<line x1="'+B.x0+'" y1="'+ly+'" x2="'+B.x1+'" y2="'+ly+'" stroke="transparent" stroke-width="12"/>'
      +textEl(B.x1+8, ly+4, 11, 'start', col, gl.label,' paint-order="stroke" stroke="#fff" stroke-width="3"')+'</g>');
    W=Math.max(W, B.x1+8+tw(gl.label)); Hh=Math.max(Hh, B.yB-y0-20);
  }
  const yEnd=y0+20+Hh+10;
  return {svg:gsvg.join('')+esvg.join('')+nsvg.join('')+tsvg.join('')+lblsvg.join(''), y:yEnd, w:W+2,
          meta:{W:W, top:y0+20+chShift, Hh:Hh}};
}
function borderPoint(n,tx,ty){
  const cx=n.x+n.w/2, cy=n.y+n.h/2, dx=tx-cx, dy=ty-cy;
  if(dx===0&&dy===0) return [cx,cy];
  const sx=(n.w/2)/Math.abs(dx||1e-9), sy=(n.h/2)/Math.abs(dy||1e-9), s=Math.min(sx,sy);
  return [cx+dx*s, cy+dy*s];
}
// straight-edge obstacle routing: group boxes and non-incident nodes are
// obstacles a straight edge must not cut through.
// clipSegRect (Liang-Barsky): the [t0,t1] parameter window where segment
// p->q lies inside the box, or null when it misses entirely.
function clipSegRect(p,q,x0,y0,x1,y1){
  let t0=0,t1=1; const dx=q[0]-p[0], dy=q[1]-p[1];
  for(const [den,num] of [[-dx,p[0]-x0],[dx,x1-p[0]],[-dy,p[1]-y0],[dy,y1-p[1]]]){
    if(den===0){ if(num<0) return null; continue; }
    const t=num/den;
    if(den<0){ if(t>t1) return null; if(t>t0) t0=t; }
    else     { if(t<t0) return null; if(t<t1) t1=t; }
  }
  return t0<t1?[t0,t1]:null;
}
// routeAround: detour segment p->q around obstacle rects via the shortest
// clear polyline. Candidate bend points are the corners of each obstacle
// expanded by a 10px clearance margin; a sight-line is clear when it cuts
// no obstacle interior. Dijkstra over that visibility graph keeps routes
// short and calm, and is deterministic (fixed vertex order — endpoints,
// then obstacles in caller order with corners clockwise from top-left —
// breaks ties). Obstacles already containing an endpoint cannot be
// avoided and are ignored. Returns the detour polyline, or null when the
// straight segment is clear — callers keep their original rendering then.
function segHitsObs(p,q,obs){
  for(const r of obs)
    if(clipSegRect(p,q,r.x+2,r.y+2,r.x+r.w-2,r.y+r.h-2)) return true;
  return false;
}
function routeAround(p,q,obs){
  const M=10;
  const inside=(pt,r)=>pt[0]>r.x+2&&pt[0]<r.x+r.w-2&&pt[1]>r.y+2&&pt[1]<r.y+r.h-2;
  obs=obs.filter(r=>!inside(p,r)&&!inside(q,r));
  const blocked=(a,b)=>segHitsObs(a,b,obs);
  if(!blocked(p,q)) return null;
  const V=[p.slice(),q.slice()];
  for(const r of obs){
    const L=r.x-M, T=r.y-M, R=r.x+r.w+M, B=r.y+r.h+M;
    for(const c of [[L,T],[R,T],[R,B],[L,B]])
      if(!obs.some(o=>inside(c,o))) V.push(c);
  }
  const n=V.length, dist=Array(n).fill(Infinity), from=Array(n).fill(-1), done=Array(n).fill(false);
  dist[0]=0;
  for(;;){
    let u=-1;
    for(let i=0;i<n;i++) if(!done[i]&&(u<0||dist[i]<dist[u])) u=i;
    if(u<0||u===1||dist[u]===Infinity) break;
    done[u]=true;
    for(let v=0;v<n;v++){
      if(done[v]||blocked(V[u],V[v])) continue;
      const d=dist[u]+Math.hypot(V[v][0]-V[u][0],V[v][1]-V[u][1]);
      if(d<dist[v]-1e-9){ dist[v]=d; from[v]=u; }
    }
  }
  if(dist[1]===Infinity) return null;    // boxed in: keep the straight line
  const pts=[]; for(let v=1;v!==-1;v=from[v]) pts.push(V[v]); pts.reverse();
  for(let i=1;i+1<pts.length;i++){ // drop duplicate / collinear midpoints
    const a=pts[i-1], b=pts[i], c=pts[i+1];
    const cr=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    if(Math.hypot(b[0]-a[0],b[1]-a[1])<0.5||Math.abs(cr)<1e-6){ pts.splice(i,1); i--; }
  }
  return pts.length>2?pts:null;
}

// ---- bitfield ----
function renderBitfield(b,y0){
  const cell=Math.max(18,Math.min(28,Math.floor(760/b.unit))), rh=30, ruler=16;
  const svg=[]; let y=y0+18;
  svg.push('<text x="0" y="'+(y-4)+'" font-size="13" font-weight="600">'+esc(b.label)+'</text>');
  // ruler: lsb0 (register style, default) = N-1..0; msb0 (RFC style) = 0..N-1
  for(let i=0;i<b.unit;i++){
    const bit=(b.numbering==='msb0') ? i : b.unit-1-i;
    svg.push('<text x="'+(i*cell+cell/2)+'" y="'+(y+11)+'" font-size="8.5" text-anchor="middle" fill="#6f6e69">'+bit+'</text>');
  }
  y+=ruler;
  let pos=0; // bit cursor
  for(const f of b.fields){
    if(f.wrap){ pos=Math.ceil((pos||1)/b.unit)*b.unit; continue; }
    // '*' = variable-length: fill the remainder of the current row
    const w0 = f.w==='*' ? (b.unit - (pos % b.unit)) : f.w;
    let rem = w0;
    while(rem>0){
      const row=Math.floor(pos/b.unit), col=pos%b.unit;
      const span=Math.min(rem, b.unit-col);
      const x=col*cell, yy=y+row*rh;
      const dash=f.optional?' stroke-dasharray="5 3"':'';
      svg.push('<rect x="'+x+'" y="'+yy+'" width="'+(span*cell)+'" height="'+rh+'" fill="'+(f.color||'#fff')+'" stroke="#555"'+dash+'/>');
      if(span*cell>String(f.name).length*6 || rem===w0){
        let fs=11; const need=String(f.name).length*6.2;
        if(need>span*cell-6) fs=Math.max(7,11*(span*cell-6)/need);
        svg.push('<text x="'+(x+span*cell/2)+'" y="'+(yy+rh/2+fs*0.35)+'" font-size="'+fs+'" text-anchor="middle">'+esc(f.name)+'</text>');
      }
      if(f.note && rem===w0)
        svg.push('<title>'+esc(f.note)+'</title>');
      pos+=span; rem-=span;
    }
  }
  const rows=Math.max(1,Math.ceil(pos/b.unit));
  return {svg:svg.join(''), y:y+rows*rh+6, w:b.unit*cell+2};
}

// ---- table (with ^ rowspan / < colspan merging and per-cell marks) ----
function renderTable(t,y0){
  const rh=26; const svg=[]; let y=y0+18;
  svg.push('<text x="0" y="'+(y-4)+'" font-size="13" font-weight="600">'+esc(t.label)+'</text>');
  // grid: header tiers (from `head`/`cols` lines) then data rows
  const H=t.heads.length;
  const grid=t.heads.map(hr=>hr.map(c=>({v:c.v,m:c.m,hdr:true})))
    .concat(t.rows.map(r=>r.cells.map(c=>({v:c.v,m:c.m}))));
  const hlRow=r=>r>=H&&(t.rowmarks||[]).some(mk=>mk.r===r-H+1);
  const alignOf=c=>(t.aligns&&t.aligns[c])||null;
  const widths=t.cols.map((c,i)=>{
    let w=30;
    for(const hr of t.heads) if(!hr[i].m) w=Math.max(w,tw(hr[i].v));
    for(const r of t.rows) if(!r.cells[i].m) w=Math.max(w,tw(r.cells[i].v));
    return w;
  });
  if(t.colw){                       // colw: auto = natural, px fixed, % of natural total
    const base=widths.reduce((a,b2)=>a+b2,0);
    t.colw.vals.forEach((v,i)=>{
      if(v.t==='px') widths[i]=v.v;
      else if(v.t==='pct') widths[i]=v.v/100*base;
    });
  }
  const totalW=widths.reduce((a,b)=>a+b,0);
  // cell marks: h1..hN address header tiers top-down, r>=1 the data rows
  const markOf=(r,c)=>(t.marks||[]).find(mk=>(mk.hdr?mk.r-1:H+mk.r-1)===r&&mk.c===c+1);
  const yTop=y+4;
  for(let r=0;r<grid.length;r++){
    for(let c=0;c<grid[r].length;c++){
      const cell=grid[r][c];
      if(cell.m) continue;                    // merged into an anchor cell
      let cs=1; while(c+cs<grid[r].length && grid[r][c+cs].m==='left') cs++;
      let rs=1; while(r+rs<grid.length && grid[r+rs][c].m==='up') rs++;
      const x=widths.slice(0,c).reduce((a,b)=>a+b,0);
      const wsum=widths.slice(c,c+cs).reduce((a,b)=>a+b,0);
      const yy=yTop+r*rh, h=rs*rh;
      const mk=markOf(r,c);
      const fill=mk?mk.color:(cell.hdr?'#eeede6':(hlRow(r)?'#fef3c7':'#fff'));
      // addressable cells carry table-id:row:col (row 0 = bottom header tier)
      const addrR = r>=H ? (r-H+1) : (r===H-1 ? 0 : null);
      const addr = addrR===null ? '' : ' data-cell="'+t.id+':'+addrR+':'+(c+1)+'" style="cursor:pointer"';
      svg.push('<rect x="'+x+'" y="'+yy+'" width="'+wsum+'" height="'+h+'" fill="'+fill+'" stroke="#c9c7bf"'+addr+'/>');
      // alignment: headers centered; data follows GFM colon alignment (default left)
      const al=cell.hdr?'center':(alignOf(c)||'left');
      const tx=al==='center'?x+wsum/2:(al==='right'?x+wsum-7:x+7);
      const anchor=al==='center'?'middle':(al==='right'?'end':'start');
      svg.push('<text x="'+tx+'" y="'+(yy+h/2+4.3)+'" font-size="12" text-anchor="'+anchor+'"'+(cell.hdr?' font-weight="600"':'')+'>'+esc(cell.v)+'</text>');
    }
  }
  const yEnd=yTop+grid.length*rh;
  return {svg:svg.join(''), y:yEnd+6, w:totalW+2};
}

// ---- plot bars3d: deterministic isometric projection of a table ----
function shade(hex,f){
  const v=parseInt(hex.slice(1),16);
  const c=x=>Math.round(Math.max(0,Math.min(255,x))).toString(16).padStart(2,'0');
  return '#'+c(((v>>16)&255)*f)+c(((v>>8)&255)*f)+c((v&255)*f);
}
const PLOT_PALETTE=['#3b82f6','#22c55e','#f59e0b','#ef4444','#a855f7','#14b8a6','#eab308','#64748b'];
function renderPlot(b,y0,doc){
  const t=doc.blocks.find(x=>x.type==='table'&&x.id===b.tid);
  const rows=t.rows.map(r=>r.cells.slice(1).map(c=>parseFloat(c.v)||0));
  const rLab=t.rows.map(r=>r.cells[0].v), cLab=t.cols.slice(1);
  const R=rows.length, C=cLab.length;
  const zmax=Math.max(b.level||0, ...rows.flat(), 1);
  const W2=20,H2=10,ZS=130/zmax,BAR=0.72;
  const ox=R*W2+8, oy=y0+18+ZS*zmax+6;
  const P=(r,c,z)=>[ox+(c-r)*W2, oy+(c+r)*H2-z*ZS];
  const svg=[];
  svg.push('<text x="0" y="'+(y0+14)+'" font-size="13" font-weight="600">'+esc(t.label)+' — bars3d</text>');
  // floor grid edges
  const F=[P(0,0,0),P(R,0,0),P(R,C,0),P(0,C,0)];
  svg.push('<polygon points="'+F.map(p=>p.join(',')).join(' ')+'" fill="#f6f5ef" stroke="#d6d4cc"/>');
  // bars, far to near
  const order=[];
  for(let r=0;r<R;r++)for(let c=0;c<C;c++)order.push([r,c]);
  order.sort((a,b2)=>(a[0]+a[1])-(b2[0]+b2[1]));
  for(const [r,c] of order){
    const h=rows[r][c]; if(h<=0) continue;
    const col=PLOT_PALETTE[c%PLOT_PALETTE.length];
    const i0=r+(1-BAR)/2, i1=r+(1+BAR)/2, j0=c+(1-BAR)/2, j1=c+(1+BAR)/2;
    const A=P(i0,j0,h),Bp=P(i1,j0,h),Cp=P(i1,j1,h),D=P(i0,j1,h);
    const B0=P(i1,j0,0),C0=P(i1,j1,0),D0=P(i0,j1,0);
    svg.push('<polygon points="'+[Bp,Cp,C0,B0].map(p=>p.join(',')).join(' ')+'" fill="'+shade(col,0.72)+'"/>');
    svg.push('<polygon points="'+[Cp,D,D0,C0].map(p=>p.join(',')).join(' ')+'" fill="'+shade(col,0.55)+'"/>');
    svg.push('<polygon points="'+[A,Bp,Cp,D].map(p=>p.join(',')).join(' ')+'" fill="'+col+'"/>');
  }
  // threshold plane (translucent, drawn over bars like the convention)
  if(b.level!==null&&b.level!==undefined){
    const L=[P(0,0,b.level),P(R,0,b.level),P(R,C,b.level),P(0,C,b.level)];
    svg.push('<polygon points="'+L.map(p=>p.join(',')).join(' ')+'" fill="#ef4444" opacity="0.18" stroke="#ef4444" stroke-dasharray="6 4"/>');
    svg.push(textEl(L[3][0]+8, L[3][1]+4, 11, 'start', '#ef4444', 'level '+b.level,' paint-order="stroke" stroke="#fff" stroke-width="3"'));
  }
  // axis labels
  rLab.forEach((l,r)=>{ const p=P(r+0.5,-0.15,0); svg.push(textEl(p[0]-4,p[1]+10,10,'end','#6f6e69',l)); });
  cLab.forEach((l,c)=>{ const p=P(R+0.15,c+0.5,0); svg.push(textEl(p[0]+4,p[1]+10,10,'start','#6f6e69',l)); });
  // z ruler at the right-back corner
  const zr=P(0,C,0);
  svg.push('<line x1="'+(zr[0]+14)+'" y1="'+zr[1]+'" x2="'+(zr[0]+14)+'" y2="'+(zr[1]-zmax*ZS)+'" stroke="#8a8880"/>');
  for(const z of [0, Math.round(zmax/2), Math.round(zmax)]){
    svg.push('<line x1="'+(zr[0]+11)+'" y1="'+(zr[1]-z*ZS)+'" x2="'+(zr[0]+17)+'" y2="'+(zr[1]-z*ZS)+'" stroke="#8a8880"/>');
    svg.push(textEl(zr[0]+21, zr[1]-z*ZS+3.5, 9.5, 'start', '#6f6e69', String(z)));
  }
  const w=P(R,C,0)[0]+70, hgt=P(R,C,0)[1]+24-y0;
  return {svg:svg.join(''), y:y0+hgt, w:w};
}

// ---- wave ----
function renderWave(w,y0){
  const tickW=26, laneH=30, laneGap=12, nameW=Math.max(...w.signals.map(s=>tw(s.name)),60);
  const svg=[]; let y=y0+18;
  svg.push('<text x="0" y="'+(y-4)+'" font-size="13" font-weight="600">'+esc(w.label)+'</text>');
  const ticks=Math.max(...w.signals.map(s=>s.lane.length));
  w.signals.forEach((s,si)=>{
    const top=y+8+si*(laneH+laneGap), bot=top+laneH-8;
    svg.push('<text x="'+(nameW-10)+'" y="'+(top+(laneH-8)/2+4)+'" font-size="11.5" text-anchor="end" font-family="monospace">'+esc(s.name)+'</text>');
    let d='', prev=null, li=0, dataIdx=0;
    for(let i=0;i<s.lane.length;i++){
      let ch=s.lane[i];
      if(ch==='.') ch=prev||'0';
      const x=nameW+i*tickW;
      if(ch==='p'||ch==='n'){
        const hiFirst=(ch==='p');
        const a=hiFirst?top:bot, b=hiFirst?bot:top;
        d+='M'+x+','+a+' L'+(x+tickW/2)+','+a+' L'+(x+tickW/2)+','+b+' L'+(x+tickW)+','+b+' ';
        // draw transition edge at tick start
        if(prev) d+='M'+x+','+top+' L'+x+','+bot+' ';
      } else if(ch==='0'||ch==='1'){
        const yy=(ch==='1')?top:bot;
        const pv=(prev==='1')?top:(prev==='0'?bot:null);
        if(pv!==null&&pv!==yy) d+='M'+x+','+pv+' L'+x+','+yy+' ';
        d+='M'+x+','+yy+' L'+(x+tickW)+','+yy+' ';
      } else if(ch==='x'){
        svg.push('<rect x="'+x+'" y="'+top+'" width="'+tickW+'" height="'+(bot-top)+'" fill="url(#hatch)" stroke="#999"/>');
      } else if(/[=\d]/.test(ch)){
        // merge consecutive identical data chars
        let j=i; while(j+1<s.lane.length && s.lane[j+1]==='.') j++;
        const span=j-i+1;
        svg.push('<rect x="'+x+'" y="'+top+'" width="'+(tickW*span)+'" height="'+(bot-top)+'" fill="#eef6ff" stroke="#7aa7d9"/>');
        const lbl = ch==='='? (s.labels[dataIdx++]||'') : ch;
        if(lbl) svg.push('<text x="'+(x+tickW*span/2)+'" y="'+((top+bot)/2+4)+'" font-size="10.5" text-anchor="middle">'+esc(lbl)+'</text>');
        i=j;
      }
      prev=ch;
    }
    if(d) svg.push('<path d="'+d+'" fill="none" stroke="#1d4ed8" stroke-width="1.6"/>');
  });
  for(const g of w.gaps){
    const x=nameW+g*tickW;
    const hTotal=w.signals.length*(laneH+laneGap);
    svg.push('<path d="M'+x+','+(y+4)+' q4,'+(hTotal/4)+' 0,'+(hTotal/2)+' q-4,'+(hTotal/4)+' 0,'+(hTotal/2)+'" fill="none" stroke="#999" stroke-width="2"/>');
  }
  const H=y+8+w.signals.length*(laneH+laneGap);
  return {svg:svg.join(''), y:H, w:nameW+ticks*tickW+2};
}

// ============================================================
return { parse: parse, render: render };
})();

// ---- minimal synchronous SHA-256 (FIPS 180-4), hex output ----
// Dependency-free so artifact() works in browsers and Node alike.
var __SHA_K = [
0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
function __sha256hex(text) {
  var b = [], i, c;
  for (i = 0; i < text.length; i++) {           // UTF-8 encode
    c = text.codePointAt(i); if (c > 0xffff) i++;
    if (c < 0x80) b.push(c);
    else if (c < 0x800) b.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) b.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else b.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  var len = b.length, hi = Math.floor(len / 0x20000000), lo = (len << 3) >>> 0;
  b.push(0x80);
  while (b.length % 64 !== 56) b.push(0);
  b.push(hi >>> 24 & 255, hi >>> 16 & 255, hi >>> 8 & 255, hi & 255,
         lo >>> 24 & 255, lo >>> 16 & 255, lo >>> 8 & 255, lo & 255);
  var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  var w = new Array(64), r = function (x, n) { return (x >>> n) | (x << (32 - n)); };
  for (var off = 0; off < b.length; off += 64) {
    for (i = 0; i < 16; i++)
      w[i] = (b[off+4*i] << 24) | (b[off+4*i+1] << 16) | (b[off+4*i+2] << 8) | b[off+4*i+3];
    for (i = 16; i < 64; i++)
      w[i] = (w[i-16] + (r(w[i-15],7) ^ r(w[i-15],18) ^ (w[i-15] >>> 3))
            + w[i-7]  + (r(w[i-2],17) ^ r(w[i-2],19)  ^ (w[i-2] >>> 10))) | 0;
    var a=H[0],bb=H[1],cc=H[2],d=H[3],e=H[4],f=H[5],g=H[6],hh=H[7];
    for (i = 0; i < 64; i++) {
      var t1 = (hh + (r(e,6)^r(e,11)^r(e,25)) + ((e & f) ^ (~e & g)) + __SHA_K[i] + w[i]) | 0;
      var t2 = ((r(a,2)^r(a,13)^r(a,22)) + ((a & bb) ^ (a & cc) ^ (bb & cc))) | 0;
      hh=g; g=f; f=e; e=(d+t1)|0; d=cc; cc=bb; bb=a; a=(t1+t2)|0;
    }
    H[0]=(H[0]+a)|0; H[1]=(H[1]+bb)|0; H[2]=(H[2]+cc)|0; H[3]=(H[3]+d)|0;
    H[4]=(H[4]+e)|0; H[5]=(H[5]+f)|0; H[6]=(H[6]+g)|0; H[7]=(H[7]+hh)|0;
  }
  var out = '';
  for (i = 0; i < 8; i++) out += ('00000000' + (H[i] >>> 0).toString(16)).slice(-8);
  return out;
}

// ---- public API ----
// parse(text) -> { doc, errors }   errors: array of "Line N: message"
function parse(text) {
  var p = __engine.parse(String(text));
  return { doc: p.doc, errors: p.errs };
}
// render(text) -> { svg, errors }  svg is null when there are errors
// (determinism over convenience: no partial renders of invalid input).
function render(text) {
  var p = parse(text);
  if (p.errors.length) return { svg: null, errors: p.errors };
  return { svg: __engine.render(p.doc).svg, errors: [] };
}
// renderDoc(doc) -> svg string, for an already-validated doc from parse().
function renderDoc(doc) {
  return __engine.render(doc).svg;
}
// artifact(text) -> { svg, errors }  svg is the full self-carrying SVG:
// the render plus a <metadata id="figdown-source"> block embedding the
// source text and its SHA-256 (same convention as tools/build-svg.js).
// svg is null when there are errors.
function artifact(text) {
  var src = String(text);
  var p = render(src);
  if (p.errors.length) return { svg: null, errors: p.errors };
  var meta = '<metadata id="figdown-source" data-sha256="' + __sha256hex(src) + '"><![CDATA[\n'
    + src.replace(/]]>/g, ']]]]><![CDATA[>') + '\n]]></metadata>';
  return { svg: p.svg.replace(/<\/svg>$/, meta + '</svg>'), errors: [] };
}

var version = VERSION;
export { parse, render, renderDoc, artifact, version };
