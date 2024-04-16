import React, { useEffect, useState } from 'react';
import './modal.css';

interface ModalProps {
    isVisible: boolean;
    closeModal: () => void;
}

const Modal: React.FC<ModalProps> = ({ isVisible, closeModal }) => {
    useEffect(() => {
        const hasSeenModal = sessionStorage.getItem('hasSeenModal');
        if (!hasSeenModal) {
            setModalVisible(true);
            sessionStorage.setItem('hasSeenModal', 'true');
        }
    }, []);

    const [modalVisible, setModalVisible] = useState(isVisible);
    const closeAndSetFlag = () => {
        setModalVisible(false);
        sessionStorage.setItem('hasSeenModal', 'true');
    };
    return (
        <>
            {modalVisible && (
                <div className='modal-style'>
                    <div className="">
                        <span className="close-btn" onClick={closeAndSetFlag}>X</span>
                        <br></br>
                        <p>
                            This system is provided for Government-authorized use only.
                            <p>Unauthorized or improper use of this system is prohibited and may result in disciplinary action and/or civil and criminal penalties.</p>
                            <p>Personal use of social media and networking sites on this system is limited as to not interfere with official work duties and is subject to monitoring.</p>
                            <p>By using this system, you understand and consent to the following:</p>
                            <p>
                                The Government may monitor, record, and audit your system usage, including usage of personal devices and email systems for official duties or to conduct HHS business. Therefore, you have no reasonable expectation of privacy regarding any communication or data transiting or stored on this system. At any time, and for any lawful Government purpose, the government may monitor, intercept, and search and seize any communication or data transiting or stored on this system.
                                Any communication or data transiting or stored on this system may be disclosed or used for any lawful Government purpose.
                            </p>
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};
export default Modal;
