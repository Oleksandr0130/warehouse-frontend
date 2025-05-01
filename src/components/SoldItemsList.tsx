import { SoldReservation } from '../types/SoldReservation';
import '../styles/SoldItemsList.css';

interface SoldItemsListProps {
    reservations: SoldReservation[];
}

function SoldItemsList({ reservations }: SoldItemsListProps) {
    if (reservations.length === 0) {
        return <p className="empty-message">No reservations have been sold yet.</p>;
    }

    return (
        <div className="sold-items-list">
            <h2>Sold Reservations</h2>
            <ul>
                {reservations.map((reservation) => (
                    <li key={reservation.id} className="sold-item">
                        <span className="item-order-number">Order Number: {reservation.orderNumber}</span>
                        <span className="item-name">Item Name: {reservation.itemName}</span>
                        <span className="item-quantity">Quantity: {reservation.reservedQuantity}</span>
                        <span className="item-sold-week">Reservation Week: {reservation.reservationWeek}</span>
                        <span className="item-sale-date">
                            Sale Date: {new Date(reservation.saleDate).toLocaleString()}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default SoldItemsList;