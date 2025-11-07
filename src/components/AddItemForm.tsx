import { useState, useRef } from 'react';
import { Item } from '../types/Item';
import '../styles/AddItemForm.css';
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

interface AddItemFormProps {
    onAdd: (item: Item) => void;
}

function AddItemForm({ onAdd }: AddItemFormProps) {
    const [id, setId] = useState('');
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [description, setDescription] = useState('');     // NEW
    const [price, setPrice] = useState('');                 // NEW
    const [currency, setCurrency] = useState<'EUR' | 'USD' | 'PLN' | 'UAH' | 'GBP'>('EUR'); // NEW
    const [images, setImages] = useState<string[]>([]);     // NEW base64
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const max = 5 - images.length;
        const slice = Array.from(files).slice(0, Math.max(0, max));

        const toBase64 = (file: File) =>
            new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = reject;
                reader.readAsDataURL(file); // никакого URL — инлайн base64
            });

        try {
            const list = await Promise.all(slice.map(f => toBase64(f)));
            const next = [...images, ...list].slice(0, 5);
            setImages(next);
        } catch {
            toast.error('Failed to read image(s).');
        }
    };

    const removeImage = (idx: number) => {
        setImages(prev => prev.filter((_, i) => i !== idx));
    };

    const makeCover = (idx: number) => {
        setImages(prev => {
            if (idx === 0) return prev;
            const next = [...prev];
            const [picked] = next.splice(idx, 1);
            next.unshift(picked); // первая — аватарка
            return next;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const quantityNum = parseInt(quantity, 10);

        if (!id.trim()) { toast.error('ID must not be empty.'); return; }
        if (!name.trim()) { toast.error('Name cannot be empty.'); return; }
        if (isNaN(quantityNum) || quantityNum <= 0) {
            toast.error('The quantity must be a positive number.'); return;
        }

        const priceNum = price.trim() ? Number(price) : undefined;
        if (price.trim() && (isNaN(Number(price)) || Number(price) < 0)) {
            toast.error('Price must be a non-negative number.'); return;
        }

        const item: Item = {
            id: id.trim(),
            name: name.trim(),
            quantity: quantityNum,
            sold: 0,
            description: description.trim() || undefined,
            price: priceNum,
            currency: priceNum !== undefined ? currency : undefined,
            images: images.length ? images : undefined
        };

        onAdd(item);

        // reset
        setId(''); setName(''); setQuantity('');
        setDescription(''); setPrice(''); setCurrency('EUR'); setImages([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        toast.success('Item successfully added!');
    };

    return (
        <form className="add-item-form" onSubmit={handleSubmit}>
            <h2 className="add-item-title">Add new item</h2>

            <div className="form-group">
                <label htmlFor="id">Name QR</label>
                <input
                    type="text"
                    id="id"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    required
                    placeholder="Name QR"
                />
            </div>

            <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Item name"
                />
            </div>

            <div className="form-group">
                <label htmlFor="quantity">Amount</label>
                <input
                    type="number"
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    placeholder="Enter amount"
                    min="0"
                />
            </div>

            {/* NEW: price + currency (необязательные) */}
            <div className="form-row-two">
                <div className="form-group">
                    <label htmlFor="price">Price (optional)</label>
                    <input
                        type="number"
                        id="price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="currency">Currency</label>
                    <select
                        id="currency"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as any)}
                        disabled={!price.trim()}
                    >
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                        <option value="PLN">PLN</option>
                        <option value="UAH">UAH</option>
                        <option value="GBP">GBP</option>
                    </select>
                </div>
            </div>

            {/* NEW: optional description */}
            <div className="form-group">
                <label htmlFor="description">Description (optional)</label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short item description…"
                    rows={3}
                />
            </div>

            {/* NEW: images uploader */}
            <div className="form-group">
                <label>Images (up to 5)</label>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFiles(e.target.files)}
                />
                {images.length > 0 && (
                    <div className="image-previews">
                        {images.map((src, idx) => (
                            <div key={idx} className={`image-thumb ${idx === 0 ? 'cover' : ''}`}>
                                <img src={src} alt={`img-${idx}`} />
                                <div className="thumb-actions">
                                    {idx !== 0 && (
                                        <button type="button" onClick={() => makeCover(idx)} className="btn-mini">Set as cover</button>
                                    )}
                                    <button type="button" onClick={() => removeImage(idx)} className="btn-mini danger">Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button type="submit" className="submit-btn">Add Item</button>
        </form>
    );
}

export default AddItemForm;
