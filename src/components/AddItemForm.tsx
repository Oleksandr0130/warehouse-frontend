import { useState } from 'react';
import { Item } from '../types/Item';
import '../styles/AddItemForm.css';
import { toast} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css'

interface AddItemFormProps {
  onAdd: (item: Item) => void;
}

function AddItemForm({ onAdd }: AddItemFormProps) {
  const [id, setId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const quantityNum = parseInt(quantity);
    if (!id.trim()) {
      toast.error('ID darf nicht leer sein.'); // Используем toast.error
      return;
    }
    if (!name.trim()) {
      toast.error('Name darf nicht leer sein.'); // Используем toast.error
      return;
    }
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast.error('Die Menge muss eine positive Zahl sein.'); // Используем toast.error
      return;
    }

    onAdd({ id: id.trim(), name: name.trim(), quantity: quantityNum, sold: 0 });

    // Очищаем поля формы и показываем уведомление об успехе
    setId('');
    setName('');
    setQuantity('');
    toast.success('Artikel erfolgreich hinzugefügt!'); // Используем toast.success
  };

  return (
      <form className="add-item-form" onSubmit={handleSubmit}>
        <h2>Neues Element hinzufügen</h2>
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
              placeholder="Name Ware"
          />
        </div>
        <div className="form-group">
          <label htmlFor="quantity">Menge</label>
          <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              placeholder="Menge eingeben"
              min="0"
          />
        </div>
        <button type="submit" className="submit-btn">
          Element hinzufügen
        </button>
      </form>
  );
}


export default AddItemForm;