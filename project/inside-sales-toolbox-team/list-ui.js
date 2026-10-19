// Compact, keyboard-accessible records. All external values remain plain text.
(()=>{
 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
 const opened=new Set();
 function fieldList(headers,values){const dl=node('dl','record-fields');headers.forEach((h,i)=>{if(values[i]!==''&&values[i]!==null&&values[i]!==undefined){const pair=node('div','');pair.append(node('dt','',h),node('dd','source-value',values[i]));dl.append(pair);}});return dl;}
 function link(text,href,cls,host){let e=node('span',cls+' source-value',text);try{const u=new URL(href);if(u.protocol==='https:'&&!u.username&&!u.password&&(!host||u.hostname===host)){e=node('a',cls+' source-value',text);e.href=u.href;e.target='_blank';e.rel='noopener noreferrer';}}catch{}return e;}
 function row({key,code,name,description,amount,amounts=[],href,host,meta=[],availability}){
  const details=node('details','record-row');details.open=opened.has(key);
  details.addEventListener('toggle',()=>{if(details.isConnected){if(details.open)opened.add(key);else opened.delete(key);}});
  const summary=node('summary','record-summary'),top=node('span','record-top'),heading=node('span','record-heading');
  heading.append(link(code,href,'record-code',host));if(name)heading.append(node('span','record-name source-value',name));
  const aside=node('span','record-aside');let valuations;
  if(availability){details.dataset.stock=availability.state;details.className+=' record-with-stock';const stock=node('span','stock-quantity '+(availability.state==='available'?'is-available':availability.state==='empty'?'is-empty':'is-unverified'));stock.append(node('strong','source-value',availability.quantity??'?'),node('span','stock-quantity-label',availability.caption));aside.append(stock);}
  if(amounts.length){valuations=node('span','record-valuations');for(const m of amounts){const line=node('span','record-valuation');line.append(node('span','record-label',m.label),node('strong','record-amount'+(m.raw===false?'':' source-value'),m.value));valuations.append(line);}if(!availability)aside.append(valuations);}else if(amount)aside.append(node('strong','record-amount source-value',amount));const chevron=node('span','record-chevron','⌄');chevron.setAttribute('aria-hidden','true');aside.append(chevron);top.append(heading,aside);summary.append(top);
  if(description){const desc=node('span','record-description source-value',description);desc.title=description;summary.append(desc);}
  const bottom=node('span','record-meta');if(availability?.place)bottom.append(node('span','record-stock-place source-value',availability.place));for(const m of meta){const item=node('span','record-meta-item'+(m.positive?' is-positive':''));if(m.label)item.append(node('span','record-label',m.label));item.append(node('span',m.raw===false?'':'source-value',m.value));bottom.append(item);}
  if(availability){const footer=node('span','record-stock-footer');if(meta.length||availability.place)footer.append(bottom);if(valuations)footer.append(valuations);summary.append(footer);}else if(meta.length)summary.append(bottom);
  details.append(summary);return details;
 }
 function diagnostics(id,value){const output=document.getElementById(id);output.hidden=false;output.value=JSON.stringify(value,null,2);const tools=output.closest('.module-tools');if(tools)tools.open=true;}
 function time(at){return new Date(at).toLocaleString(document.documentElement.lang==='en-CA'?'en-CA':'fr-CA',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});}
 globalThis.ToolboxList={node,fieldList,row,link,diagnostics,time};
})();
