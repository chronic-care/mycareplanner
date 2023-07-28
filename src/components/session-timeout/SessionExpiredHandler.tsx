import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
    const [sessionStartTime, setSessionStartTime] = useState(moment().unix())

    let timer: any = useRef(null);

    const sessionStartTimeddd = useMemo(() => {
        return moment().unix()
    }, [isContinueSession])

    const startExpiryChecker = useCallback(() => {
        if (!isLogout) {
            timer.current = setInterval(() => {
                const smartKey = JSON.parse(sessionStorage.getItem('SMART_KEY') || '{}')
                const tokenData: TokenData | null = JSON.parse(sessionStorage.getItem(smartKey || '') || '{}')

                const sessionExpiredTimeout = +process.env.REACT_APP_CLIENT_SESSION_TIMEOUT_REMINDER! || 600;
                const expiresMoment = sessionStartTime+sessionExpiredTimeout;
                const diffExpiry = moment().unix()-expiresMoment;


                console.error('startExpiryChecker  sessionStartTime '+ sessionStartTime); 
                console.error('startExpiryChecker  sessionExpiredTimeout '+ sessionExpiredTimeout); 
                console.error('startExpiryChecker  expiresMoment '+ expiresMoment); 
                console.error('startExpiryChecker  diffExpiry '+ diffExpiry); 
                console.error('startExpiryChecker  diffExpiry '+ (diffExpiry > sessionExpiredTimeout)); 
               
                setRemainingTime(diffExpiry)

                // logout if expired
                if (diffExpiry > 0) {
                    clearInterval(timer.current);
                    setLogout(true)
                    props.onLogout();
                    setShowModal(false)
                    window.location.reload();
                }

                // // reminder to set in one minute before expiry

                console.error('startExpiryChecker  (diffExpiry+60 > sessionExpiredTimeout) '+(diffExpiry+60 > sessionExpiredTimeout)); 

                if (diffExpiry > -60) {
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
        setSessionStartTime(moment().unix()) 
        console.error('handleContinue '+ sessionStartTime); 
        console.error('handleContinue '+ sessionStartTime); 
        console.error('handleContinue '+ sessionStartTime); 
        

    }, [])

    const handleLogout = useCallback(() => {
        clearInterval(timer.current);
        setLogout(true)
        props.onLogout();
        setShowModal(false)
        window.location.reload();

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