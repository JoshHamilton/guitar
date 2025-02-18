import React from 'react';

const Button = ({ 
  onClick, 
  children, 
  variant = 'primary', 
  className = '',
  ...props 
}) => {
  const baseStyles = 'px-4 py-2 rounded font-medium transition-colors duration-200';
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
