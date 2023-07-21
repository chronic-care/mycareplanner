import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

interface SessionTimeOutModalProps {
    showModal: boolean;
    handleLogout: () => void;
    handleContinue: () => void;
    remainingTime: number;
}

const millisToMinutesAndSeconds = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = +((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

const SessionTimeOutModal = ({ showModal, handleContinue, handleLogout, remainingTime }: SessionTimeOutModalProps) => {

    return (
        <Modal show={showModal} onHide={handleContinue}>
            <Modal.Header closeButton>
                <Modal.Title>Your session has almost expired!</Modal.Title>
            </Modal.Header>
            <Modal.Body>You will be automatically logged out in {millisToMinutesAndSeconds(Math.abs(remainingTime))}</Modal.Body>
            <Modal.Footer>
                <Button variant="danger" onClick={handleLogout}>
                    Logout now
                </Button>
                <Button variant="primary" onClick={handleContinue}>
                    Continue Session
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default SessionTimeOutModal;
