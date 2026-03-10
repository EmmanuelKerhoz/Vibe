import React, { useRef } from 'react';

const MarkupInput = () => {
    const overlayRef = useRef(null);
    const handleScroll = () => {
        // Your scroll handling logic
    };

    return (
        <div className="overlay" ref={overlayRef} aria-hidden="true" style={{ /* existing style properties */ }}>
            <textarea onScroll={handleScroll} />
            {/* other elements */}
        </div>
    );
};

export default MarkupInput;