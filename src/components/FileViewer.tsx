import React, { useEffect, useState } from 'react';
import '../styles/FileViever.css';
import api from '../api';

interface QRFile {
    id: string; // ID элемента
    qrCode: string; // Base64 строка QR-кода
}

// const FileViewer: React.FC = () => {
//     const [qrFiles, setQrFiles] = useState<QRFile[]>([]); // Состояние для QR-кодов с их ID
//     const [reservationFiles, setReservationFiles] = useState<string[]>([]); // Состояние для резервных файлов
//
//     useEffect(() => {
//         // Получение данных QR-кодов
//         const fetchQrFiles = async () => {
//             try {
//                 // Запрашиваем список всех элементов
//                 const response = await api.get('/items'); // Эндпоинт возвращает все данные товара
//                 const qrBase64Files = response.data.map((item: { id: string; qrCode: string }) => ({
//                     id: item.id, // Используем ID для подписей
//                     qrCode: item.qrCode, // Base64 строка QR-кода
//                 }));
//                 setQrFiles(qrBase64Files); // Устанавливаем состояние
//             } catch (error) {
//                 console.error('Ошибка при загрузке QR-кодов:', error);
//             }
//         };
//
//         // Получение резервных файлов
//         const fetchReservationFiles = async () => {
//             try {
//                 const response = await api.get('/folders/reservation');
//                 setReservationFiles(
//                     response.data.map((file: string) => `${file}`) // Формируем URL без baseURL, так как резервное API не изменилось
//                 );
//             } catch (error) {
//                 console.error('Ошибка при загрузке резервных файлов:', error);
//             }
//         };
//
//         // Вызов функций
//         fetchQrFiles();
//         fetchReservationFiles();
//     }, []);
//
//     // Обработчик для скачивания QR-кода
//     const handleDownloadQRCode = async (id: string) => {
//         try {
//             const response = await api.get(`/items/${id}/download-qrcode`, {
//                 responseType: 'blob', // Задаем формат ответа
//             });
//             const url = window.URL.createObjectURL(new Blob([response.data])); // Генерация URL из бинарных данных
//             const link = document.createElement('a'); // Создаем элемент <a>
//             link.href = url;
//             link.setAttribute('download', `${id}.png`); // Устанавливаем имя файла на основе ID
//             document.body.appendChild(link); // Встраиваем элемент в DOM
//             link.click(); // Запускаем скачивание
//             document.body.removeChild(link); // Удаляем элемент после скачивания
//         } catch (error) {
//             console.error('Ошибка при скачивании QR-кода:', error);
//             alert(`Не удалось скачать QR-код с ID: ${id}`);
//         }
//     };
//
//     // Обработчик для всплывающего окна при клике на картинку
//     const handleImageClick = (event: React.MouseEvent<HTMLImageElement>, qrCode: string) => {
//         event.preventDefault();
//         // Открытие в новом окне QR-кода
//         const newWindow = window.open();
//         if (newWindow) {
//             newWindow.document.write(
//                 `<img src="data:image/png;base64,${qrCode}" alt="QR Code"/>`
//             );
//             newWindow.document.title = 'QR Code';
//             newWindow.document.close();
//         }
//     };
//
//     // Обработчик клика по ссылке файла
//     const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
//         event.preventDefault();
//         window.open(event.currentTarget.href, '_blank'); // Открытие в новой вкладке
//     };
//
//     return (
//         <div className="file-viewer-container">
//             <h1 className="file-viewer-title">Lager QR</h1>
//             <ul className="file-list">
//                 {qrFiles.map((file) => (
//                     <li className="file-item" key={file.id}>
//                         {/* Отображение изображения QR-кода */}
//                         <img
//                             src={`data:image/png;base64,${file.qrCode}`} // base64 строка QR-кода
//                             alt={`QR код ${file.id}`}
//                             className="qr-image" // Стилизация изображения
//                             onClick={(e) => handleImageClick(e, file.qrCode)} // Всплывающее окно
//                         />
//                         <span className="file-name">{file.id}</span> {/* Подпись с использованием ID */}
//                         <button
//                             className="download-button"
//                             onClick={() => handleDownloadQRCode(file.id)} // Скачиваем QR-код по ID
//                         >
//                             Скачать
//                         </button>
//                     </li>
//                 ))}
//             </ul>
//
//             <h1 className="file-viewer-title">Reserved QR</h1>
//             <ul className="file-list">
//                 {reservationFiles.map((file, index) => (
//                     <li className="file-item" key={index}>
//                         <a
//                             href={file}
//                             onClick={handleLinkClick}
//                             className="file-link"
//                         >
//                             {file.split('/').pop()}
//                         </a>
//                     </li>
//                 ))}
//             </ul>
//         </div>
//     );
// };


interface ReservationFile {
    id: string; // ID резервации
    qrCode: string; // Base64 строка QR-кода резервации
    orderNumber: string; // Номер заказа
}

const FileViewer: React.FC = () => {
    const [qrFiles, setQrFiles] = useState<QRFile[]>([]); // Состояние для QR-кодов товаров
    const [reservationFiles, setReservationFiles] = useState<ReservationFile[]>([]); // Состояние для QR-кодов резервации
    const [showModal, setShowModal] = useState(false); // Состояние для отображения модального окна
    const [activeQrCode, setActiveQrCode] = useState<string | null>(null); // Храним QR-код для модального окна

    useEffect(() => {
        // Получение данных QR-кодов товаров
        const fetchQrFiles = async () => {
            try {
                const response = await api.get('/items'); // Эндпоинт возвращает все данные товара
                const qrBase64Files = response.data.map((item: { id: string; qrCode: string }) => ({
                    id: item.id, // Используем ID для подписей
                    qrCode: item.qrCode, // Base64 строка QR-кода
                }));
                setQrFiles(qrBase64Files);
            } catch (error) {
                console.error('Ошибка при загрузке QR-кодов товаров:', error);
            }
        };

        // Получение данных QR-кодов резерваций
        const fetchReservationFiles = async () => {
            try {
                const response = await api.get('/reservations'); // Эндпоинт возвращает резервации
                const reservationFiles = response.data.map((reservation: { id: string; qrCode: string; orderNumber: string }) => ({
                    id: reservation.id, // Используем ID резервации
                    qrCode: reservation.qrCode, // Base64 строка QR-кода резервации
                    orderNumber: reservation.orderNumber, // Номер заказа
                }));
                setReservationFiles(reservationFiles);
            } catch (error) {
                console.error('Ошибка при загрузке QR-кодов резерваций:', error);
            }
        };

        // Вызов функций
        fetchQrFiles();
        fetchReservationFiles();
    }, []);

    // Обработчик для скачивания QR-кода
    const handleDownloadQRCode = async (id: string, type: 'item' | 'reservation') => {
        try {
            const endpoint = type === 'item' ? `/items/${id}/download-qrcode` : `/reservations/${id}/download-qrcode`;
            const response = await api.get(endpoint, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${id}.png`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Ошибка при скачивании QR-кода:', error);
            alert(`Не удалось скачать QR-код с ID: ${id}`);
        }
    };

    // Обработчик для отображения модального окна
    const handleImageClick = (qrCode: string) => {
        setActiveQrCode(qrCode); // Устанавливаем текущий QR-код для отображения
        setShowModal(true); // Показываем модальное окно
    };

    // Обработчик для закрытия модального окна
    const handleCloseModal = () => {
        setShowModal(false); // Скрываем окно
        setActiveQrCode(null); // Сбрасываем QR-код
    };

    return (
        <div className="file-viewer-container">
            {/* QR-коды товаров */}
            <h1 className="file-viewer-title">Lager QR</h1>
            <ul className="file-list">
                {qrFiles.map((file) => (
                    <li className="file-item" key={file.id}>
                        <img
                            src={`data:image/png;base64,${file.qrCode}`}
                            alt={`QR код товара ${file.id}`}
                            className="qr-image"
                            onClick={() => handleImageClick(file.qrCode)} // Открытие модального окна
                        />
                        <span className="file-name">Товар ID: {file.id}</span>
                        <button
                            className="download-button"
                            onClick={() => handleDownloadQRCode(file.id, 'item')}
                        >
                            Скачать
                        </button>
                    </li>
                ))}
            </ul>

            {/* QR-коды резерваций */}
            <h1 className="file-viewer-title">Reserved QR</h1>
            <ul className="file-list">
                {reservationFiles.map((file) => (
                    <li className="file-item" key={file.id}>
                        <img
                            src={`data:image/png;base64,${file.qrCode}`}
                            alt={`QR код резервации ${file.orderNumber}`}
                            className="qr-image"
                            onClick={() => handleImageClick(file.qrCode)} // Открытие модального окна
                        />
                        <span className="file-name">Номер заказа: {file.orderNumber}</span> {/* Отображаем номер заказа */}
                        <button
                            className="download-button"
                            onClick={() => handleDownloadQRCode(file.id, 'reservation')}
                        >
                            Скачать
                        </button>
                    </li>
                ))}
            </ul>

            {/* Модальное окно */}
            {showModal && activeQrCode && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={`data:image/png;base64,${activeQrCode}`}
                            alt="QR Code"
                            className="modal-image"
                        />
                        <button className="close-button" onClick={handleCloseModal}>
                            Закрыть
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileViewer;


