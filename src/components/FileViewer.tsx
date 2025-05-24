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
import api from '../api';

const FileViewer: React.FC = () => {
    const [qrFiles, setQrFiles] = useState<string[]>([]);
    const [reservationFiles, setReservationFiles] = useState<string[]>([]);
    const [loadedQrCodes, setLoadedQrCodes] = useState<{ id: string; url: string }[]>([]);

    const baseURL = 'https://warehouse-qr-app-8adwv.ondigitalocean.app/api'; // Указывается базовый URL

    useEffect(() => {
        const fetchQrFiles = async () => {
            try {
                // Получаем файлы QR-кодов с backend
                const response = await api.get('/folders/qrcodes');
                setQrFiles(
                    response.data.map((file: string) => `${baseURL}${file}`)
                );
            } catch (error) {
                console.error('Ошибка при загрузке QR-кодов:', error);
            }
        };

        const fetchReservationFiles = async () => {
            try {
                // Получаем резервные файлы с backend
                const response = await api.get('/folders/reservation');
                setReservationFiles(
                    response.data.map(
                        (file: string) => `${baseURL}${file}`
                    )
                );
            } catch (error) {
                console.error('Ошибка при загрузке резервных файлов:', error);
            }
        };

        const fetchAllQrCodes = async () => {
            try {
                // Загружаем список товаров из API
                const itemsResponse = await api.get('/items'); // Предполагается, что API вернет список товаров
                const items = itemsResponse.data; // Массив объектов товаров: [{ id: 'item1', name: '...' }, ...]

                // Для каждого товара запрашиваем QR-код
                for (const item of items) {
                    await fetchQrCodeById(item.id); // item.id — это ID товара
                }
            } catch (error) {
                console.error('Ошибка при загрузке списка товаров и QR-кодов:', error);
            }
        };

        const fetchQrCodeById = async (id: string) => {
            try {
                const response = await api.get(`/items/${id}/qrcode`, {
                    responseType: 'blob', // Ожидаем "изображение" в формате Blob
                });

                const qrCodeUrl = URL.createObjectURL(response.data); // Преобразуем Blob в URL
                setLoadedQrCodes((prev) => [...prev, { id, url: qrCodeUrl }]);
            } catch (error) {
                console.error(`Ошибка загрузки QR-кода для ID ${id}:`, error);
            }
        };

        fetchQrFiles();
        fetchReservationFiles();
        fetchAllQrCodes();
    }, []);

    const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        window.open(event.currentTarget.href, '_blank');
    };

    return (
        <div className="file-viewer-container">
            <h1 className="file-viewer-title">Lager QR</h1>
            <ul className="file-list">
                {qrFiles.map((file) => (
                    <li className="file-item" key={file}>
                        <a href={file} onClick={handleLinkClick} className="file-link">
                            {file.split('/').pop()}
                        </a>
                    </li>
                ))}
            </ul>

            <h1 className="file-viewer-title">Reserved QR</h1>
            <ul className="file-list">
                {reservationFiles.map((file) => (
                    <li className="file-item" key={file}>
                        <a href={file} onClick={handleLinkClick} className="file-link">
                            {file.split('/').pop()}
                        </a>
                    </li>
                ))}
            </ul>

            <h1 className="file-viewer-title">Dynamic QR Codes</h1>
            <ul className="file-list">
                {loadedQrCodes.map((qrCode) => (
                    <li key={qrCode.id} className="file-item">
                        <img src={qrCode.url} alt={`QR Code for ${qrCode.id}`} className="qr-code-image" />
                        <p>ID: {qrCode.id}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FileViewer;