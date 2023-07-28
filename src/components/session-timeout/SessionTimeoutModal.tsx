import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

interface SessionTimeOutModalProps {
    showModal: boolean;
    handleContinue: () => void;
    handleLogout: () => void;
}

const SessionTimeOutModal = ({ showModal, handleContinue, handleLogout }: SessionTimeOutModalProps) => {

    return (
        <Modal show={showModal} onHide={handleContinue}>
            <Modal.Header closeButton>
                <Modal.Title>You Have Been Idle!</Modal.Title>
            </Modal.Header>
            <Modal.Body>Your session has been timed out. Do you still want to continue your session?</Modal.Body>
            <Modal.Footer>
                <Button variant="danger" onClick={handleLogout}>
                    Logout
                </Button>
                <Button variant="primary" onClick={handleContinue}>
                    Continue Session
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default SessionTimeOutModal;
