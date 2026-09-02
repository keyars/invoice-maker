import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'

type Item = { id: string; description: string; quantity: number; rate: number; tax: number }
type Invoice = {
  business: { name: string; email: string; phone: string; address: string; taxId: string; website: string; logo?: string }
  client: { name: string; email: string; phone: string; address: string; taxId: string }
  invoiceNo: string; issueDate: string; dueDate: string; currency: string; status: 'draft'|'sent'|'paid'|'overdue'
  items: Item[]; discountType: 'percent'|'fixed'; discount: number; shipping: number; amountPaid: number
  notes: string; terms: string; payment: string; accent: string; template: 'classic'|'modern'|'minimal'; density: 'comfortable'|'compact'
}

const uid = () => Math.random().toString(36).slice(2, 10)
const today = () => new Date().toISOString().slice(0, 10)
const plusDays = (n: number) => { const d = new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10) }
const initial: Invoice = {
  business: { name: 'Northstar Studio', email: 'hello@northstar.studio', phone: '+1 555 010 2040', address: '18 Market Street\nSan Francisco, CA 94105', taxId: 'US-TAX-2040', website: 'northstar.studio' },
  client: { name: 'Acme Corporation', email: 'accounts@acme.example', phone: '+1 555 010 8844', address: '200 Mission Street\nSan Francisco, CA 94105', taxId: '' },
  invoiceNo: 'INV-2026-001', issueDate: today(), dueDate: plusDays(14), currency: 'USD', status: 'draft',
  items: [
    { id: uid(), description: 'Product design & UX strategy', quantity: 1, rate: 2400, tax: 10 },
    { id: uid(), description: 'Frontend implementation', quantity: 24, rate: 95, tax: 10 },
  ], discountType: 'percent', discount: 5, shipping: 0, amountPaid: 0,
  notes: 'Thank you for your business. Please reference the invoice number with your payment.',
  terms: 'Payment due within 14 days. Late payments may be subject to applicable fees.',
  payment: 'Bank transfer\nAccount: Northstar Studio\nReference: invoice number', accent: '#171717', template: 'modern', density: 'comfortable',
}

const currencySymbols: Record<string,string> = { USD:'$', EUR:'€', GBP:'£', INR:'₹', AUD:'A$', CAD:'C$', JPY:'¥', SGD:'S$' }
const money = (n:number, currency:string) => `${currencySymbols[currency] ?? currency} ${n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`
const clone = <T,>(v:T):T => JSON.parse(JSON.stringify(v))

export default function App() {
  const [invoice,setInvoice] = useState<Invoice>(() => {
    try { return JSON.parse(localStorage.getItem('invoice-maker-current') || 'null') || initial } catch { return initial }
  })
  const [activeTab,setActiveTab] = useState<'details'|'items'|'settings'>('details')
  const [notice,setNotice] = useState('Autosaved locally')
  const fileRef = useRef<HTMLInputElement>(null)
  const calc = useMemo(() => {
    const subtotal = invoice.items.reduce((s,i)=>s + i.quantity*i.rate,0)
    const discount = invoice.discountType==='percent' ? subtotal*(invoice.discount/100) : invoice.discount
    const taxable = Math.max(0,subtotal-discount)
    const tax = invoice.items.reduce((s,i)=>s + (i.quantity*i.rate)*(i.tax/100),0)
    const total = Math.max(0,taxable + tax + invoice.shipping)
    return { subtotal, discount, tax, total, balance: Math.max(0,total-invoice.amountPaid) }
  },[invoice])

  useEffect(()=>{ localStorage.setItem('invoice-maker-current',JSON.stringify(invoice)); setNotice('Saved just now') },[invoice])
  useEffect(()=>{ const t=setTimeout(()=>setNotice('Autosaved locally'),1600); return ()=>clearTimeout(t) },[invoice])

  const update = <K extends keyof Invoice>(key:K,value:Invoice[K]) => setInvoice(v=>({...v,[key]:value}))
  const updateNested = (section:'business'|'client',key:string,value:string) => setInvoice(v=>({...v,[section]:{...v[section],[key]:value}}))
  const updateItem = (id:string,key:keyof Item,value:string|number) => setInvoice(v=>({...v,items:v.items.map(i=>i.id===id?{...i,[key]:value}:i)}))
  const addItem = () => setInvoice(v=>({...v,items:[...v.items,{id:uid(),description:'New service or product',quantity:1,rate:0,tax:0}]}))
  const removeItem = (id:string) => setInvoice(v=>({...v,items:v.items.filter(i=>i.id!==id)}))
  const duplicateItem = (id:string) => setInvoice(v=>{ const source=v.items.find(i=>i.id===id); return source?{...v,items:[...v.items,{...source,id:uid()}]}:v })
  const reset = () => { setInvoice(clone(initial)); setNotice('New invoice ready') }
  const saveDraft = () => { localStorage.setItem('invoice-maker-draft',JSON.stringify(invoice)); setNotice('Draft saved') }
  const loadDraft = () => { try { const raw=localStorage.getItem('invoice-maker-draft'); if(raw){setInvoice(JSON.parse(raw));setNotice('Draft restored')} } catch { setNotice('Could not restore draft') } }
  const exportJson = () => { const blob=new Blob([JSON.stringify(invoice,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${invoice.invoiceNo || 'invoice'}.json`; a.click(); URL.revokeObjectURL(a.href); setNotice('Invoice data exported') }
  const importJson = (e:ChangeEvent<HTMLInputElement>) => { const f=e.target.files?.[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{try{setInvoice(JSON.parse(String(r.result)));setNotice('Invoice imported')}catch{setNotice('Invalid invoice file')}}; r.readAsText(f); e.target.value='' }
  const uploadLogo = (e:ChangeEvent<HTMLInputElement>) => { const f=e.target.files?.[0]; if(!f)return; if(f.size>1024*1024){setNotice('Logo must be under 1 MB');return}; const r=new FileReader(); r.onload=()=>updateNested('business','logo',String(r.result)); r.readAsDataURL(f) }

  return <div className={`app density-${invoice.density}`}>
    <header className="topbar">
      <div className="brand"><span className="brand-mark">IM</span><div><strong>Invoice Maker</strong><small>Professional documents, locally.</small></div></div>
      <div className="top-actions"><span className="save-state"><i/> {notice}</span><button className="ghost" onClick={loadDraft}>Restore</button><button className="ghost" onClick={saveDraft}>Save draft</button><button className="primary" onClick={()=>window.print()}>Print / PDF</button><button className="icon-button" title="Start a new invoice" onClick={reset}>＋</button></div>
    </header>

    <main className="workspace">
      <section className="editor">
        <div className="intro"><div><p className="eyebrow">Invoice workspace</p><h1>Create an invoice that looks the part.</h1><p>Everything runs in your browser. Drafts stay on this device and nothing is sent to a server.</p></div><div className="status-pill"><span className={`status-dot ${invoice.status}`}/><select value={invoice.status} onChange={e=>update('status',e.target.value as Invoice['status'])}><option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Paid</option><option value="overdue">Overdue</option></select></div></div>

        <div className="tabs"><button className={activeTab==='details'?'active':''} onClick={()=>setActiveTab('details')}>01 Details</button><button className={activeTab==='items'?'active':''} onClick={()=>setActiveTab('items')}>02 Line items <b>{invoice.items.length}</b></button><button className={activeTab==='settings'?'active':''} onClick={()=>setActiveTab('settings')}>03 Styling & tools</button></div>

        {activeTab==='details' && <div className="form-stack">
          <div className="form-card"><div className="card-heading"><div><h2>Your business</h2><p>Shown at the top of the invoice.</p></div><label className="upload">{invoice.business.logo?'Replace logo':'Add logo'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadLogo}/></label></div><div className="grid two"><Field label="Business name" value={invoice.business.name} onChange={v=>updateNested('business','name',v)}/><Field label="Tax / registration ID" value={invoice.business.taxId} onChange={v=>updateNested('business','taxId',v)}/><Field label="Email" value={invoice.business.email} onChange={v=>updateNested('business','email',v)}/><Field label="Phone" value={invoice.business.phone} onChange={v=>updateNested('business','phone',v)}/><Field label="Website" value={invoice.business.website} onChange={v=>updateNested('business','website',v)}/><TextArea label="Address" value={invoice.business.address} onChange={v=>updateNested('business','address',v)}/></div></div>
          <div className="form-card"><div className="card-heading"><div><h2>Bill to</h2><p>Customer or company receiving the invoice.</p></div></div><div className="grid two"><Field label="Client / company" value={invoice.client.name} onChange={v=>updateNested('client','name',v)}/><Field label="Tax ID (optional)" value={invoice.client.taxId} onChange={v=>updateNested('client','taxId',v)}/><Field label="Email" value={invoice.client.email} onChange={v=>updateNested('client','email',v)}/><Field label="Phone" value={invoice.client.phone} onChange={v=>updateNested('client','phone',v)}/><TextArea label="Billing address" value={invoice.client.address} onChange={v=>updateNested('client','address',v)}/></div></div>
          <div className="form-card"><div className="card-heading"><div><h2>Invoice details</h2><p>Numbering, dates and settlement.</p></div></div><div className="grid three"><Field label="Invoice number" value={invoice.invoiceNo} onChange={v=>update('invoiceNo',v)}/><Field label="Issue date" type="date" value={invoice.issueDate} onChange={v=>update('issueDate',v)}/><Field label="Due date" type="date" value={invoice.dueDate} onChange={v=>update('dueDate',v)}/><Select label="Currency" value={invoice.currency} onChange={v=>update('currency',v)} options={Object.keys(currencySymbols)}/><Field label="Amount paid" type="number" value={invoice.amountPaid} onChange={v=>update('amountPaid',Number(v)||0)}/></div></div>
        </div>}

        {activeTab==='items' && <div className="form-stack"><div className="form-card items-card"><div className="card-heading"><div><h2>Products & services</h2><p>Quantity, unit rate and tax are calculated instantly.</p></div><button className="primary small" onClick={addItem}>＋ Add item</button></div><div className="item-head"><span>Description</span><span>Qty</span><span>Rate</span><span>Tax</span><span>Amount</span><span/></div>{invoice.items.map(item=><div className="item-row" key={item.id}><input value={item.description} onChange={e=>updateItem(item.id,'description',e.target.value)} /><input type="number" min="0" step="0.01" value={item.quantity} onChange={e=>updateItem(item.id,'quantity',Number(e.target.value)||0)}/><input type="number" min="0" step="0.01" value={item.rate} onChange={e=>updateItem(item.id,'rate',Number(e.target.value)||0)}/><div className="suffix"><input type="number" min="0" max="100" step="0.01" value={item.tax} onChange={e=>updateItem(item.id,'tax',Number(e.target.value)||0)}/><em>%</em></div><strong>{money(item.quantity*item.rate,invoice.currency)}</strong><div className="row-actions"><button title="Duplicate" onClick={()=>duplicateItem(item.id)}>⧉</button><button title="Remove" onClick={()=>removeItem(item.id)}>×</button></div></div>)}<div className="item-footer"><button className="text-button" onClick={addItem}>＋ Add another line</button><div className="summary-mini"><span>Subtotal <b>{money(calc.subtotal,invoice.currency)}</b></span><span>Tax <b>{money(calc.tax,invoice.currency)}</b></span></div></div></div>
          <div className="form-card"><div className="card-heading"><div><h2>Adjustments</h2><p>Discounts and delivery costs are applied to the final total.</p></div></div><div className="grid three"><div className="field"><label>Discount</label><div className="split"><input type="number" min="0" step="0.01" value={invoice.discount} onChange={e=>update('discount',Number(e.target.value)||0)}/><select value={invoice.discountType} onChange={e=>update('discountType',e.target.value as Invoice['discountType'])}><option value="percent">%</option><option value="fixed">Fixed</option></select></div></div><Field label="Shipping / fees" type="number" value={invoice.shipping} onChange={v=>update('shipping',Number(v)||0)}/></div></div></div>}

        {activeTab==='settings' && <div className="form-stack"><div className="form-card"><div className="card-heading"><div><h2>Appearance</h2><p>Control the personality and density of the printed document.</p></div></div><div className="theme-grid"><Theme value="modern" current={invoice.template} title="Modern" text="Bold header, spacious hierarchy." onClick={()=>update('template','modern')}/><Theme value="classic" current={invoice.template} title="Classic" text="Traditional business invoice." onClick={()=>update('template','classic')}/><Theme value="minimal" current={invoice.template} title="Minimal" text="Quiet, editorial and compact." onClick={()=>update('template','minimal')}/></div><div className="settings-line"><label>Accent color <input type="color" value={invoice.accent} onChange={e=>update('accent',e.target.value)}/></label><label>Print density <select value={invoice.density} onChange={e=>update('density',e.target.value as Invoice['density'])}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label></div></div>
          <div className="form-card"><div className="card-heading"><div><h2>Customer-facing copy</h2><p>Add payment instructions, notes and legal terms.</p></div></div><div className="grid one"><TextArea label="Payment instructions" value={invoice.payment} onChange={v=>update('payment',v)}/><TextArea label="Notes" value={invoice.notes} onChange={v=>update('notes',v)}/><TextArea label="Terms & conditions" value={invoice.terms} onChange={v=>update('terms',v)}/></div></div>
          <div className="form-card tools-card"><div><h2>Data portability</h2><p>Move an invoice between devices without a database or account.</p></div><div className="tool-buttons"><button className="ghost" onClick={exportJson}>Export JSON</button><button className="ghost" onClick={()=>fileRef.current?.click()}>Import JSON</button><input ref={fileRef} hidden type="file" accept="application/json" onChange={importJson}/><button className="danger" onClick={reset}>Reset invoice</button></div></div></div>}

        <div className="editor-footer"><div><strong>{money(calc.total,invoice.currency)}</strong><span>Total invoice</span></div><div className="balance"><span>Balance due</span><strong>{money(calc.balance,invoice.currency)}</strong></div><button className="primary" onClick={()=>window.print()}>Print / Save as PDF →</button></div>
      </section>

      <aside className="preview-panel"><div className="preview-bar"><div><span className="live-dot"/> LIVE PREVIEW</div><span>A4 · {invoice.currency}</span></div><div className="paper-wrap"><InvoicePaper invoice={invoice} calc={calc}/></div><div className="preview-help">Tip: choose <b>Print / PDF</b> and select “Save as PDF” in your browser’s print dialog.</div></aside>
    </main>
  </div>
}

function Field({label,value,onChange,type='text'}:{label:string;value:string|number;onChange:(v:string)=>void;type?:string}) { return <div className="field"><label>{label}</label><input type={type} value={value} onChange={e=>onChange(e.target.value)}/></div> }
function TextArea({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}) { return <div className="field full"><label>{label}</label><textarea value={value} onChange={e=>onChange(e.target.value)} rows={3}/></div> }
function Select({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:string[]}) { return <div className="field"><label>{label}</label><select value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select></div> }
function Theme({value,current,title,text,onClick}:{value:Invoice['template'];current:Invoice['template'];title:string;text:string;onClick:()=>void}) { return <button className={`theme-card ${current===value?'selected':''}`} onClick={onClick}><span className={`theme-sample ${value}`}><i/><i/><i/></span><strong>{title}</strong><small>{text}</small></button> }

function InvoicePaper({invoice,calc}:{invoice:Invoice;calc:{subtotal:number;discount:number;tax:number;total:number;balance:number}}) {
  const symbol = currencySymbols[invoice.currency] ?? invoice.currency
  return <article className={`invoice-paper template-${invoice.template}`} style={{'--accent':invoice.accent} as React.CSSProperties}>
    <div className="paper-top"><div className="paper-brand">{invoice.business.logo && <img src={invoice.business.logo} alt="Business logo"/>}<div><h2>{invoice.business.name || 'Your business'}</h2><p>{invoice.business.website}</p></div></div><div className="invoice-title"><span>INVOICE</span><strong>{invoice.invoiceNo}</strong><em className={invoice.status}>{invoice.status}</em></div></div>
    <div className="paper-meta"><div><small>FROM</small><p>{invoice.business.address}<br/>{invoice.business.email}<br/>{invoice.business.phone}{invoice.business.taxId && <><br/>Tax ID: {invoice.business.taxId}</>}</p></div><div><small>BILL TO</small><p><b>{invoice.client.name}</b><br/>{invoice.client.address}<br/>{invoice.client.email}<br/>{invoice.client.phone}{invoice.client.taxId && <><br/>Tax ID: {invoice.client.taxId}</>}</p></div><div className="dates"><span>ISSUED <b>{pretty(invoice.issueDate)}</b></span><span>DUE <b>{pretty(invoice.dueDate)}</b></span><span>AMOUNT DUE <b className="due">{money(calc.balance,invoice.currency)}</b></span></div></div>
    <table><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Tax</th><th>Amount</th></tr></thead><tbody>{invoice.items.map(i=><tr key={i.id}><td>{i.description}</td><td>{fmt(i.quantity)}</td><td>{money(i.rate,invoice.currency)}</td><td>{fmt(i.tax)}%</td><td>{money(i.quantity*i.rate,invoice.currency)}</td></tr>)}</tbody></table>
    <div className="paper-lower"><div className="paper-copy"><div><small>PAYMENT</small><p>{invoice.payment}</p></div><div><small>NOTES</small><p>{invoice.notes}</p></div><div><small>TERMS</small><p>{invoice.terms}</p></div></div><div className="totals"><span>Subtotal <b>{money(calc.subtotal,invoice.currency)}</b></span>{calc.discount>0&&<span>Discount <b>− {money(calc.discount,invoice.currency)}</b></span>}<span>Tax <b>{money(calc.tax,invoice.currency)}</b></span>{invoice.shipping>0&&<span>Shipping <b>{money(invoice.shipping,invoice.currency)}</b></span>}<strong>Total <b>{money(calc.total,invoice.currency)}</b></strong><div className="balance-line"><span>Balance due</span><b>{symbol} {calc.balance.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</b></div></div></div>
    <footer><span>{invoice.business.name}</span><span>{invoice.invoiceNo} · Thank you</span></footer>
  </article>
}
const fmt=(n:number)=>n.toLocaleString(undefined,{maximumFractionDigits:2})
const pretty=(s:string)=>{if(!s)return '—'; const d=new Date(`${s}T00:00:00`); return d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}
