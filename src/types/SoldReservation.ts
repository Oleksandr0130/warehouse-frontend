export interface SoldReservation {
    id: number;
    orderNumber: string;
    itemName: string;
    reservedQuantity: number;
    reservationWeek: string;
    status: string; // "SOLD"
    saleDate: string; // Дата продажи
}