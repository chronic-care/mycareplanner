import moment from 'moment';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import SessionTimeOutModal from './SessionTimeoutModal';

interface SessionTimeOutHandlerProps {
    timeOutInterval?: number;
    onActive: () => void;
    onIdle: () => void;
    onLogout: () => void;
    isLoggedOut: boolean;
}

const SessionTimeOutHandler = (props: SessionTimeOutHandlerProps) => {
    const [showModal, setShowModal] = useState(false)
    const [isLogout, setLogout] = useState(false)

    let timer: any = useRef(null);
    const events = ['click', 'scroll', 'load', 'keydown']

    const startTimer = useCallback(() => {

        timer.current = setTimeout(() => {
            const lastInteractionTime = localStorage.getItem('lastInteractionTime')

            const diff = moment().diff(moment(lastInteractionTime));
            const timeOutInterval = props.timeOutInterval || 60000;

            if (isLogout) {
                clearTimeout(timer.current);
            } else {
                if (diff < timeOutInterval) {
                    startTimer();
                    props.onActive();
                } else {
                    props.onIdle();
                    setShowModal(true);
                }
            }
        }, props.timeOutInterval || 60000)


    }, [isLogout, props])

    const eventHandler = useCallback((eventType) => {
        console.log({ eventType })

        if (!isLogout) {
            localStorage.setItem('lastInteractionTime', moment().toString())
            if (timer.current) {
                props.onActive();
                startTimer();
            }
        }

    }, [isLogout, props, startTimer]);

    const addEvents = useCallback(() => {

        events.forEach(eventName => {
            window.addEventListener(eventName, eventHandler)
        })

        startTimer();
    }, [eventHandler, events, startTimer])

    const removeEvents = useCallback(() => {
        events.forEach(eventName => {
            window.removeEventListener(eventName, eventHandler)
        })
    }, [eventHandler, events]);

    const handleContinueSession = () => {
        setShowModal(false)
        setLogout(false)
    }
    const handleLogout = useCallback(() => {
        removeEvents();
        clearTimeout(timer.current);
        setLogout(true)
        props.onLogout();
        setShowModal(false)
    }, [props, removeEvents, timer])

    useEffect(() => {
        addEvents();

        return () => {
            removeEvents();
        }
    }, [addEvents, removeEvents])

    useEffect(() => {
        if (props.isLoggedOut) {
            removeEvents();
            clearTimeout(timer.current);
            setLogout(true)
            setShowModal(false)
        }
    }, [handleLogout, props.isLoggedOut, removeEvents])

    return (
        <div>
            <SessionTimeOutModal
                showModal={showModal}
                handleContinue={handleContinueSession}
                handleLogout={handleLogout}
            />
        </div>
    )

}

export default SessionTimeOutHandler;