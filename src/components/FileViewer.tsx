// import React, { useEffect, useState } from 'react';
// import '../styles/FileViever.css';
// import api from '../api';
//
// const FileViewer: React.FC = () => {
//     const [qrFiles, setQrFiles] = useState<string[]>([]);
//     const [reservationFiles, setReservationFiles] = useState<string[]>([]);
//
//     const baseURL = 'http://localhost:8080/api'; // Указывается базовый URL
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
    const [error, setError] = useState<string | null>(null);

    const baseURL = 'https://warehouse-qr-app-8adwv.ondigitalocean.app'; // Правильный базовый URL

    useEffect(() => {
        const fetchQrFiles = async () => {
            try {
                const response = await api.get('/folders/qrcodes');
                setQrFiles(
                    response.data.map((file: string) => `${baseURL}${file}`)
                );
            } catch (error) {
                console.error('Ошибка при загрузке QR-кодов:', error);
                setError('Не удалось загрузить QR-коды. Попробуйте позже.');
            }
        };

        const fetchReservationFiles = async () => {
            try {
                const response = await api.get('/folders/reservation');
                setReservationFiles(
                    response.data.map((file: string) => `${baseURL}${file}`)
                );
            } catch (error) {
                console.error('Ошибка при загрузке резервных файлов:', error);
                setError('Не удалось загрузить резервные файлы. Попробуйте позже.');
            }
        };

        fetchQrFiles();
        fetchReservationFiles();
    }, []);

    const handleLinkClick = (file: string) => {
        window.open(file, '_blank');
    };

    return (
        <div className="file-viewer-container">
            <h1 className="file-viewer-title">Lager QR</h1>
            {error && <div className="error-message">{error}</div>}
            <ul className="file-list">
                {qrFiles.map((file) => {
                    const fileName = file.split('/').pop() || '';
                    return (
                        <li className="file-item" key={file}>
                <span
                    onClick={() => handleLinkClick(file)}
                    className="file-link"
                >
                    {decodeURIComponent(fileName.replace('.png', ''))}
                </span>
                        </li>
                    );
                })}
            </ul>




            <h1 className="file-viewer-title">Reserved QR</h1>
            <ul className="file-list">
                {reservationFiles.map((file) => {
                    const fileName = file.split('/').pop() || '';
                    return (
                        <li className="file-item" key={file}>
                <span
                    onClick={() => handleLinkClick(file)}
                    className="file-link"
                >
                    {decodeURIComponent(fileName.replace('.png', ''))}
                </span>
                        </li>
                    );
                })}
            </ul>


        </div>
    );
};

export default FileViewer;

