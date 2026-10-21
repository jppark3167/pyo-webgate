import { Fragment, useState } from "react";
import { tdStyle, tbodyTrStyle } from "./styles";
import { classifyKce } from '../kce.js';
import { fmtD, toDateStr } from '../utils.js';

export function KceSummary({ item, today = toDateStr(new Date()) }) {
    const r = classifyKce(item, today);
    const badge = (text, color, bg) => <span style={{ color, background: bg, borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap', fontSize: 11, fontWeight: 700 }}>{text}</span>;
    return <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
        {r.arrivals.length > 0 && badge(`${fmtD(r.arrivals[0].date)} 예정 ${r.arrivals.reduce((s, a) => s + a.qty, 0)}개`, '#1e40af', '#dbeafe')}
        {r.delayed > 0 && badge(`지연 ${r.delayed}개`, '#b91c1c', '#fee2e2')}
        {r.undated > 0 && badge(`미정 ${r.undated}개`, '#b45309', '#fef3c7')}
    </span>;
}

function ScheduleDetail({ item, today }) {
    const result = classifyKce(item, today);
    return <div style={{ lineHeight: 1.7, fontSize: 12, padding: '8px 0 2px' }}>
        <div style={{ color: '#475569' }}>발주 {item.발주수량}개 · 미입고 {item.미입고수}개 · 발주일 {item.발주일 || '-'} · 담당 {item.담당자 || '-'}</div>
        {result.arrivals.map((s, i) => <div key={i} style={{ color: '#1d4ed8' }}>{fmtD(s.date)} 입고예정 {s.qty}개</div>)}
        {result.delayed > 0 && <div style={{ color: '#b91c1c' }}>입고 지연 {result.delayed}개 · 예상재고 제외</div>}
        {result.undated > 0 && <div style={{ color: '#92400e' }}>일정 미정 {result.undated}개 · 예상재고 제외</div>}
        <div style={{ color: '#64748b' }}>원본 입고예정일: {item.입고예정일 || '미기재'}</div>
        {item.비고 && <div style={{ color: '#64748b', overflowWrap: 'anywhere' }}>메모: {item.비고}</div>}
    </div>;
}

export function KceSchedule({ item, today = toDateStr(new Date()) }) {
    return <details><summary style={{ cursor: 'pointer', padding: '2px 0' }} aria-label={`${item.품번} 입고 상세`}><KceSummary item={item} today={today} /></summary><ScheduleDetail item={item} today={today} /></details>;
}

export function KceCompactItem({ item, today = toDateStr(new Date()) }) {
    return <details style={{ borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
        <summary style={{ cursor: 'pointer', padding: '10px 12px', fontSize: 12, lineHeight: 1.5 }}>
            <span style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 10px', maxWidth: '95%', verticalAlign: 'middle' }}>
                <strong style={{ overflowWrap: 'anywhere', color: '#1e3a5f' }}>{item.품번}</strong>
                <span style={{ color: '#64748b', whiteSpace: 'nowrap' }}>잔량 {Number(item.미입고수).toLocaleString()}개</span>
                <KceSummary item={item} today={today} />
            </span>
        </summary>
        <div style={{ padding: '0 16px 10px 28px', background: '#f8fafc' }}><ScheduleDetail item={item} today={today} /></div>
    </details>;
}

export function KceTableRow({ item, today = toDateStr(new Date()) }) {
    const [open, setOpen] = useState(false);
    return <Fragment>
        <tr style={{ ...tbodyTrStyle, background: open ? '#f8fafc' : '#fff' }}>
            <td style={{ ...tdStyle, textAlign: 'left' }}>
                <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
                    style={{ border: 0, background: 'none', color: '#1e3a5f', cursor: 'pointer', padding: '2px 0', font: 'inherit', fontWeight: 600, textAlign: 'left', width: '100%', overflowWrap: 'anywhere' }}>
                    <span aria-hidden="true" style={{ color: '#64748b', marginRight: 6 }}>{open ? '▾' : '▸'}</span>{item.품번}
                </button>
            </td>
            <td style={{ ...tdStyle, fontWeight: 700 }}>{Number(item.미입고수).toLocaleString()}</td>
            <td style={{ ...tdStyle, textAlign: 'left' }}><KceSummary item={item} today={today} /></td>
            <td style={{ ...tdStyle, color: '#64748b' }}>{item.담당자 || '-'}</td>
        </tr>
        {open && <tr style={tbodyTrStyle}><td colSpan={4} style={{ background: '#f8fafc', padding: '4px 16px 12px 24px', textAlign: 'left' }}><ScheduleDetail item={item} today={today} /></td></tr>}
    </Fragment>;
}
