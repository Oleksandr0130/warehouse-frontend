import React from 'react';
import '../styles/AboutApp.css';

const AboutApp: React.FC = () => {
    return (
        <div className="about-app-container">
            <h1>Über die App</h1>
            <section className="about-section">
                <h2>Zweck</h2>
                <p>
                    Diese App ist für die Verwaltung von Lagerbeständen, die Reservierung von Waren und andere Vorgänge wie die Erfassung verkaufter Artikel oder das Anzeigen von Dateien vorgesehen.
                </p>
            </section>
            <section className="about-section">
                <h2>Funktionalität</h2>
                <ul>
                    <li><strong>Lagerverwaltung:</strong> Hinzufügen, Bearbeiten und Löschen von Artikeln.</li>
                    <li><strong>Warenreservierung:</strong> System zur Reservierung von Artikeln im Lager.</li>
                    <li><strong>Verkaufte Artikel:</strong> Anzeige der Liste verkaufter Reservierungen.</li>
                    <li><strong>QR-Code-Scanner:</strong> Unterstützung für das Hinzufügen/Löschen über QR-Codes.</li>
                    <li><strong>Datenexport:</strong> Möglichkeit, Daten im Excel-Format zu exportieren.</li>
                </ul>
            </section>
            <section className="about-section">
                <h2>Urheberrechtshinweis</h2>
                <p>
                    © 2025 Alexander Starikov. Diese App ist geistiges Eigentum des Entwicklers. Alle Rechte vorbehalten.
                </p>
                <p>
                    Die Verbreitung von Binärdateien und Quellcode ohne Genehmigung des Eigentümers ist untersagt.
                </p>
            </section>
            <section className="about-section">
                <h2>Kontakt</h2>
                <p>Bei Fragen wenden Sie sich bitte an: <a href="mailto:olek92112@gmail.com">olek92112@gmail.com</a></p>
            </section>
        </div>
    );
};

export default AboutApp;