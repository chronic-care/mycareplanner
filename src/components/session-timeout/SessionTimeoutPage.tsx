import React from "react";
import './SessionTimeoutPage.css';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


export const SessionTimeoutPage = (props: any) => {
    return <div className="session-timeout-page">
        <div className="confirmation-container">
            <h1> <FontAwesomeIcon size="2x" icon={faSignOutAlt} className="session-timeout-icon" /></h1>
            <h2>You have been logged out</h2>
            <p>Please login again using meld dashboard</p>
        </div>
    </div>
}