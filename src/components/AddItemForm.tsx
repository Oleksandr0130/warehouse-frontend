import { useState, useRef } from 'react';
import { Item } from '../types/Item';
import '../styles/AddItemForm.css';
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { useTranslation } from 'react-i18next';

interface AddItemFormProps {
    onAdd: (item: Item) => void;
}

const MAX_IMAGES = 5;

function AddItemForm({ onAdd }: AddItemFormProps) {
    const { t } = useTranslation();

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
        const max = MAX_IMAGES - images.length;
        const slice = Array.from(files).slice(0, Math.max(0, max));

        const toBase64 = (file: File) =>
            new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = reject;
                reader.readAsDataURL(file); // inline base64
            });

        try {
            const list = await Promise.all(slice.map(f => toBase64(f)));
            const next = [...images, ...list].slice(0, MAX_IMAGES);
            setImages(next);
        } catch {
            toast.error(t('addItemForm.errors.readImages'));
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
            next.unshift(picked); // first — cover
            return next;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const quantityNum = parseInt(quantity, 10);

        if (!id.trim()) { toast.error(t('addItemForm.validation.idEmpty')); return; }
        if (!name.trim()) { toast.error(t('addItemForm.validation.nameEmpty')); return; }
        if (isNaN(quantityNum) || quantityNum <= 0) {
            toast.error(t('addItemForm.validation.quantityPositive')); return;
        }

        const priceNum = price.trim() ? Number(price) : undefined;
        if (price.trim() && (isNaN(Number(price)) || Number(price) < 0)) {
            toast.error(t('addItemForm.validation.priceNonNegative')); return;
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
        toast.success(t('addItemForm.success.added'));
    };

    return (
        <form className="add-item-form" onSubmit={handleSubmit}>
            <h2 className="add-item-title">{t('addItemForm.title')}</h2>

            <div className="form-group">
                <label htmlFor="id">{t('addItemForm.fields.id.label')}</label>
                <input
                    type="text"
                    id="id"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    required
                    placeholder={t('addItemForm.fields.id.placeholder')}
                />
            </div>

            <div className="form-group">
                <label htmlFor="name">{t('addItemForm.fields.name.label')}</label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder={t('addItemForm.fields.name.placeholder')}
                />
            </div>

            <div className="form-group">
                <label htmlFor="quantity">{t('addItemForm.fields.quantity.label')}</label>
                <input
                    type="number"
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    placeholder={t('addItemForm.fields.quantity.placeholder')}
                    min="0"
                />
            </div>

            {/* price + currency (optional) */}
            <div className="form-row-two">
                <div className="form-group">
                    <label htmlFor="price">{t('addItemForm.fields.price.label')}</label>
                    <input
                        type="number"
                        id="price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder={t('addItemForm.fields.price.placeholder')}
                        min="0"
                        step="0.01"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="currency">{t('addItemForm.fields.currency.label')}</label>
                    <select
                        id="currency"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as any)}
                        disabled={!price.trim()}
                    >
                        {/* коды валют как есть */}
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                        <option value="PLN">PLN</option>
                        <option value="UAH">UAH</option>
                        <option value="GBP">GBP</option>
                    </select>
                </div>
            </div>

            {/* optional description */}
            <div className="form-group">
                <label htmlFor="description">{t('addItemForm.fields.description.label')}</label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('addItemForm.fields.description.placeholder')}
                    rows={3}
                />
            </div>

            {/* images uploader */}
            <div className="form-group">
                <label>{t('addItemForm.fields.images.label', { max: MAX_IMAGES })}</label>
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
                                        <button type="button" onClick={() => makeCover(idx)} className="btn-mini">
                                            {t('addItemForm.images.setCover')}
                                        </button>
                                    )}
                                    <button type="button" onClick={() => removeImage(idx)} className="btn-mini danger">
                                        {t('common.remove')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button type="submit" className="submit-btn">{t('addItemForm.submit')}</button>
        </form>
    );
}

export default AddItemForm;
