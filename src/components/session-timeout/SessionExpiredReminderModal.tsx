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
    return minutes + " minutes " + (seconds < 10 ? '0' : '') + seconds + " seconds";
}

const SessionTimeOutModal = ({ showModal, handleContinue, handleLogout, remainingTime }: SessionTimeOutModalProps) => {

    return (
        <Modal show={showModal} onHide={handleContinue}>
            <Modal.Header closeButton>
                <Modal.Title>Are you still there?</Modal.Title>
            </Modal.Header>
            <Modal.Body>You will be automatically logged out due to inactivity in <br /> {millisToMinutesAndSeconds(Math.abs(remainingTime))}</Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={handleContinue}>
                    Continue Session
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default SessionTimeOutModal;
