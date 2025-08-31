import React, { useEffect, useState } from 'react';
import ItemList from './ItemList';
import { Item } from '../types/Item';
import { toast } from 'react-toastify';
import { fetchItems } from '../api'; // см. пункт 2

const ItemsPage: React.FC = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchItems();
                setItems(data);
            } catch (e) {
                console.error(e);
                toast.error('Failed to load items');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <div className="item-list"><p>Loading...</p></div>;
    return <ItemList items={items} />;
};

export default ItemsPage;
