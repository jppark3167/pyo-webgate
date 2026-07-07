// shared.jsx: 출하 업무(HelperView) 하위 화면들이 공용으로 쓰는 컴포넌트
export function Empty({ text }) {
    return <div style={{ background: "#fff", borderRadius: 12, padding: "40px 24px", textAlign: "center", color: "#94a3b8", fontSize: 14, boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>{text}</div>;
}
