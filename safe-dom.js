export function clear(node){if(node)node.replaceChildren();}
export function el(tag,{className,text,attrs}={}){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=String(text);if(attrs)Object.entries(attrs).forEach(([k,v])=>{if(v!==undefined&&v!==null)n.setAttribute(k,String(v));});return n;}
export function button(text,opts={}){return el('button',{className:opts.className,text,attrs:{type:opts.type||'button',title:opts.title}});}
export function append(parent,...children){children.filter(Boolean).forEach((c)=>parent.appendChild(c));return parent;}
