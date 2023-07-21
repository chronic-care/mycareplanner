import moment from 'moment';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import SessionExpiredReminderModal from './SessionExpiredReminderModal';

interface TokenData {
    authorizeUri: string;
    clientId: string;
    codeChallengeMethods: string[];
    expiresAt: number;
    key: string;
    redirectUri: string;
    registrationUri: string;
    scope: string;
    serverUrl: string;
    tokenResponse: object;
    tokenUri: string;
}

interface SessionExpiredHandlerProps {
    timeOutInterval?: number;
    onLogout: () => void;
    isLoggedOut: boolean;
}

const SessionExpiredHandler = (props: SessionExpiredHandlerProps) => {
    const [showModal, setShowModal] = useState(false)
    const [isLogout, setLogout] = useState(false)
    const [remainingTime, setRemainingTime] = useState(0)
    const [isContinueSession, setContinueSession] = useState(false)

    let timer: any = useRef(null);

    const startExpiryChecker = useCallback(() => {
        if (!isLogout) {
            timer.current = setInterval(() => {
                const smartKey = JSON.parse(sessionStorage.getItem('SMART_KEY') || '{}')
                const tokenData: TokenData | null = JSON.parse(sessionStorage.getItem(smartKey || '') || '{}')

                const expiresMoment = moment.unix(tokenData?.expiresAt || 0);
                const diffExpiry = moment().diff(expiresMoment);
                const reminderTimeout = +process.env.REACT_APP_CLIENT_SESSION_TIMEOUT_REMINDER! || -60000;
                setRemainingTime(diffExpiry)

                // logout if expired
                if (diffExpiry > 0) {
                    clearInterval(timer.current);
                    setLogout(true)
                    props.onLogout();
                    setShowModal(false)
                }

                // reminder to set in one minute before expiry
                if (tokenData && diffExpiry > reminderTimeout && !isContinueSession) {
                    setShowModal(true)
                }
            }, 1000)
        } else {
            clearInterval(timer.current);
        }

    }, [isContinueSession, isLogout, props])

    const handleContinue = useCallback(() => {
        setShowModal(false)
        setContinueSession(true)
    }, [])

    const handleLogout = useCallback(() => {
        clearInterval(timer.current);
        setLogout(true)
        props.onLogout();
        setShowModal(false)

    }, [props, setLogout, setShowModal])

    useEffect(() => {
        startExpiryChecker();
        return () => {
            clearInterval(timer.current);
        }
    }, [startExpiryChecker])

    useEffect(() => {
        if (props.isLoggedOut) {
            clearInterval(timer.current);
            setLogout(true)
            setShowModal(false)
        }
    }, [handleLogout, props.isLoggedOut])

    return (
        <div>
            <SessionExpiredReminderModal
                showModal={showModal}
                handleLogout={handleLogout}
                handleContinue={handleContinue}
                remainingTime={remainingTime}
            />
        </div>
    )

}

export default SessionExpiredHandler;