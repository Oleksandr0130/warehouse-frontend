import { SoldReservation } from '../types/SoldReservation';
import '../styles/SoldItemsList.css';

interface SoldItemsListProps {
    reservations: SoldReservation[];
}

function SoldItemsList({ reservations }: SoldItemsListProps) {
    if (reservations.length === 0) {
        return <p className="empty-message">Es liegen noch keine Reservierungen vor.</p>;
    }

    return (
        <div className="sold-items-list">
            <h2>Verkauft Ware</h2>
            <ul>
                {reservations.map((reservation) => (
                    <li key={reservation.id} className="sold-item">
                        <span className="item-order-number">Auftragsnummer: {reservation.orderNumber}</span>
                        <span className="item-name">Namen: {reservation.itemName}</span>
                        <span className="item-quantity">Menge: {reservation.reservedQuantity}</span>
                        <span className="item-sold-week">KW: {reservation.reservationWeek}</span>
                        <span className="item-sale-date">
                            Datum: {new Date(reservation.saleDate).toLocaleString()}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default SoldItemsList;