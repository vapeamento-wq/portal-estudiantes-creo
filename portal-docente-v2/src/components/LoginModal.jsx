import React from 'react';

const LoginModal = ({ onSubmit, passInput, setPassInput, onCancel }) => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={onSubmit} className="glass-panel fade-in-up" style={{ padding: '40px', width: '320px', textAlign: 'center', background: 'white' }}>
        <h3 style={{ color: 'var(--primary)', marginTop: 0, fontSize: '1.5rem' }}>Acceso Admin</h3>
        <input
          type="password"
          placeholder="Contraseña"
          value={passInput}
          onChange={(e) => setPassInput(e.target.value)}
          style={{ width: '100%', padding: '15px', marginBottom: '20px', border: '1px solid #ddd', borderRadius: '12px', outline: 'none', background: '#f9f9f9' }}
          autoFocus
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={onCancel} className="rounded-btn" style={{ flex: 1, padding: '12px', background: '#f0f0f0', border: 'none', color: '#666', fontWeight: 'bold' }}>Cancelar</button>
          <button type="submit" className="rounded-btn" style={{ flex: 1, background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold' }}>Entrar</button>
        </div>
      </form>
    </div>
  );
};

export default LoginModal;
