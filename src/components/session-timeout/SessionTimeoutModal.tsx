import React, { useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

interface SessionTimeOutModalProps {
    showModal: boolean;
    handleContinue: () => void;
    handleLogout: () => void;
    isLoggedOut: boolean;
}

const millisToMinutesAndSeconds = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = +((millis % 60000) / 1000).toFixed(0);
    return minutes + " minutes " + (seconds < 10 ? '0' : '') + seconds + " seconds";
}

const SessionTimeOutModal = ({ showModal, handleContinue, handleLogout, isLoggedOut }: SessionTimeOutModalProps) => {
    const countDown = React.useMemo(() => {
        return +(process.env.REACT_APP_CLIENT_IDLE_TIMEOUT_COUNTDOWN ?? 5000)
    }, []);
    const [remainingTime, setRemainingTime] = React.useState(countDown);

    const countDownTimer: any = React.useRef(null);

    useEffect(() => {
        console.log({ showModal })
        if (showModal) {
            const countDownTime = new Date().getTime() + countDown;
            countDownTimer.current = setInterval(() => {
                const now = new Date().getTime();
                const remaining = countDownTime - now;
                setRemainingTime(remaining);

                if (remaining <= 0) {
                    clearInterval(countDownTimer.current);
                    handleLogout();
                }
            }, 100)
        } else {
            setRemainingTime(countDown);
        }

        return () => {
            clearInterval(countDownTimer.current);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showModal])

    useEffect(() => {
        console.log(countDown)
    }, [countDown])

    const onHandleContinue = () => {
        clearInterval(countDownTimer.current);
        handleContinue();
    }

    useEffect(() => {
        if (isLoggedOut) {
            handleLogout(); 
        }
    }, [isLoggedOut, handleLogout]);

    if (isLoggedOut) {
        return null; 
    }
    
    return (
        <Modal show={showModal}>
            <Modal.Header closeButton={false}>
                <Modal.Title>Are you still there?</Modal.Title>
            </Modal.Header>
            <Modal.Body>You will be automatically logged out due to inactivity in <br /> {millisToMinutesAndSeconds(Math.abs(remainingTime))}</Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={onHandleContinue}>
                    Continue Session
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default SessionTimeOutModal;