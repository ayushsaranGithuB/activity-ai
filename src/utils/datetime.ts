export function toLocalInput(iso?: string) {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export function fromLocalInput(local?: string) {
    if (!local) return undefined;
    const d = new Date(local);
    return d.toISOString();
}

export default { toLocalInput, fromLocalInput };
