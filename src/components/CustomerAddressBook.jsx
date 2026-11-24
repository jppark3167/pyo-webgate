import { useEffect, useState } from "react";
import { api } from "../api";
import "./CustomerAddressBook.css";

const fields = [
    ["name", "거래처명", 200, "text"],
    ["address", "주소", 500, "text"],
    ["contactName", "담당자명", 100, "text"],
    ["contact", "연락처", 100, "tel"],
    ["phone", "전화번호", 100, "tel"],
    ["email", "이메일", 254, "email"],
    ["notes", "메모", 2000],
];
const emptyDraft = Object.fromEntries(fields.map(([key]) => [key, ""]));

export function CustomerAddressBook({ onUnauthorized }) {
    const [customers, setCustomers] = useState(null);
    const [loadError, setLoadError] = useState("");
    const [loadAttempt, setLoadAttempt] = useState(0);
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [draft, setDraft] = useState(emptyDraft);
    const [pending, setPending] = useState(false);
    const [feedback, setFeedback] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        api.getCustomers(controller.signal).then(items => {
            if (!controller.signal.aborted) setCustomers(items);
        }).catch(error => {
            if (controller.signal.aborted) return;
            if (error.message === "UNAUTHORIZED") onUnauthorized();
            else setLoadError("거래처 목록을 불러오지 못했습니다.");
        });
        return () => controller.abort();
    }, [loadAttempt, onUnauthorized]);

    useEffect(() => {
        if (!query.trim()) return;
        const controller = new AbortController();
        const timer = setTimeout(() => {
            api.suggestCustomerNames(query.trim(), controller.signal).then(names => {
                if (!controller.signal.aborted) setSuggestions(names);
            }).catch(error => {
                if (!controller.signal.aborted && error.message === "UNAUTHORIZED") onUnauthorized();
            });
        }, 200);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query, customers, onUnauthorized]);

    function resetForm() {
        setEditingId(null);
        setDraft(emptyDraft);
    }

    function editCustomer(customer) {
        setEditingId(customer._id);
        setDraft(Object.fromEntries(fields.map(([key]) => [key, customer[key] ?? ""])));
        setFeedback(null);
        document.getElementById("customer-name")?.focus();
    }

    async function saveCustomer(event) {
        event.preventDefault();
        if (pending) return;
        if (!draft.name.trim()) {
            setFeedback({ error: true, text: "거래처명을 입력해 주세요." });
            return;
        }

        setPending(true);
        setFeedback(null);
        try {
            const saved = editingId
                ? await api.updateCustomer(editingId, draft)
                : await api.createCustomer(draft);
            setCustomers(current => [...current.filter(customer => customer._id !== saved._id), saved]);
            setSuggestions([]);
            setQuery("");
            resetForm();
            setFeedback({ text: editingId ? "거래처를 수정했습니다." : "거래처를 추가했습니다." });
        } catch (error) {
            if (error.message === "UNAUTHORIZED") onUnauthorized();
            else setFeedback({ error: true, text: "거래처를 저장하지 못했습니다. 입력값과 목록을 확인해 주세요." });
        } finally {
            setPending(false);
        }
    }

    async function deleteCustomer(customer) {
        if (pending || !window.confirm(`“${customer.name}” 거래처를 삭제할까요?`)) return;

        setPending(true);
        setFeedback(null);
        try {
            await api.deleteCustomer(customer._id);
            setCustomers(current => current.filter(item => item._id !== customer._id));
            setSuggestions([]);
            if (editingId === customer._id) resetForm();
            setFeedback({ text: "거래처를 삭제했습니다." });
        } catch (error) {
            if (error.message === "UNAUTHORIZED") onUnauthorized();
            else setFeedback({ error: true, text: "거래처를 삭제하지 못했습니다. 목록을 확인해 주세요." });
        } finally {
            setPending(false);
        }
    }

    const search = query.trim().toLowerCase();
    const visible = customers?.filter(customer => customer.name.toLowerCase().includes(search))
        .sort((a, b) => a.name.localeCompare(b.name, "ko"));

    return (
        <main className="customers">
            <h1>거래처 주소록</h1>

            {!customers && (
                loadError ? (
                    <div className="customer-panel">
                        <p role="alert">{loadError}</p>
                        <button type="button" onClick={() => {
                            setLoadError("");
                            setLoadAttempt(attempt => attempt + 1);
                        }}>다시 시도</button>
                    </div>
                ) : <p role="status">거래처 목록을 불러오는 중입니다.</p>
            )}

            {customers && (
                <>
                    <form className="customer-panel" onSubmit={saveCustomer}>
                        <h2>{editingId ? "거래처 수정" : "거래처 추가"}</h2>
                        <fieldset disabled={pending}>
                            {fields.map(([key, label, maxLength, type]) => {
                                const props = {
                                    id: `customer-${key}`,
                                    value: draft[key],
                                    maxLength,
                                    onChange: event => setDraft(current => ({ ...current, [key]: event.target.value })),
                                };
                                return (
                                    <label key={key}>
                                        {label}{key === "name" && " (필수)"}
                                        {type ? <input {...props} type={type} required={key === "name"} />
                                            : <textarea {...props} rows={3} />}
                                    </label>
                                );
                            })}
                        </fieldset>
                        <div className="customer-actions">
                            <button className="customer-primary" disabled={pending}>
                                {editingId ? "수정 저장" : "추가"}
                            </button>
                            {editingId && <button type="button" disabled={pending} onClick={() => {
                                resetForm();
                                setFeedback(null);
                            }}>취소</button>}
                        </div>
                    </form>

                    {feedback && <p role={feedback.error ? "alert" : "status"}>{feedback.text}</p>}

                    <section className="customer-panel">
                        <h2>거래처 목록</h2>
                        <label className="customer-search">
                            거래처명 검색
                            <input
                                type="search"
                                list="customer-name-suggestions"
                                maxLength={200}
                                value={query}
                                onChange={event => {
                                    setSuggestions([]);
                                    setQuery(event.target.value);
                                }}
                            />
                            <datalist id="customer-name-suggestions">
                                {suggestions.map(name => <option key={name} value={name} />)}
                            </datalist>
                        </label>
                        {visible.length ? (
                            <ul className="customer-list">
                                {visible.map(customer => (
                                    <li key={customer._id}>
                                        <h3>{customer.name}</h3>
                                        <dl>
                                            {fields.slice(1).filter(([key]) => customer[key]).map(([key, label]) => (
                                                <div key={key}><dt>{label}</dt><dd>{customer[key]}</dd></div>
                                            ))}
                                        </dl>
                                        <div className="customer-actions">
                                            <button type="button" disabled={pending} onClick={() => editCustomer(customer)}>수정</button>
                                            <button type="button" disabled={pending} onClick={() => deleteCustomer(customer)}>삭제</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : <p>{search ? "검색 결과가 없습니다." : "등록된 거래처가 없습니다."}</p>}
                    </section>
                </>
            )}
        </main>
    );
}
