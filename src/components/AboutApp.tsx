// src/components/AboutApp.tsx
import React from 'react';
import '../styles/AboutApp.css';

const AboutApp: React.FC = () => {
    return (
        <div className="about-app">
            <h1 className="about-title">About FLOWQR</h1>

            <section className="about-section">
                <h2>What is FLOWQR?</h2>
                <p>
                    FLOWQR is a modern warehouse management application that helps you
                    organize, control, and track your inventory using QR codes.
                    The system is available both as a web application and as a mobile app.
                </p>
            </section>

            <section className="about-section">
                <h2>Main Features</h2>
                <ul>
                    <li><strong>Inventory:</strong> View and manage all items stored in the warehouse.</li>
                    <li><strong>Create Item:</strong> Add new products with details and generate QR codes automatically.</li>
                    <li><strong>Reserved Items:</strong> Manage reservations and track reserved quantities.</li>
                    <li><strong>Create a Reservation:</strong> Reserve products for orders with specific weeks and order numbers.</li>
                    <li><strong>Sold Items:</strong> View items that have been sold and completed.</li>
                    <li><strong>QR-Codes:</strong> Generate and scan warehouse or reserved QR codes for quick access.</li>
                    <li><strong>Personal Account:</strong> Manage your subscription, trial period, and account information.</li>
                </ul>
            </section>

            <section className="about-section">
                <h2>Subscription & Trial</h2>
                <p>
                    Every new user starts with a trial period. After the trial expires, you can
                    subscribe to continue using all FLOWQR features without limitations.
                </p>
            </section>

            <section className="about-section">
                <h2>Why FLOWQR?</h2>
                <p>
                    By combining warehouse management with QR code technology, FLOWQR makes
                    stock tracking faster, more reliable, and user-friendly.
                    Whether you are managing a small business or a large warehouse,
                    FLOWQR adapts to your needs.
                </p>
            </section>

            <section className="about-section">
                <h2>Contact</h2>
                <p>
                    For questions or support, please contact:{" "}
                    <a href="mailto:olek92112@gmail.com">olek92112@gmail.com</a>
                </p>
            </section>
        </div>
    );
};

export default AboutApp;
