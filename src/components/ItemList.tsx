import React, { useMemo, useState } from 'react';
import { Item } from '../types/Item';
import '../styles/ItemList.css';

interface ItemListProps {
    items: Item[];
    onDelete?: (id: string) => void;
    onUpdate?: (id: string, patch: Partial<Item>) => Promise<void> | void; // NEW
}

type EditState = {
    description: string;
    price: string; // храню как строку в инпуте
    currency: Item['currency'];
    images: string[];
};

const ItemList: React.FC<ItemListProps> = ({ items, onDelete, onUpdate }) => {
    const [query, setQuery] = useState('');
    const [openId, setOpenId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null); // NEW
    const [edit, setEdit] = useState<EditState | null>(null);        // NEW
    const [saving, setSaving] = useState(false);                     // NEW

    const filtered = useMemo(() => {
        const q = String(query ?? '').trim().toLowerCase();
        if (!q) return items;
        const contains = (v?: string | number | null) => String(v ?? '').toLowerCase().includes(q);
        return items.filter(
            (it) =>
                contains(it.name) ||
                contains(it.quantity) ||
                contains(it.sold) ||
                contains(it.description) ||
                contains(it.price)
        );
    }, [items, query]);

    const toggle = (id: string) => {
        const next = openId === id ? null : id;
        setOpenId(next);
        // если закрываем карточку — выходим из редактирования
        if (next !== id && editingId === id) {
            setEditingId(null);
            setEdit(null);
        }
    };

    // --- helpers for edit mode ---
    const startEdit = (item: Item) => {
        setEditingId(item.id);
        setEdit({
            description: item.description ?? '',
            price: typeof item.price === 'number' ? String(item.price) : '',
            currency: item.currency ?? 'EUR',
            images: item.images ? [...item.images] : [],
        });
        if (openId !== item.id) setOpenId(item.id);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEdit(null);
    };

    const handleFiles = async (files: FileList | null) => {
        if (!edit || !files || files.length === 0) return;
        const max = 5 - edit.images.length;
        if (max <= 0) return;
        const slice = Array.from(files).slice(0, Math.max(0, max));
        const toBase64 = (file: File) =>
            new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        const list = await Promise.all(slice.map((f) => toBase64(f)));
        setEdit({ ...edit, images: [...edit.images, ...list].slice(0, 5) });
    };

    const removeImage = (idx: number) => {
        if (!edit) return;
        setEdit({ ...edit, images: edit.images.filter((_, i) => i !== idx) });
    };

    const makeCover = (idx: number) => {
        if (!edit || idx === 0) return;
        const next = [...edit.images];
        const [picked] = next.splice(idx, 1);
        next.unshift(picked);
        setEdit({ ...edit, images: next });
    };

    const saveEdit = async (item: Item) => {
        if (!onUpdate || !edit) return;
        const priceNum = edit.price.trim() ? Number(edit.price) : undefined;
        if (edit.price.trim() && (isNaN(priceNum!) || priceNum! < 0)) {
            alert('Price must be a non-negative number');
            return;
        }
        const patch: Partial<Item> = {
            description: edit.description.trim() || undefined,
            price: priceNum,
            currency: priceNum !== undefined ? edit.currency : undefined,
            images: edit.images.length ? edit.images : undefined,
        };
        try {
            setSaving(true);
            await onUpdate(item.id, patch);
            setEditingId(null);
            setEdit(null);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="item-list">
            <h3 className="item-list-title">Stock</h3>

            <div className="item-search">
                <input
                    className="item-search-input"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, available amount, sold, price, or description"
                />
                <span className="item-search-count">{filtered.length} / {items.length}</span>
            </div>

            {filtered.length === 0 ? (
                <p className="empty-message">No items match your search.</p>
            ) : (
                <ul className="item-list-ul">
                    {filtered.map((item) => {
                        const isOpen = openId === item.id;
                        const isEditing = editingId === item.id;
                        const avatar = (isEditing ? edit?.images?.[0] : item.images?.[0]) as string | undefined;

                        return (
                            <li
                                key={item.id}
                                className={`item-list-item fade-in ${item.quantity <= 0 ? 'item-low-stock' : 'item-green-stock'}`}
                            >
                                <button className="row" onClick={() => toggle(item.id)} aria-expanded={isOpen}>
                                    <div className="avatar">
                                        {avatar ? <img src={avatar} alt={`${item.name} cover`} /> : <div className="avatar-placeholder" />}
                                    </div>

                                    <div className="item-details">
                                        <span className="item-name">{item.name}</span>
                                        <span className="item-quantity">Available: {item.quantity}</span>
                                        <span className="item-sold">Sold: {item.sold}</span>
                                        {(!isEditing && typeof item.price === 'number' && item.currency) && (
                                            <span className="item-price">Price: {item.price.toFixed(2)} {item.currency}</span>
                                        )}
                                    </div>

                                    <div className={`chevron ${isOpen ? 'up' : ''}`} aria-hidden />
                                </button>

                                {/* COLLAPSE */}
                                <div className={`collapse ${isOpen ? 'open' : ''}`}>
                                    {/* режим ПРОСМОТРА */}
                                    {!isEditing && (
                                        (item.description || (item.images && item.images.length > 1) || typeof onDelete === 'function' || typeof onUpdate === 'function') ? (
                                            <div className="collapse-inner">
                                                {item.description && <div className="desc">{item.description}</div>}
                                                {item.images && item.images.length > 1 && (
                                                    <div className="gallery">
                                                        {item.images.slice(1).map((src, i) => (
                                                            <img key={i} src={src} alt={`${item.name} ${i + 2}`} />
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="actions-row actions-row-wrap">
                                                    {onUpdate && (
                                                        <button type="button" className="btn-edit" onClick={() => startEdit(item)}>
                                                            Edit
                                                        </button>
                                                    )}
                                                    {onDelete && (
                                                        <button
                                                            type="button"
                                                            className="btn-delete"
                                                            onClick={() => onDelete(item.id)}
                                                        >
                                                            Delete item
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="collapse-inner empty">
                                                No extra info.
                                                {onUpdate && (
                                                    <div className="actions-row">
                                                        <button type="button" className="btn-edit" onClick={() => startEdit(item)}>
                                                            Edit
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    )}

                                    {/* режим РЕДАКТИРОВАНИЯ */}
                                    {isEditing && edit && (
                                        <div className="collapse-inner">
                                            {/* Описание */}
                                            <label className="lbl">Description</label>
                                            <textarea
                                                className="inp textarea"
                                                rows={3}
                                                value={edit.description}
                                                onChange={(e) => setEdit({ ...edit, description: e.target.value })}
                                                placeholder="Short item description…"
                                            />

                                            {/* Цена + валюта */}
                                            <div className="row2">
                                                <div className="col">
                                                    <label className="lbl">Price</label>
                                                    <input
                                                        className="inp"
                                                        type="number"
                                                        min={0}
                                                        step="0.01"
                                                        value={edit.price}
                                                        onChange={(e) => setEdit({ ...edit, price: e.target.value })}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <div className="col">
                                                    <label className="lbl">Currency</label>
                                                    <select
                                                        className="inp"
                                                        value={edit.currency ?? 'EUR'}
                                                        onChange={(e) => setEdit({ ...edit, currency: e.target.value as Item['currency'] })}
                                                        disabled={!edit.price.trim()}
                                                    >
                                                        <option value="EUR">EUR</option>
                                                        <option value="USD">USD</option>
                                                        <option value="PLN">PLN</option>
                                                        <option value="UAH">UAH</option>
                                                        <option value="GBP">GBP</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Картинки */}
                                            <label className="lbl">Images (up to 5)</label>
                                            <input
                                                className="inp"
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={(e) => handleFiles(e.target.files)}
                                            />
                                            {edit.images.length > 0 && (
                                                <div className="image-previews">
                                                    {edit.images.map((src, idx) => (
                                                        <div key={idx} className={`image-thumb ${idx === 0 ? 'cover' : ''}`}>
                                                            <img src={src} alt={`img-${idx}`} />
                                                            <div className="thumb-actions">
                                                                {idx !== 0 && (
                                                                    <button type="button" className="btn-mini" onClick={() => makeCover(idx)}>Set as cover</button>
                                                                )}
                                                                <button type="button" className="btn-mini danger" onClick={() => removeImage(idx)}>Remove</button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Кнопки */}
                                            <div className="actions-row actions-row-wrap">
                                                <button type="button" className="btn-cancel" onClick={cancelEdit} disabled={saving}>
                                                    Cancel
                                                </button>
                                                <button type="button" className="btn-save" onClick={() => saveEdit(item)} disabled={saving}>
                                                    {saving ? 'Saving…' : 'Save'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default ItemList;
