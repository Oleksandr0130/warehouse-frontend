import { SoldReservation } from '../types/SoldReservation';
import '../styles/SoldItemsList.css';

interface SoldItemsListProps {
    reservations: SoldReservation[];
}

function SoldItemsList({ reservations }: SoldItemsListProps) {
    if (reservations.length === 0) {
        return <p className="empty-message">There are no reservations yet.</p>;
    }

    return (
        <div className="sold-items-list">
            <h2>Sold items</h2>
            <ul>
                {reservations.map((reservation) => (
                    <li key={reservation.id} className="sold-item">
                        <span className="item-order-number">Order number: {reservation.orderNumber}</span>
                        <span className="item-name">Name: {reservation.itemName}</span>
                        <span className="item-quantity">Amount: {reservation.reservedQuantity}</span>
                        <span className="item-sold-week">Week: {reservation.reservationWeek}</span>
                        <span className="item-sale-date">
                            Date: {new Date(reservation.saleDate).toLocaleString()}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default SoldItemsList;