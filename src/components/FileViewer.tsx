// import React, { useEffect, useState } from 'react';
// import '../styles/FileViever.css';
// import api from '../api';
//
// const FileViewer: React.FC = () => {
//     const [qrFiles, setQrFiles] = useState<string[]>([]);
//     const [reservationFiles, setReservationFiles] = useState<string[]>([]);
//
//
//     const baseURL = 'https://warehouse-qr-app-8adwv.ondigitalocean.app/api'; // Указывается базовый URL
//
//     useEffect(() => {
//         const fetchQrFiles = async () => {
//             try {
//                 // Получаем файлы QR-кодов с backend
//                 const response = await api.get('/folders/qrcodes');
//                 setQrFiles(
//                     response.data.map((file: string) => `${baseURL}${file}`)
//                 );
//             } catch (error) {
//                 console.error('Ошибка при загрузке QR-кодов:', error);
//             }
//         };
//
//         const fetchReservationFiles = async () => {
//             try {
//                 // Получаем резервные файлы с backend
//                 const response = await api.get('/folders/reservation');
//                 setReservationFiles(
//                     response.data.map(
//                         (file: string) => `${baseURL}${file}`
//                     )
//                 );
//             } catch (error) {
//                 console.error('Ошибка при загрузке резервных файлов:', error);
//             }
//         };
//
//         fetchQrFiles();
//         fetchReservationFiles();
//     }, []);
//
//     const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
//         event.preventDefault();
//         window.open(event.currentTarget.href, '_blank');
//     };
//
//     return (
//         <div className="file-viewer-container">
//             <h1 className="file-viewer-title">Lager QR</h1>
//             <ul className="file-list">
//                 {qrFiles.map((file) => (
//                     <li className="file-item" key={file}>
//                         <a href={file} onClick={handleLinkClick} className="file-link">
//                             {file.split('/').pop()}
//                         </a>
//                     </li>
//                 ))}
//             </ul>
//
//             <h1 className="file-viewer-title">Reserved QR</h1>
//             <ul className="file-list">
//                 {reservationFiles.map((file) => (
//                     <li className="file-item" key={file}>
//                         <a href={file} onClick={handleLinkClick} className="file-link">
//                             {file.split('/').pop()}
//                         </a>
//                     </li>
//                 ))}
//             </ul>
//         </div>
//     );
// };
//
// export default FileViewer;

import React, { useEffect, useState } from 'react';
import '../styles/FileViever.css';
import { fetchItemQRCode } from '../api'; // Импорт функции, которая загружает QR-коды товаров
import api from '../api';

const FileViewer: React.FC = () => {
    const [qrCodes, setQrCodes] = useState<{ id: string; url: string }[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchItemsAndQRCodes = async () => {
            setLoading(true);
            try {
                // Шаг 1: Получить список ID товаров с backend
                const response = await api.get('/items'); // Предполагается, что бэкенд возвращает список товаров
                const items = response.data; // Массив с информацией о товарах

                const qrCodeUrls: { id: string; url: string }[] = [];

                // Шаг 2: Для каждого ID товара запросить QR-код
                for (const item of items) {
                    try {
                        const qrCodeBlob = await fetchItemQRCode(item.id); // Получение QR-кода для товара
                        const qrCodeUrl = URL.createObjectURL(qrCodeBlob); // Генерация URL для изображения
                        qrCodeUrls.push({ id: item.id, url: qrCodeUrl });
                    } catch (error) {
                        console.error(`Ошибка при загрузке QR-кода для товара с ID ${item.id}:`, error);
                    }
                }

                // Шаг 3: Установить полученные данные QR-кодов
                setQrCodes(qrCodeUrls);
            } catch (error) {
                console.error('Ошибка при загрузке списка товаров:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchItemsAndQRCodes();
    }, []);

    const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        window.open(event.currentTarget.href, '_blank');
    };

    return (
        <div className="file-viewer-container">
            <h1 className="file-viewer-title">QR-коды товаров</h1>
            {loading && <p>Загрузка...</p>}

            {!loading && (
                <ul className="file-list">
                    {qrCodes.map((qr) => (
                        <li key={qr.id} className="file-item">
                            <img src={qr.url} alt={`QR-код для товара с ID ${qr.id}`} className="qr-image" />
                            <p>ID товара: {qr.id}</p>
                            <a href={qr.url} onClick={handleLinkClick} className="file-link" download={`qrcode-${qr.id}.png`}>
                                Скачать QR-код
                            </a>
                        </li>
                    ))}
                </ul>
            )}

            {!loading && qrCodes.length === 0 && <p>Нет доступных товаров.</p>}
        </div>
    );
};

export default FileViewer;