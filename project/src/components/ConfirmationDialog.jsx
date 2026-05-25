import React from 'react';
import { AlertCircle, X, CheckCircle2 } from 'lucide-react';

const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, message, isDeleteDialog = false }) => {
  if (!isOpen) return null;

  const isSuccess = title === 'Success';
  const iconColor = isSuccess ? '#16a34a' : '#dc2626';
  const bgColor = isSuccess ? '#dcfce7' : '#fef2f2';
  const titleColor = isSuccess ? '#15803d' : '#b91c1c';
  const buttonBgColor = isSuccess ? '#16a34a' : '#dc2626';
  const buttonHoverColor = isSuccess ? '#15803d' : '#b91c1c';

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    if (isDeleteDialog) onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '30px',
        maxWidth: '450px',
        width: '90%',
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#64748b',
            transition: 'color 0.2s ease',
          }}
          aria-label="Close dialog"
        >
          <X size={24} />
        </button>
        
        <div style={{
          width: '120px',
          height: '120px',
          margin: '0 auto 25px',
          borderRadius: '50%',
          backgroundColor: isSuccess ? '#f0fdf4' : '#fef2f2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: isSuccess ? '0 4px 20px rgba(34, 197, 94, 0.2)' : '0 4px 20px rgba(220, 38, 38, 0.2)',
        }}>
          {isSuccess ? (
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              backgroundColor: '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `4px solid #22c55e`,
              position: 'relative',
              overflow: 'visible'
            }}>
              <CheckCircle2 size={64} color="#22c55e" strokeWidth={2.5} />
              <div style={{
                position: 'absolute',
                width: '36px',
                height: '36px',
                backgroundColor: '#22c55e',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                right: '-10px',
                bottom: '-10px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}>
                <CheckCircle2 size={18} color="white" fill="#22c55e" />
              </div>
            </div>
          ) : (
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `3px solid #dc2626`,
            }}>
              <AlertCircle size={48} color="#dc2626" strokeWidth={2.5} />
            </div>
          )}
        </div>
        
        <h3 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: titleColor,
          marginBottom: '12px',
        }}>{title}</h3>
        
        <p style={{
          fontSize: '16px',
          color: '#475569',
          lineHeight: '1.5',
          marginBottom: '24px',
        }}>{message}</p>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '24px',
        }}>
          {!isSuccess && !isDeleteDialog && (
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            >
              Cancel
            </button>
          )}
          
          {isDeleteDialog && (
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            >
              Cancel
            </button>
          )}
          
          <button
            onClick={isSuccess || isDeleteDialog ? handleConfirm : onConfirm}
            style={{
              padding: '12px 24px',
              backgroundColor: isDeleteDialog ? '#ef4444' : buttonBgColor,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = isDeleteDialog ? '#dc2626' : buttonHoverColor;
              if (isDeleteDialog) e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = isDeleteDialog ? '#ef4444' : buttonBgColor;
              if (isDeleteDialog) e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {isSuccess ? 'Close' : isDeleteDialog ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
