const badgeBase = { padding: "3px 7px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "700" };

const badges = {
    ok: { ...badgeBase, background: "#dcfce7", color: "#15803d" },
    shortage: { ...badgeBase, background: "#fef3c7", color: "#b45309" },
    neg: { ...badgeBase, background: "#fee2e2", color: "#b91c1c" },
    prod_planned: { ...badgeBase, background: "#e0f2fe", color: "#0284c7" },
    completed: { ...badgeBase, background: "#e5e7eb", color: "#4b5563" },
    kce_scheduled: { ...badgeBase, background: "#ede9fe", color: "#6d28d9" },
    default: { ...badgeBase, background: "#f1f5f9", color: "#475569" },
};

const labels = {
    ok: "이상없음", shortage: "재고부족", neg: "마이너스",
    prod_planned: "생산예정", completed: "선발행", kce_scheduled: "KCE입고예정",
    default: "미등록",
};

export function renderStatusBadge(status) {
    if (status === "skip") return <span style={{ color: "#cbd5e1", fontSize: "0.7rem" }}>-</span>;
    const style = badges[status] || badges.default;
    const label = labels[status] || labels.default;
    return <span style={style}>{label}</span>;
}
