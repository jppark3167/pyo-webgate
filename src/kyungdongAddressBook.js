import { CFB } from "xlsx/xlsx.mjs";

export const MAX_SHIPMENTS = 10;
const DEFAULT_UNIT_PRICE = "200";
const SHEET_PATH = "/xl/worksheets/sheet1.xml";
const COMMON_COLUMNS = ["C", "D", "E", "F", "N"];
const XML_ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };

function cellPattern(address) {
    return new RegExp(`(<c r="${address}"[^>]*?)(?:\\s*/>|>([\\s\\S]*?)</c>)`);
}

function replaceCell(sheet, address, contents, type) {
    const pattern = cellPattern(address);
    if (!pattern.test(sheet)) throw new Error("경동화물 엑셀 양식의 열을 찾을 수 없습니다.");
    return sheet.replace(pattern, (_, opening) => {
        const attributes = opening.replace(/ t="[^"]*"/, "");
        return contents ? `${attributes}${type ? ` t="${type}"` : ""}>${contents}</c>` : `${attributes}/>`;
    });
}

function textCell(value) {
    // XML 1.0 excludes these control characters from cell text.
    // eslint-disable-next-line no-control-regex
    const escaped = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, "")
        .replace(/_x[\da-f]{4}_/gi, match => `_x005F_${match.slice(1)}`)
        .replace(/[&<>]/g, character => XML_ENTITIES[character]);
    return escaped ? `<is><t xml:space="preserve">${escaped}</t></is>` : "";
}

function writePart(part, text) {
    part.content = new TextEncoder().encode(text);
    part.size = part.content.length;
}

export function createKyungdongAddressBook(templateBytes, shipments, date) {
    if (!shipments.length || shipments.length > MAX_SHIPMENTS) {
        throw new Error(`발송 내역은 1건부터 ${MAX_SHIPMENTS}건까지 작성할 수 있습니다.`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error("발송 날짜 형식을 확인해 주세요.");
    }
    const archive = CFB.read(templateBytes, { type: "array" });
    const worksheet = CFB.find(archive, SHEET_PATH);
    const workbook = CFB.find(archive, "/xl/workbook.xml");
    const properties = CFB.find(archive, "/docProps/app.xml");
    if (!worksheet || !workbook || !properties) throw new Error("경동화물 엑셀 양식을 읽을 수 없습니다.");
    const decoder = new TextDecoder();

    // The template carries the Excel styles and printer settings.
    let sheet = decoder.decode(worksheet.content);
    const common = COMMON_COLUMNS.map(column => {
        const value = sheet.match(cellPattern(`${column}2`))?.[2];
        if (!value) throw new Error("경동화물 엑셀 양식의 발송인 정보를 읽을 수 없습니다.");
        return [column, value];
    });
    for (const [index, shipment] of shipments.entries()) {
        const { branch = "", recipient = "", phone = "", item = "", quantity, method, address = "", addressDetail = "" } = shipment;
        const row = index + 2;
        const count = Number(quantity);
        if (!["택배", "화물"].includes(method) || ![recipient, phone, item].every(value => value.trim())
            || !(method === "택배" ? address : branch).trim() || !Number.isSafeInteger(count) || count < 1) {
            throw new Error(`${index + 1}번째 발송 건의 입력 항목을 확인해 주세요.`);
        }

        const fields = {
            B: method === "화물" ? branch : "", G: recipient, H: phone,
            L: item.replace(/\r\n?/g, "\n"), O: DEFAULT_UNIT_PRICE, P: method,
            J: method === "택배" ? address : "",
            K: method === "택배" ? addressDetail : "",
        };
        for (const [column, value] of Object.entries(fields)) {
            sheet = replaceCell(sheet, `${column}${row}`, textCell(value.trim()), "inlineStr");
        }
        for (const [column, value] of common) {
            sheet = replaceCell(sheet, `${column}${row}`, value, "inlineStr");
        }
        sheet = replaceCell(sheet, `M${row}`, `<v>${count}</v>`);
        const itemHeight = Math.min(409.5, fields.L.trim().split("\n").length * 15 + 4);
        sheet = sheet.replace(new RegExp(`(<row r="${row}"[^>]*?\\sht=")([\\d.]+)"`),
            (_, prefix, height) => `${prefix}${Math.max(Number(height), itemHeight)}"`);
    }

    writePart(worksheet, sheet);
    writePart(workbook, decoder.decode(workbook.content).replace(/(<sheet\s+name=")[^"]+/, (_, prefix) => prefix + date));
    writePart(properties, decoder.decode(properties.content).replace(
        /(<TitlesOfParts>\s*<vt:vector[^>]*>\s*<vt:lpstr>)[^<]+/,
        (_, prefix) => prefix + date,
    ));
    return CFB.write(archive, { fileType: "zip", type: "array", compression: true });
}
