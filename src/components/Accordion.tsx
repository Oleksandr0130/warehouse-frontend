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
            {isOpen && (
                <div className="accordion-content">
                    {children}
                </div>
            )}
        </div>
    );
};

export default Accordion;