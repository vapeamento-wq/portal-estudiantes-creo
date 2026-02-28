import React from 'react';

const Toast = ({ msg, show }) => (
  <div className={`toast-notification ${show ? 'show' : ''}`}>{msg}</div>
);

export default Toast;
