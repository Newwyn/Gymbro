import React from 'react';

const Card = ({ children, title, className = '' }) => {
  return (
    <div className={`glass-card p-6 ${className} animate`}>
      {title && <h2 className="text-xl font-semibold mb-6 text-primary">{title}</h2>}
      {children}
    </div>
  );
};

export default Card;
