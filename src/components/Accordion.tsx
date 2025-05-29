import React, { useState } from 'react';

interface AccordionProps {
    title: string;
    children: React.ReactNode;
}

const Accordion: React.FC<AccordionProps> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="accordion-container">
            <div
                className={`accordion-header ${isOpen ? 'open' : 'closed'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {title}
                <span className="arrow">{isOpen ? "▼" : "▶"}</span>
            </div>
            <div
                className={`accordion-content ${isOpen ? 'open' : ''}`}
                style={{
                    maxHeight: isOpen ? '1000px' : '0px', // Плавная анимация открытия
                    overflow: 'hidden',
                    transition: 'max-height 0.2s ease-out',
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default Accordion;