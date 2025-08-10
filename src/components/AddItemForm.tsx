import { useState } from 'react';
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const quantityNum = parseInt(quantity);
        if (!id.trim()) {
            toast.error('ID must not be empty.');
            return;
        }
        if (!name.trim()) {
            toast.error('Name cannot be empty.');
            return;
        }
        if (isNaN(quantityNum) || quantityNum <= 0) {
            toast.error('The quantity must be a positive number.');
            return;
        }

        onAdd({ id: id.trim(), name: name.trim(), quantity: quantityNum, sold: 0 });

        setId('');
        setName('');
        setQuantity('');
        toast.success('Item successfully added!');
    };

    return (
        <form className="add-item-form card" onSubmit={handleSubmit}>
            <h2 className="h2">Add new item</h2>

            <div className="form-group">
                <label htmlFor="id">Name QR</label>
                <input
                    className="input"
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
                    className="input"
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
                    className="input"
                    type="number"
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    placeholder="Enter amount"
                    min="0"
                />
            </div>

            <button type="submit" className="btn btn-primary">
                Add item
            </button>
        </form>
    );
}

export default AddItemForm;
