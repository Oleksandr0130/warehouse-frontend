import { useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import '../styles/QRScanner.css';

interface QRScannerProps {
  onScan: (data: string) => void;
}

function QRScanner({ onScan }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const animationFrameIdRef = useRef<number | null>(null); // Сохраняем ID анимации для отмены

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let stream: MediaStream | null = null; // Сохраняем стрим для дальнейшего отключения

    const handleSuccess = (mediaStream: MediaStream) => {
      // Останавливаем предыдущий поток, если есть
      if (video.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
        video.srcObject = null;
      }

      // Устанавливаем новый поток
      video.srcObject = mediaStream;

      // Ждём метаданные для безопасного воспроизведения
      video.onloadedmetadata = () => {
        video.play().catch((err) => {
          console.error('Error starting video playback:', err);
        });
      };

      tick(); // Начинаем обработку кадров
    };


    const handleError = (err: Error) => {
      console.error('Camera error:', err);
      alert(`Camera access denied. Please enable camera permissions: ${err.message}`);
    };

    // Запрос разрешения на доступ к камере
    navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then(handleSuccess)
        .catch(handleError);

    const tick = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true }); // Оптимизация для частого чтения
        if (context) {
          // Устанавливаем размеры canvas
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;

          // Отображаем кадр с видео
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

          // Считываем QR-код с изображения
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            onScan(code.data); // Вызываем обработчик, если QR-код найден
            stopCamera(); // Останавливаем камеру после успешного сканирования
            return;
          }
        }
      }
      // Продолжаем процесс, если QR-код не найден
      animationFrameIdRef.current = requestAnimationFrame(tick);
    };

    const stopCamera = () => {
      if (video.srcObject) {
        const mediaStream = video.srcObject as MediaStream;
        mediaStream.getTracks().forEach((track) => track.stop()); // Останавливаем все треки
        video.srcObject = null;
      }
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current); // Останавливаем анимацию
        animationFrameIdRef.current = null;
      }
    };

    // Возвращаем функцию для очистки ресурсов при размонтировании
    return () => {
      stopCamera();
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
    };
  }, [onScan]);

  return (
      <div className="qr-scanner">
        <h2>Scan QR Code</h2>
        <video ref={videoRef} className="qr-video" />
      </div>
  );
}

export default QRScanner;