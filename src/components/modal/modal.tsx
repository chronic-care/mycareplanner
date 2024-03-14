// components/Modal/Modal.tsx
import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import './modal.css';

interface ModalProps {
  isVisible: boolean;
  closeModal: () => void;
}

const Modal: React.FC<ModalProps> = ({ isVisible, closeModal }) => {
  useEffect(() => {
    // Check if the user has seen the modal before
    const hasSeenModal = sessionStorage.getItem('hasSeenModal');

    // If the user hasn't seen the modal, show it
    if (!hasSeenModal) {
      setModalVisible(true);
      // Mark the modal as seen for this session
      sessionStorage.setItem('hasSeenModal', 'true');
    }
  }, []);

  const [modalVisible, setModalVisible] = useState(isVisible);

  const closeAndSetFlag = () => {
    setModalVisible(false);
    // Mark the modal as seen for this session
    sessionStorage.setItem('hasSeenModal', 'true');
  };

  return (
    <>
      {modalVisible && (
        <div className="modal-overlay">
          <div className="modal">
            <span className="close-btn" onClick={closeAndSetFlag}>X</span>
            <br></br>
            <div className="modal-content">
              {/* Your warning banner text here */}
              <Box>
              <p>
                This system is provided for Government-authorized use only.

                Unauthorized or improper use of this system is prohibited and may result in disciplinary action and/or civil and criminal penalties.

                Personal use of social media and networking sites on this system is limited as to not interfere with official work duties and is subject to monitoring.

                By using this system, you understand and consent to the following:

                The Government may monitor, record, and audit your system usage, including usage of personal devices and email systems for official duties or to conduct HHS business. Therefore, you have no reasonable expectation of privacy regarding any communication or data transiting or stored on this system. At any time, and for any lawful Government purpose, the government may monitor, intercept, and search and seize any communication or data transiting or stored on this system.
                Any communication or data transiting or stored on this system may be disclosed or used for any lawful Government purpose.
              </p>
              </Box>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Modal;
